// server/src/routes/authRoutes.js
const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

const router = express.Router();

// Public routes
router.post('/signup', catchAsync(signup));
router.post('/login', catchAsync(login));

// Protected routes
router.post('/logout', verifyToken, catchAsync(logout));

module.exports = router;
