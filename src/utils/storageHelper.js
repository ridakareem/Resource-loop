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

export default {
  BUCKET_NAME,
  extractStoragePath,
  deleteResourcePhoto,
};
