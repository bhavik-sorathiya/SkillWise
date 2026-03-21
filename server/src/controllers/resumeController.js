// server/src/controllers/resumeController.js
// Handles resume lifecycle: upload, parsing, AI analysis orchestration, and analysis retrieval.

const UserResume = require('../models/userResumeModel');
const UserProfile = require('../models/userProfileModel');
const ResumeAnalysis = require('../models/resumeAnalysisModel');
const { AppError } = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');
const { extractTextFromDocx, validateExtractedText, prepareTextForAI } = require('../utils/resumeParser');
const { getAnalysisPromptConfig, validateResumeText } = require('../utils/promptGenerator');
const { validateAndSanitizeAnalysis } = require('../utils/responseValidator');
const { analyzeResume, isInitialized: isGeminiInitialized } = require('../utils/geminiService');

const MAX_RESUMES_ALLOWED = 3;

// Convert absolute timestamps to UI-friendly relative labels.
const formatRelativeDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
};

const normalizeMimeType = (mimeType) => {
  if (!mimeType) {
    return null;
  }

  const lower = mimeType.toLowerCase();

  if (lower === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }

  if (lower === 'application/pdf') {
    return 'pdf';
  }

  if (lower.includes('/')) {
    return lower.split('/')[1];
  }

  return lower;
};

const getFileType = (fileName, fileType) => {
  if (fileType) {
    return normalizeMimeType(fileType);
  }

  if (!fileName) {
    return null;
  }

  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
};

// GET /api/resumes/list
// Build lightweight resume cards metadata for dashboard listing.
const getResumesList = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Unauthorized: User information not found in token', 401);
  }

  const resumes = await UserResume.getResumesByUserId(userId);
  const total = resumes.length;

  const formattedResumes = resumes.map((resume, index) => {
    const uploadedAt = resume.uploaded_at ? new Date(resume.uploaded_at) : null;

    return {
      id: resume.id,
      name: resume.file_name,
      uploadedDate: formatRelativeDate(resume.uploaded_at),
      type: getFileType(resume.file_name, resume.file_type),
      uploadedAt: uploadedAt ? uploadedAt.toISOString() : null,
      isPrimary: index === 0
    };
  });

  res.status(200).json({
    success: true,
    data: {
      resumes: formattedResumes,
      total,
      maxAllowed: MAX_RESUMES_ALLOWED,
      canUpload: total < MAX_RESUMES_ALLOWED
    }
  });
};

/**
 * Analyze resume using Gemini AI
 * Orchestrates the complete analysis pipeline: prompt generation, API call, validation, storage
 * @param {string} resumeText - Extracted and prepared resume text
 * @param {number} resumeId - Resume record ID for storage
 * @param {number} userId - User ID for storage
 * @param {Object} userInputs - User provided context
 * @param {string} userInputs.targetRole - Target job role/title (AI-driven role-specific analysis)
 * NOTE: Experience level and years are DETECTED by AI from resume dates, not user input
 * @returns {Promise<{success: boolean, analysis: Object|null, analysisId: number|null, error: string|null}>}
 */
const analyzeResumeWithGemini = async (resumeText, resumeId, userId, userInputs = {}) => {
  try {
    // Step 1: Validate Gemini is initialized
    if (!isGeminiInitialized()) {
      console.warn('Gemini AI not initialized - skipping automatic resume analysis');
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: 'Gemini AI is not initialized. Resume analysis will be performed manually.',
        skipped: true
      };
    }

    // Step 2: Validate resume text format and content
    const textValidation = validateResumeText(resumeText);
    if (!textValidation.isValid) {
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: `Resume text validation failed: ${textValidation.errors.join('; ')}`
      };
    }

    // Step 3: Generate analysis prompt with user inputs
    let promptConfig;
    try {
      promptConfig = getAnalysisPromptConfig(resumeText, userInputs);
    } catch (error) {
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: `Failed to generate analysis prompt: ${error.message}`
      };
    }

    // Step 4: Call Gemini API
    const analysisTimeout = parseInt(process.env.RESUME_ANALYSIS_TIMEOUT) || 30000;
    console.log('Calling Gemini API with prompt config...');
    const analysisResult = await analyzeResume(promptConfig.userPrompt, {
      systemPrompt: promptConfig.systemPrompt,
      timeout: analysisTimeout
    });

    console.log('Gemini API response:', {
      success: analysisResult.success,
      hasAnalysis: !!analysisResult.analysis,
      error: analysisResult.error
    });

    if (!analysisResult.success) {
      console.error('Gemini API call failed:', analysisResult.error);
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: analysisResult.error
      };
    }

    // Step 5: Validate and sanitize response
    const validation = validateAndSanitizeAnalysis(analysisResult.analysis);

    if (!validation.success) {
      console.error('Analysis validation failed:', validation.errors);
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: `Analysis validation failed: ${validation.errors.join('; ')}`
      };
    }

    // Step 6: Store analysis in database
    let analysisId;
    try {
      analysisId = await ResumeAnalysis.createAnalysis(
        resumeId,
        userId,
        validation.data
      );
    } catch (dbError) {
      console.error('Database storage error:', dbError);
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: `Failed to store analysis in database: ${dbError.message}`
      };
    }

    // Success
    console.log(`✓ Resume analysis completed and stored (ID: ${analysisId})`);
    return {
      success: true,
      analysis: validation.data,
      analysisId,
      error: null,
      warnings: validation.warnings
    };
  } catch (error) {
    console.error('Unexpected error during resume analysis:', error);
    return {
      success: false,
      analysis: null,
      analysisId: null,
      error: `Unexpected error during analysis: ${error.message}`
    };
  }
};

