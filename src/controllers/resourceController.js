import { ApiError } from '../utils/apiError.js';
import { supabaseAdmin } from '../config/supabase.js';
import { deleteResourcePhoto } from '../utils/storageHelper.js';

// Established valid conditions in PostgreSQL constraint (resources_condition_check)
const ALLOWED_CONDITIONS = ['new', 'good', 'fair'];

// Established valid statuses in PostgreSQL constraint (resources_status_check)
const ALLOWED_STATUSES = ['available', 'borrowed', 'unavailable'];

// Established initial status
const INITIAL_STATUS = 'available';

// UUID validation regex (standard 8-4-4-4-12 hexadecimal structure)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_SEARCH_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 100;

/**
 * Read a single query-string value.
 * Repeated keys arrive as an array; only the first string value is used.
 */
const firstQueryValue = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string');
    return typeof first === 'string' ? first : '';
  }
  return '';
};

/**
 * Treat `\`, `%`, and `_` as literal characters inside ILIKE patterns.
 * PostgreSQL uses `\` as the default LIKE escape character.
 */
const escapeLikePattern = (value) =>
  value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

/**
 * Wrap a filter value so PostgREST treats it as a literal.
 * Commas, dots, parentheses, and quotes stay inside the value instead of
 * changing the filter tree. Backslashes are escaped for the PostgREST lexer,
 * which decodes `\\` and `\"` before binding the value as a query parameter.
 */
