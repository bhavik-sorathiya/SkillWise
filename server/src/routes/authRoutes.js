// server/src/routes/authRoutes.js
const express = require('express');
const { signup, login, logout, updateName, changePassword, googleLogin } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

const router = express.Router();

// Public routes
router.post('/signup', catchAsync(signup));
router.post('/login', catchAsync(login));
router.post('/google', catchAsync(googleLogin));

// Protected routes
router.post('/logout', verifyToken, catchAsync(logout));
router.patch('/update-name', verifyToken, catchAsync(updateName));
router.post('/change-password', verifyToken, catchAsync(changePassword));

module.exports = router;
