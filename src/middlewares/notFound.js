import { ApiError } from '../utils/apiError.js';

/**
 * 404 Handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route not found: [${req.method}] ${req.originalUrl}`
  );
  next(error);
};

export default notFoundHandler;
