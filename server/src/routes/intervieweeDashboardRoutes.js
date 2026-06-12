// server/src/routes/intervieweeDashboardRoutes.js
// Routes for interviewee dashboard data.

const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/intervieweeDashboardController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

// Protected routes - require authentication
// GET /api/interviewee/dashboard - Aggregate dashboard data for the logged-in user
router.get('/dashboard', verifyToken, catchAsync(getDashboardData));

module.exports = router;
