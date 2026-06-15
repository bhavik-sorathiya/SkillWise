/**
 * Error handling utility for Express
 * Standardizes error responses across the entire backend
 */

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper - catches errors in async route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => {
      console.error('[Async Handler Error]', error.message);
      
      // If error is an AppError, use its statusCode
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
      }

      // Handle database errors
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Duplicate entry. This resource already exists.'
        });
      }

      if (error.code && error.code.startsWith('ER_')) {
        return res.status(400).json({
          success: false,
          error: 'Database error. Please check your input.'
        });
      }

      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please login again.'
        });
      }

      // Handle multipart/form-data errors
      if (error.message === 'File too large' || error.message.includes('File')) {
        return res.status(413).json({
          success: false,
          error: error.message || 'File upload error'
        });
      }

      // Unexpected error
      console.error('[Unexpected Error]', error);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  };
};

/**
 * Validate request data
 * @param {Object} data - Data to validate
 * @param {Array} required - Required fields
 * @throws {AppError} If validation fails
 */
const validateRequest = (data, required = []) => {
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      400
    );
  }
};

/**
 * Global error handler middleware
 * Must be the last middleware in the Express app
 * Catches all errors and returns consistent error responses
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error('[Global Error Handler]', {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack
  });

  // If response headers already sent, delegate to Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Get status code
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'This resource already exists. Please use a unique value.'
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    return res.status(400).json({
      success: false,
      error: 'Database error. Please check your input and try again.'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token. Please login again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Your session has expired. Please login again.'
    });
  }

  // Handle file upload errors
  if (err.message && err.message.includes('File')) {
    return res.status(413).json({
      success: false,
      error: err.message || 'File upload failed. Please check the file size and type.'
    });
  }

  // Handle validation errors
  if (err.message && err.message.includes('Missing required')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Unexpected errors
  res.status(statusCode).json({
    success: false,
    error: isOperational 
      ? err.message 
      : process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  catchAsync,
  validateRequest,
  globalErrorHandler
};
