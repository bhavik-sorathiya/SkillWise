// server/src/routes/resumeRoutes.js
// Resume API routing: upload, list, and analysis retrieval endpoints.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getResumesList, uploadResume, getResumeAnalysis } = require('../controllers/resumeController');
const { verifyToken } = require('../middleware/authMiddleware');
const { catchAsync } = require('../utils/errorHandler');

// Ensure upload target directory exists before handling any file writes.
const uploadsDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config: save files on disk with temporary names.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use temporary filename - will be renamed in controller with user data
    // Format: temp_timestamp.docx
    const timestamp = Date.now();
    const filename = `temp_${timestamp}.docx`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB max
  },
  fileFilter: (req, file, cb) => {
    console.log('File being processed:', file.originalname, 'MIME type:', file.mimetype);
    // Only accept DOCX files
    const allowedMimes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only DOCX (Word) files are allowed. Received: ${file.mimetype}`));
    }
  }
});

// Standardized upload error mapping for size/type and multer-specific failures.
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 3MB limit. Please use a smaller DOCX file.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'An error occurred during file upload'
    });
  }
  next();
};

// Protected routes: every resume endpoint requires a valid JWT token.
// GET /api/resumes/list - Return all resumes uploaded by current user.
router.get('/list', verifyToken, catchAsync(getResumesList));

// POST /api/resumes/upload - Upload DOCX and trigger analysis pipeline.
router.post('/upload', verifyToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return uploadErrorHandler(err, req, res, next);
    }
    next();
  });
}, catchAsync(uploadResume));

// GET /api/resumes/analysis/:resumeId - Return analysis JSON for selected resume.
router.get('/analysis/:resumeId', verifyToken, catchAsync(getResumeAnalysis));

module.exports = router;
