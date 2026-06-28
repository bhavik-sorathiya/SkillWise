const jwt = require('jsonwebtoken');

const verifyAdminRole = (req, res, next) => {
  // We assume verifyToken has already run and populated req.user
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authenticated user found.',
    });
  }

  // Check if role is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

module.exports = { verifyAdminRole };
