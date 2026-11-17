import multer from 'multer';
import { ApiError } from '../utils/apiError.js';

// Allowed MIME types mirror the Supabase Storage bucket configuration.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Match the bucket's 5 MB file_size_limit (5242880 bytes).
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Memory storage: keeps the uploaded file in a Buffer (req.file.buffer)
 * so it can be streamed directly to Supabase Storage without writing to disk.
 */
const storage = multer.memoryStorage();

/**
 * File filter: accept only the configured image MIME types.
 * Rejects arbitrary/unsafe file types.
 */
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(
        415,
        `Unsupported file type "${file.mimetype}". Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}.`
      ),
      false
    );
  }
  cb(null, true);
};

/**
 * Multer instance configured for a single image file under the field name `image`.
 * Limits protect against oversized uploads and non-image files.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Express wrapper that converts multer errors into ApiError instances so the
 * centralized errorHandler can format them consistently.
 */
export const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            413,
            `Image too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`
          )
        );
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Only one image file is allowed.'));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ApiError(400, 'Unexpected file field. Use the field name "image".'));
      }
      return next(new ApiError(400, err.message || 'File upload error.'));
    }
    if (err) {
      return next(err);
    }
    next();
  });
};

export default { upload, uploadImage };
