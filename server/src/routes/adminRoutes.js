const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers } = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyAdminRole } = require('../middleware/adminAuth');

router.use(verifyToken, verifyAdminRole);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);

module.exports = router;
