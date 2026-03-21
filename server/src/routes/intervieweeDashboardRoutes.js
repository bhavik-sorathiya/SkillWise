// server/src/routes/intervieweeDashboardRoutes.js
// Routes for interviewee dashboard data and related analysis endpoints.

const express = require('express');
const router = express.Router();
const { getDashboardData, getResumeAnalysisData } = require('../controllers/intervieweeDashboardController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

// Protected routes - require authentication
// GET /api/interviewee/dashboard - Get dashboard data for logged-in interviewee
router.get('/dashboard', verifyToken, catchAsync(getDashboardData));

// GET /api/interviewee/resume-analysis - Get resume & skills analysis data
router.get('/resume-analysis', verifyToken, catchAsync(getResumeAnalysisData));

module.exports = router;