// POST /api/resumes/upload
// End-to-end flow: validate file, store resume, extract text, call AI, store analysis.
const uploadResume = async (req, res) => {
  let finalFilePath = null;

  try {
    console.log('\n📤 ========== RESUME UPLOAD STARTED ==========');
    const userId = req.user?.id;
    console.log(`[1] User ID: ${userId}`);

    // Validation: Check authentication
    if (!userId) {
      throw new AppError('Unauthorized: User information not found in token', 401);
    }

    // Validation: Check if file exists
    if (!req.file) {
      throw new AppError('No file provided. Please select a Word (DOCX) file to upload.', 400);
    }

    console.log('[2] File received:', req.file.originalname, `(${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Validation: Check file type (should only be DOCX)
    console.log('[3] Validating file type...');
    const allowedMimes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // Delete the uploaded file if it somehow passed filter
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError(`Invalid file type: ${req.file.mimetype}. Only DOCX (Word) files are allowed.`, 400);
    }

    // Validation: Check file size (max 3MB)
    console.log('[4] Checking file size...');
    const maxSize = 3 * 1024 * 1024;
    if (req.file.size > maxSize) {
      // Delete the uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError(`File size (${(req.file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 3MB limit. Please use a smaller Word file.`, 400);
    }

    // Check current resume count from database (max 3)
    const currentCount = await UserResume.getResumeCountByUserId(userId);
    console.log(`[5] Checking resume count: ${currentCount}/${MAX_RESUMES_ALLOWED}`);
    if (currentCount >= MAX_RESUMES_ALLOWED) {
      // Delete the uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError(`Maximum resume uploads (${MAX_RESUMES_ALLOWED}) reached. Delete an existing resume to upload a new one.`, 409);
    }

    // Get user information for filename
    const userInfo = await UserProfile.getUserById(userId);
    if (!userInfo) {
      // Delete the uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError('User information not found', 404);
    }

    // Generate new filename: userId_username_resume_resumeCount.docx
    const userName = userInfo.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const uploadsDir = path.join(__dirname, '../../uploads/resumes');
    let resumeCount = currentCount + 1;
    let newFileName = `${userId}_${userName}_resume_${resumeCount}.docx`;
    let newFilePath = path.join(uploadsDir, newFileName);

    while (fs.existsSync(newFilePath)) {
      resumeCount += 1;
      newFileName = `${userId}_${userName}_resume_${resumeCount}.docx`;
      newFilePath = path.join(uploadsDir, newFileName);
    }

    // Rename the temporary file to the new filename
    fs.renameSync(req.file.path, newFilePath);
    finalFilePath = newFilePath;

    // Save resume record to database
    console.log('[6] Creating resume record in database...');
    const fileType = getFileType(newFileName, req.file.mimetype);
    const resumeId = await UserResume.createResume(
      userId,
      newFileName,
      newFilePath,
      fileType
    );
    console.log(`[7] Resume created with ID: ${resumeId}`);

    // Extract text content from the uploaded resume for GenAI processing
    console.log('[8] Extracting text from DOCX...');
    const extractionResult = await extractTextFromDocx(newFilePath);
    let extractedText = '';
    let textExtractionMetadata = {
      success: extractionResult.success,
      characterCount: extractionResult.characterCount,
      wordCount: extractionResult.wordCount
    };

    if (extractionResult.success) {
      console.log(`[9] Text extracted: ${extractionResult.characterCount} chars, ${extractionResult.wordCount} words`);
    } else {
      console.log(`[9] ❌ Extraction failed: ${extractionResult.error}`);
    }

    if (extractionResult.success) {
      // Validate the extracted text
      const validation = validateExtractedText(extractionResult.text);
      textExtractionMetadata.isValid = validation.isValid;
      textExtractionMetadata.validationMessage = validation.message;

      if (validation.isValid) {
        console.log(`[10] Text validation: PASSED`);
        // Prepare text for GenAI API (optimize for cost and processing)
        extractedText = prepareTextForAI(extractionResult.text);
        console.log(`[11] Text prepared for AI: ${extractedText.length} chars`);
      } else {
        console.log(`[10] Text validation: FAILED - ${validation.message}`);
      }
    } else {
      textExtractionMetadata.error = extractionResult.error;
      console.log(`[10] ❌ Extraction error: ${extractionResult.error}`);
    }

    // Step 4: Perform Gemini AI analysis if text extraction was successful
    let analysisMetadata = {
      attempted: false,
      success: false,
      warning: null
    };

    console.log('[12] Checking if AI analysis should run...');

    if (extractionResult.success && extractedText) {
      console.log('[13] 🤖 Starting Gemini AI analysis...');
      
      // Extract target role from request body (only REQUIRED user input for analysis)
      // Experience level and years are DETECTED by AI from resume
      const userInputs = {
        targetRole: req.body.targetRole || req.body.target_role || 'Not Specified'
      };
      console.log('[14] Target role:', userInputs.targetRole);

      const analysisResponse = await analyzeResumeWithGemini(
        extractedText,
        resumeId,
        userId,
        userInputs
      );

      analysisMetadata.attempted = true;
      analysisMetadata.success = analysisResponse.success;

      if (analysisResponse.skipped) {
        analysisMetadata.warning = analysisResponse.error;
        console.log('[15] ⏭️ Analysis skipped:', analysisResponse.error);
      } else if (!analysisResponse.success) {
        analysisMetadata.warning = `Analysis failed: ${analysisResponse.error}`;
        console.log('[15] ❌ Analysis failed:', analysisResponse.error);
      } else {
        analysisMetadata.analysisId = analysisResponse.analysisId;
        if (analysisResponse.warnings) {
          analysisMetadata.warnings = analysisResponse.warnings;
        }
        console.log('[15] ✅ Analysis completed with ID:', analysisResponse.analysisId);
      }
    } else {
      console.log('[13] ℹ️ Analysis skipped (text extraction failed)');
    }

    // Build response with resume details
    console.log('[16] Building final response...');
    const newResume = {
      id: resumeId,
      name: newFileName,
      uploadedDate: formatRelativeDate(new Date()),
      type: fileType,
      uploadedAt: new Date().toISOString(),
      isPrimary: currentCount === 0
    };

    console.log('Resume uploaded and saved successfully:', {
      resumeId,
      fileName: newFileName,
      textExtractionMetadata,
      analysisMetadata
    });

    // Return resume as top-level data property (matches frontend expectations)
    console.log('[17] ✅ UPLOAD SUCCESSFUL');
    console.log('📋 Summary: ID=' + resumeId + ', Analysis=' + (analysisMetadata.success ? '✅' : analysisMetadata.attempted ? '❌' : '⏭️'));
    console.log('========================================\n');
    
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        ...newResume, // Spread resume properties at top level
        textExtractionMetadata: textExtractionMetadata,
        analysisMetadata: analysisMetadata
      }
    });
  } catch (error) {
    console.log('[ERROR] ❌ Upload failed:', error.message);
    console.log('========================================\n');
    // Clean up file if upload fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (finalFilePath && fs.existsSync(finalFilePath)) {
      fs.unlinkSync(finalFilePath);
    }
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      process.env.NODE_ENV === 'development' ? `Failed to upload resume: ${error.message}` : 'Failed to upload resume',
      500
    );
  }
};

// Get detailed analysis for a specific resume
const getResumeAnalysis = async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?.id;

  // Validation: Check authentication
  if (!userId) {
    throw new AppError('Unauthorized: User information not found in token', 401);
  }

  // Validation: Check resumeId format
  if (!resumeId || Number.isNaN(parseInt(resumeId, 10))) {
    throw new AppError('Invalid resume ID', 400);
  }

  console.log(`Fetching analysis for resumeId: ${resumeId}, userId: ${userId}`);

  // Fetch resume with analysis from database
  const resumeData = await UserResume.getResumeWithAnalysis(parseInt(resumeId, 10), userId);

  console.log('Resume data fetched:', {
    found: !!resumeData,
    hasAnalysis: !!resumeData?.analysis_data,
    resumeData: resumeData ? { resume_id: resumeData.resume_id, file_name: resumeData.file_name, analyzed_at: resumeData.analyzed_at } : null
  });

  // Validation: Check if resume exists and belongs to user
  if (!resumeData) {
    throw new AppError('Resume not found or you do not have access to it', 404);
  }

  // Validation: Check if analysis exists
  if (!resumeData.analysis_data) {
    throw new AppError('Resume analysis not found. Please upload and analyze this resume first.', 404);
  }

  // Transform database format to API response format
  const analysisResponse = transformAnalysisData(resumeData);

  res.status(200).json({
    success: true,
    data: analysisResponse
  });
};

/**
 * Transform database analysis data to API response format
 * @param {Object} resumeData - Resume data with analysis from database
 * @returns {Object} Transformed analysis data
 */
const transformAnalysisData = (resumeData) => {
  const dbData = resumeData.analysis_data;
  
  // Extract AI-detected experience from resume_context
  const detectedExperienceLevel = dbData.resume_context?.detected_experience_level || null;
  const detectedExperienceYears = dbData.resume_context?.detected_experience_years || null;
  
  // Transform ATS Analysis
  const atsAnalysis = dbData.ats_analysis ? {
    score: dbData.ats_analysis.score || null,
    verdict: dbData.ats_analysis.verdict || null,
    explanation: dbData.ats_analysis.explanation || null
  } : null;

  // Transform Experience Analysis
  const experienceAnalysis = dbData.experience_analysis ? {
    years_of_experience: detectedExperienceYears || null,
    level: detectedExperienceLevel
  } : null;

  // Transform Education Analysis
  const educationAnalysis = dbData.education_analysis?.educations 
    ? {
        educations: dbData.education_analysis.educations.map(edu => ({
          degree: edu.degree || null,
          field_of_study: edu.field_of_study || null,
          institution: edu.institution || null,
          graduation_year: edu.end_year || null,
          status: edu.status || null
        }))
      }
    : { educations: [] };

  // Transform Skills Analysis
  const skillsAnalysis = dbData.skills_analysis?.identified
    ? dbData.skills_analysis.identified.map((skill, index) => ({
        id: index + 1,
        name: skill.name || null,
        level: skill.level || null,
        isHighlighted: index === 0
      }))
    : [];

  // Transform SWOT Analysis (structure remains the same)
  const swotAnalysis = dbData.swot_analysis ? {
    strengths: dbData.swot_analysis.strengths || [],
    weaknesses: dbData.swot_analysis.weaknesses || [],
    opportunities: dbData.swot_analysis.opportunities || [],
    threats: dbData.swot_analysis.threats || []
  } : null;

  // Transform Resume Improvements
  const resumeImprovements = dbData.resume_improvements ? {
    high: transformImprovementPriority(dbData.resume_improvements.high_priority),
    medium: transformImprovementPriority(dbData.resume_improvements.medium_priority),
    low: transformImprovementPriority(dbData.resume_improvements.low_priority)
  } : { high: [], medium: [], low: [] };

  return {
    resume_id: resumeData.resume_id,
    resume_name: resumeData.file_name,
    ats_analysis: atsAnalysis,
    experience_analysis: experienceAnalysis,
    education_analysis: educationAnalysis,
    skills_analysis: skillsAnalysis,
    swot_analysis: swotAnalysis,
    resume_improvements: resumeImprovements
  };
};

/**
 * Transform improvement priority items from DB format to API format
 * Maps database fields to frontend expected structure
 * DB Format: { area, suggestion, impact }
 * API Format: { suggestion, reason, estimated_impact }
 * @param {Array} priorityItems - Array of improvement items from DB
 * @returns {Array} Transformed improvement items
 */
const transformImprovementPriority = (priorityItems) => {
  if (!Array.isArray(priorityItems)) {
    return [];
  }

  return priorityItems.map(item => ({
    suggestion: item.suggestion || null,
    reason: item.area || null,
    estimated_impact: item.impact || null
  }));
};

module.exports = {
  getResumesList,
  uploadResume,
  getResumeAnalysis
};
