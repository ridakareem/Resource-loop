import { ApiError } from '../utils/apiError.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * @desc    Fetch logged-in user's profile
 * @route   GET /api/users/me
 * @access  Private (Requires Bearer token)
 */
export const getProfile = async (req, res, next) => {
  try {
    // 1. Obtain user ID strictly from the verified access token
    // NEVER trust or accept a user ID supplied by the frontend
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized. Valid user authentication required.');
    }

    // 2. Fetch the profile from the database using userClient (RLS-compliant)
    // Only select the 5 existing columns: id, name, email, location, created_at
    const client = req.userClient || supabaseAdmin;
    const { data: profile, error } = await client
      .from('users')
      .select('id, name, email, location, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, `Database error fetching profile: ${error.message}`);
    }

    if (!profile) {
      throw new ApiError(404, 'User profile not found.');
    }

    // 3. Return consistent JSON response
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          location: profile.location,
          createdAt: profile.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update logged-in user's name and location
 * @route   PUT /api/users/me
 * @access  Private (Requires Bearer token)
 */
export const updateProfile = async (req, res, next) => {
  try {
    // 1. Obtain user ID strictly from the verified access token
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized. Valid user authentication required.');
    }

    const { name, location, email, id, ...extraFields } = req.body;

    // 2. Security validation: Do not allow email changes through this endpoint
    if (email !== undefined) {
      throw new ApiError(
        400,
        'Email cannot be updated through this endpoint. Email is managed securely via Supabase Auth.'
      );
    }

    // 3. Security validation: Reject attempts to tamper with user ID
    if (id !== undefined && id !== userId) {
      throw new ApiError(
        403,
        'Forbidden. You are not allowed to specify or modify user IDs.'
      );
    }

    // 4. Validate that only valid columns (name, location) are provided
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        throw new ApiError(400, 'Name must be a non-empty string.');
      }
      updates.name = name.trim();
    }

    if (location !== undefined) {
      if (location !== null && typeof location !== 'string') {
        throw new ApiError(400, 'Location must be a string or null.');
      }
      updates.location = location === null ? null : location.trim();
    }

    // Ensure at least one field is being updated
    if (Object.keys(updates).length === 0) {
      throw new ApiError(
        400,
        'Please provide at least one field to update: "name" or "location".'
      );
    }

    // 5. Update user profile in public.users using userClient (RLS-enforced)
    const client = req.userClient || supabaseAdmin;
    const { data: updatedProfile, error } = await client
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, email, location, created_at')
      .maybeSingle();

    if (error) {
      throw new ApiError(500, `Database error updating profile: ${error.message}`);
    }

    if (!updatedProfile) {
      throw new ApiError(404, 'User profile not found.');
    }

    // 6. Return consistent JSON response with updated profile
    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: {
          id: updatedProfile.id,
          name: updatedProfile.name,
          email: updatedProfile.email,
          location: updatedProfile.location,
          createdAt: updatedProfile.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
};
