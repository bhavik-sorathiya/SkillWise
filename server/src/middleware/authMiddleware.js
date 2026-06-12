/**
 * Authentication Middleware
 * Verifies JWT token and attaches user information to request
 * Security Layer - Prevents unauthorized access
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and extract user information
 * Middleware function that checks Authorization header for valid JWT token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
        code: 'NO_AUTH_HEADER'
      });
    }

    // Validate header format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Use: Bearer <token>',
        code: 'INVALID_AUTH_FORMAT'
      });
    }

    const token = parts[1];

    // Verify token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Check if decoded token has required fields
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({
        success: false,
        message: 'Token does not contain required user information',
        code: 'INVALID_TOKEN_DATA'
      });
    }

    // Attach user information to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      full_name: decoded.full_name || null
    };

    // Proceed to next middleware
    next();

  } catch (error) {
    // Handle JWT verification errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = { verifyToken };
