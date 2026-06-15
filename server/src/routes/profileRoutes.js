// server/src/routes/profileRoutes.js
// Profile API: get profile, update profile, mark onboarding complete

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, markProfileComplete, getApiKey, updateApiKey, checkLimits } = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

// All profile routes require authentication
// GET /api/profile — fetch current user's profile
router.get('/', verifyToken, catchAsync(getProfile));

// PUT /api/profile — update profile fields (any subset)
router.put('/', verifyToken, catchAsync(updateProfile));

// PATCH /api/profile/complete — mark onboarding as done
router.patch('/complete', verifyToken, catchAsync(markProfileComplete));

// GET /api/profile/api-key — fetch user's Gemini API key status
router.get('/api-key', verifyToken, catchAsync(getApiKey));

// PUT /api/profile/api-key — update user's Gemini API key
router.put('/api-key', verifyToken, catchAsync(updateApiKey));

// GET /api/profile/check-limits — check daily limits for resume/interview
router.get('/check-limits', verifyToken, catchAsync(checkLimits));

module.exports = router;
