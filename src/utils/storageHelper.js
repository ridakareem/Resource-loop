import { supabaseAdmin } from '../config/supabase.js';

export const BUCKET_NAME = 'resource-images';

/**
 * Extracts storage object path from a Supabase Storage URL or path
 * e.g., 'https://<project>.supabase.co/storage/v1/object/public/resource-images/user_123/img.jpg' -> 'user_123/img.jpg'
 *
 * @param {string} photoUrl
 * @returns {string|null}
 */
export const extractStoragePath = (photoUrl) => {
  if (!photoUrl || typeof photoUrl !== 'string') return null;

  const bucketPrefix = `${BUCKET_NAME}/`;
  const bucketIndex = photoUrl.indexOf(bucketPrefix);

  if (bucketIndex !== -1) {
    const rawPath = photoUrl.slice(bucketIndex + bucketPrefix.length);
    // Strip query parameters if present (e.g., token or cache buster)
    return rawPath.split('?')[0];
  }

  // If already a relative path (not containing http), strip leading slashes
  if (!photoUrl.startsWith('http')) {
    return photoUrl.replace(/^\/+/, '');
  }

  return null;
};

/**
 * Deletes an associated resource photo from Supabase Storage
 *
 * @param {string} photoUrl - The URL or path of the photo to delete
 * @returns {Promise<boolean>}
 */
export const deleteResourcePhoto = async (photoUrl) => {
  try {
    const filePath = extractStoragePath(photoUrl);
    if (!filePath) {
      return false;
    }

    if (!supabaseAdmin) {
      console.warn('Cannot delete storage file: supabaseAdmin is not initialized.');
      return false;
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.warn(`Storage removal notice for '${filePath}':`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Error during storage file deletion:', err.message);
    return false;
  }
};

/**
 * Generates a storage object path for a resource image.
 * Format: resources/{userId}/{resourceId}-{sanitizedFileName}
 *
 * @param {string} userId - Owner user ID (used for path namespacing, not for access control)
 * @param {string} resourceId - Resource UUID (used for path namespacing)
 * @param {string} originalName - Original file name
 * @returns {string}
 */
export const buildStoragePath = (userId, resourceId, originalName) => {
  const safeName = String(originalName)
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/\s+/g, '_');
  return `resources/${userId}/${resourceId}-${safeName}`;
};

/**
 * Uploads an image buffer to the Supabase Storage bucket using the service-role
 * client (backend only). Service-role credentials are never exposed to the frontend.
 *
 * @param {Buffer} fileBuffer - File contents (from Multer memory storage)
 * @param {string} filePath - Storage object path
 * @param {string} mimetype - File MIME type
 * @returns {Promise<{ path: string, fullPath: string, bucket: string }>}
 */
export const uploadResourcePhoto = async (fileBuffer, filePath, mimetype) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not initialized. Configure SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return {
    path: data.path,
    fullPath: data.fullPath,
    bucket: BUCKET_NAME,
  };
};

/**
 * Generates a temporary signed URL for a private bucket object.
 * The URL is time-limited and can be used by the frontend to display the image
 * without exposing the object publicly.
 *
 * @param {string} filePath - Storage object path
 * @param {number} expiresIn - Seconds until the signed URL expires (default 3600 / 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export const getResourcePhotoSignedUrl = async (filePath, expiresIn = 3600) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not initialized. Configure SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
};

export default {
  BUCKET_NAME,
  extractStoragePath,
  deleteResourcePhoto,
  buildStoragePath,
  uploadResourcePhoto,
  getResourcePhotoSignedUrl,
};
