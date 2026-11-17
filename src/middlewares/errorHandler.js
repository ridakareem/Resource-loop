import config from '../config/env.js';

/**
 * Global Centralized Error Handling Middleware
 * Must have 4 arguments (err, req, res, next) for Express to recognize it as an error handler.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle malformed JSON body errors sent by express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload received in request body';
  }

  // Response payload
  const response = {
    success: false,
    statusCode,
    message,
    ...(errors.length > 0 && { errors }),
    // Include stack trace only in non-production environments
    ...(!config.isProduction && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