const quotePostgrestValue = (value) =>
  `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/**
 * Helper to format raw database resource row into standard API resource object
 */
const formatResource = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  description: row.description,
  category: row.category,
  condition: row.condition,
  photoUrl: row.photo_url,
  status: row.status,
  createdAt: row.created_at,
  ...(row.owner && {
    owner: {
      id: row.owner.id,
      name: row.owner.name,
      location: row.owner.location,
    },
  }),
});

/**
 * @desc    Create a new resource
 * @route   POST /api/resources
 * @access  Private (Requires Bearer token)
 */
export const createResource = async (req, res, next) => {
  try {
    // 1. Obtain authenticated owner ID strictly from verified token
    const ownerId = req.user?.id;

    if (!ownerId) {
      throw new ApiError(401, 'Unauthorized. Valid user authentication required.');
    }

    const { title, description, category, condition, photo_url } = req.body;

    // 2. Validate required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new ApiError(400, 'Title is required and must be a non-empty string.');
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      throw new ApiError(400, 'Category is required and must be a non-empty string.');
    }

    if (!condition || typeof condition !== 'string' || !condition.trim()) {
      throw new ApiError(
        400,
        `Condition is required. Must be one of: ${ALLOWED_CONDITIONS.join(', ')}.`
      );
    }

    // Normalize condition to lowercase to match database check constraint
    const normalizedCondition = condition.trim().toLowerCase();
    if (!ALLOWED_CONDITIONS.includes(normalizedCondition)) {
      throw new ApiError(
        400,
        `Invalid condition '${condition}'. Allowed values are: ${ALLOWED_CONDITIONS.join(', ')}.`
      );
    }

    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const cleanDescription = description && typeof description === 'string' ? description.trim() : null;
    const cleanPhotoUrl = photo_url && typeof photo_url === 'string' ? photo_url.trim() : null;

    // 3. Construct insert payload using existing 9 database columns only
    const newResource = {
      owner_id: ownerId,
      title: cleanTitle,
      description: cleanDescription,
      category: cleanCategory,
      condition: normalizedCondition,
      photo_url: cleanPhotoUrl,
      status: INITIAL_STATUS,
    };

    // 4. Insert into Supabase resources table using RLS user client
    const client = req.userClient || supabaseAdmin;
    const { data: createdResource, error } = await client
      .from('resources')
      .insert(newResource)
      .select('id, owner_id, title, description, category, condition, photo_url, status, created_at')
      .single();

    if (error) {
      throw new ApiError(500, `Database error creating resource: ${error.message}`);
    }

    if (!createdResource) {
      throw new ApiError(500, 'Failed to create resource. No record returned by database.');
    }

    // 5. Return created resource with consistent JSON envelope
    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: {
        resource: formatResource(createdResource),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch resources available for browsing with optional search, category filter, and pagination
 * @route   GET /api/resources?search=&category=&page=&limit=
 * @access  Public
 */
export const getAllResources = async (req, res, next) => {
  try {
    const client = req.userClient || supabaseAdmin;

    // 1. Initialize query on available resources, joining safe owner details.
    //    Column names below are fixed. User input is only bound as filter values.
    let query = client
      .from('resources')
      .select(`
        id,
        owner_id,
        title,
        description,
        category,
        condition,
        photo_url,
        status,
        created_at,
        owner:owner_id (
          id,
          name,
          location
        )
      `, { count: 'exact' })
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    // 2. Exact, case-insensitive category match. Blank values leave the list unfiltered.
    //    Quoted inside .or() so reserved characters stay in the value. .ilike() does not
    //    strip those quotes, which would make the category compare fail.
    const cleanCategory = firstQueryValue(req.query.category).trim().slice(0, MAX_CATEGORY_LENGTH);
    if (cleanCategory) {
      const categoryPattern = quotePostgrestValue(escapeLikePattern(cleanCategory));
      query = query.or(`category.ilike.${categoryPattern}`);
    }

    // 3. Case-insensitive match against title OR description.
    //    An empty or whitespace-only search is ignored so the unfiltered list is returned.
    const cleanSearch = firstQueryValue(req.query.search).trim().slice(0, MAX_SEARCH_LENGTH);
    if (cleanSearch) {
      const searchPattern = quotePostgrestValue(`%${escapeLikePattern(cleanSearch)}%`);
      query = query.or(
        `title.ilike.${searchPattern},description.ilike.${searchPattern}`
      );
    }

    // 4. Pagination. Defaults keep GET /api/resources usable when page and limit are omitted.
    const parsedPage = Math.max(DEFAULT_PAGE, parseInt(firstQueryValue(req.query.page), 10) || DEFAULT_PAGE);
    const parsedLimit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(firstQueryValue(req.query.limit), 10) || DEFAULT_PAGE_SIZE)
    );
    const from = (parsedPage - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    query = query.range(from, to);

    // 5. Execute query
    const { data: resources, count: totalCount, error } = await query;

    if (error) {
      throw new ApiError(500, `Database error searching resources: ${error.message}`);
    }

    const formattedResources = (resources || []).map(formatResource);

    res.status(200).json({
      success: true,
      message: 'Resources retrieved successfully',
      data: {
        pagination: {
          total: totalCount || 0,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil((totalCount || 0) / parsedLimit),
        },
        count: formattedResources.length,
        resources: formattedResources,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch one resource by its UUID
 * @route   GET /api/resources/:id
 * @access  Public
 */
export const getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      throw new ApiError(400, 'Invalid resource ID. Must be a valid UUID.');
    }

    const client = req.userClient || supabaseAdmin;

    // 2. Fetch resource by id with owner details
    const { data: resource, error } = await client
      .from('resources')
      .select(`
        id,
        owner_id,
        title,
        description,
        category,
        condition,
        photo_url,
        status,
        created_at,
        owner:owner_id (
          id,
          name,
          location
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, `Database error fetching resource: ${error.message}`);
    }

    // 3. Handle resource that does not exist
    if (!resource) {
      throw new ApiError(404, 'Resource not found.');
    }

    res.status(200).json({
      success: true,
      message: 'Resource retrieved successfully',
      data: {
        resource: formatResource(resource),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch resources owned by the authenticated user (newest first)
 * @route   GET /api/users/me/resources
 * @access  Private (Requires Bearer token)
 */
export const getMyResources = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized. Valid user authentication required.');
    }

    const client = req.userClient || supabaseAdmin;

    // Fetch all resources owned by the user, ordered newest first
    const { data: resources, error } = await client
      .from('resources')
      .select('id, owner_id, title, description, category, condition, photo_url, status, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, `Database error fetching user resources: ${error.message}`);
    }

    const formattedResources = (resources || []).map(formatResource);

    res.status(200).json({
      success: true,
      message: 'User resources retrieved successfully',
      data: {
        count: formattedResources.length,
        resources: formattedResources,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing resource (Owner only)
 * @route   PUT /api/resources/:id
 * @access  Private (Requires Bearer token)
 */
export const updateResource = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      throw new ApiError(400, 'Invalid resource ID. Must be a valid UUID.');
    }

    // 2. Verify caller authentication
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized. Valid user authentication required.');
    }

    // 3. Verify resource existence and ownership
    const { data: existingResource, error: fetchError } = await supabaseAdmin
      .from('resources')
      .select('id, owner_id, photo_url')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw new ApiError(500, `Database error: ${fetchError.message}`);
    }

    if (!existingResource) {
      throw new ApiError(404, 'Resource not found.');
    }

    if (existingResource.owner_id !== userId) {
      throw new ApiError(
        403,
        'Forbidden. You do not have permission to edit this resource because you are not the owner.'
      );
    }

    // 4. Security checks: Prevent modifying protected fields
    const {
      id: reqId,
      owner_id,
      ownerId,
      created_at,
      createdAt,
      title,
      description,
      category,
      condition,
      status,
      photo_url,
    } = req.body;

    if (owner_id !== undefined || ownerId !== undefined) {
      throw new ApiError(403, 'Forbidden. You cannot modify or transfer resource ownership.');
    }

    if (reqId !== undefined && reqId !== id) {
      throw new ApiError(403, 'Forbidden. You cannot modify the resource ID.');
    }

    if (created_at !== undefined || createdAt !== undefined) {
      throw new ApiError(400, 'Cannot modify created_at timestamp.');
    }

    // 5. Validate updatable fields
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        throw new ApiError(400, 'Title must be a non-empty string.');
      }
      updates.title = title.trim();
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        throw new ApiError(400, 'Category must be a non-empty string.');
      }
      updates.category = category.trim();
    }

    if (condition !== undefined) {
      if (typeof condition !== 'string' || !condition.trim()) {
        throw new ApiError(400, `Condition must be one of: ${ALLOWED_CONDITIONS.join(', ')}.`);
      }
      const normalizedCondition = condition.trim().toLowerCase();
      if (!ALLOWED_CONDITIONS.includes(normalizedCondition)) {
        throw new ApiError(
          400,
          `Invalid condition '${condition}'. Allowed values are: ${ALLOWED_CONDITIONS.join(', ')}.`
        );
      }
      updates.condition = normalizedCondition;
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || !status.trim()) {
        throw new ApiError(400, `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
      }
      const normalizedStatus = status.trim().toLowerCase();
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        throw new ApiError(
          400,
          `Invalid status '${status}'. Allowed values are: ${ALLOWED_STATUSES.join(', ')}.`
        );
      }
      updates.status = normalizedStatus;
    }

    if (description !== undefined) {
      updates.description = description === null ? null : String(description).trim();
    }

    if (photo_url !== undefined) {
      updates.photo_url = photo_url === null ? null : String(photo_url).trim();
    }

    // Ensure at least one field is provided
    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, 'Please provide at least one valid field to update.');
    }

    // 6. Execute update using userClient
    const client = req.userClient || supabaseAdmin;
    const { data: updatedResource, error: updateError } = await client
      .from('resources')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', userId)
      .select(`
        id,
        owner_id,
        title,
        description,
        category,
        condition,
        photo_url,
        status,
        created_at,
        owner:owner_id (
          id,
          name,
          location
        )
      `)
      .single();

    if (updateError) {
      throw new ApiError(500, `Database error updating resource: ${updateError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: {
        resource: formatResource(updatedResource),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resource (Owner only)
 * @route   DELETE /api/resources/:id
 * @access  Private (Requires Bearer token)
 */
export const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      throw new ApiError(400, 'Invalid resource ID. Must be a valid UUID.');
    }

    // 2. Verify caller authentication
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized. Valid user authentication required.');
    }

    // 3. Verify resource existence and ownership
    const { data: existingResource, error: fetchError } = await supabaseAdmin
      .from('resources')
      .select('id, owner_id, photo_url')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw new ApiError(500, `Database error: ${fetchError.message}`);
    }

    if (!existingResource) {
      throw new ApiError(404, 'Resource not found.');
    }

    if (existingResource.owner_id !== userId) {
      throw new ApiError(
        403,
        'Forbidden. You do not have permission to delete this resource because you are not the owner.'
      );
    }

    // 4. If resource has an associated photo, remove it from Supabase Storage
    if (existingResource.photo_url) {
      await deleteResourcePhoto(existingResource.photo_url);
    }

    // 5. Delete resource from database using userClient
    const client = req.userClient || supabaseAdmin;
    const { error: deleteError } = await client
      .from('resources')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId);

    if (deleteError) {
      throw new ApiError(500, `Database error deleting resource: ${deleteError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createResource,
  getAllResources,
  getResourceById,
  getMyResources,
  updateResource,
  deleteResource,
};
