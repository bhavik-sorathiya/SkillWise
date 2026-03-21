// server/src/routes/skillsRoutes.js
// Skills API routes used by resume page for CRUD operations on user skills.
const express = require('express');
const router = express.Router();
const { addSkill, deleteSkill, updateSkill, getSkills } = require('../controllers/skillsController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

// All skill routes require authentication
router.use(verifyToken);

// Get user's skills (from profile)
router.get('/', catchAsync(getSkills));

// Add a new skill (to both profile and resume analysis)
router.post('/add', catchAsync(addSkill));

// Update a skill by skill name (updates both profile and resume analysis)
router.put('/:skillName', catchAsync(updateSkill));

// Delete a skill by skill name (removes from both profile and resume analysis)
router.delete('/:skillName', catchAsync(deleteSkill));

module.exports = router;

