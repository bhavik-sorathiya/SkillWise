// server/src/routes/profileRoutes.js
// Profile API: get profile, update profile, mark onboarding complete

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, markProfileComplete } = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

// All profile routes require authentication
// GET /api/profile — fetch current user's profile
router.get('/', verifyToken, catchAsync(getProfile));

// PUT /api/profile — update profile fields (any subset)
router.put('/', verifyToken, catchAsync(updateProfile));

// PATCH /api/profile/complete — mark onboarding as done
router.patch('/complete', verifyToken, catchAsync(markProfileComplete));

module.exports = router;
