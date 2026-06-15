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
const UsageTracker = require('../utils/usageTracker');
const { uploadFileToSupabase, deleteFileFromSupabase } = require('../utils/cloudStorage');

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
// Build lightweight resume cards metadata for listing.
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
      // title is the user-facing display name; never expose raw file_name as primary
      title: resume.title || resume.file_name,
      name: resume.title || resume.file_name, // backward-compat alias for frontend
      target_role: resume.target_role || null,
      file_name: resume.file_name, // internal identity — NOT shown in UI
      status: resume.status || 'active',
      uploadedDate: formatRelativeDate(resume.uploaded_at),
      uploaded_at: uploadedAt ? uploadedAt.toISOString() : null,
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
    // Step 1: Check daily limits and get API key if needed
    let customApiKey = null;
    try {
      customApiKey = await UsageTracker.getApiKeyIfLimitExceeded(userId, 'resume');
    } catch (limitError) {
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: limitError.message,
        code: limitError.code
      };
    }

    // Step 2: Validate Gemini is initialized (if not using custom key)
    if (!customApiKey && !isGeminiInitialized()) {
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
    console.log(`Calling Gemini API with prompt config... (Using ${customApiKey ? 'custom API key' : 'system API key'})`);
    let analysisResult = await analyzeResume(promptConfig.userPrompt, {
      systemPrompt: promptConfig.systemPrompt,
      timeout: analysisTimeout,
      apiKey: customApiKey
    });

    console.log('Gemini API response:', {
      success: analysisResult.success,
      hasAnalysis: !!analysisResult.analysis,
      error: analysisResult.error
    });

    // Fallback Logic: If system key failed, try to fallback to user key
    if (!analysisResult.success && !customApiKey) {
      console.warn(`[Gemini Fallback] System key failed: ${analysisResult.error}. Checking for user custom API key...`);
      const UserApiKeyModel = require('../models/userApiKeyModel');
      const userKeyData = await UserApiKeyModel.getUserApiKey(userId);
      
      if (userKeyData && userKeyData.is_valid) {
        console.log(`[Gemini Fallback] Found user custom API key, retrying...`);
        customApiKey = userKeyData.api_key;
        analysisResult = await analyzeResume(promptConfig.userPrompt, {
          systemPrompt: promptConfig.systemPrompt,
          timeout: analysisTimeout,
          apiKey: customApiKey
        });
      }
    }

    if (!analysisResult.success) {
      console.error('Gemini API call failed:', analysisResult.error);
      return {
        success: false,
        analysis: null,
        analysisId: null,
        error: analysisResult.error,
        code: customApiKey ? 'INVALID_CUSTOM_API_KEY' : 'RATE_LIMIT_EXCEEDED'
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
  let resumeId = null;

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

    // Generate new filename: userId_username_resume_timestamp.docx
    const rawName = userInfo.full_name || userInfo.email?.split('@')[0] || 'user';
    const userName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const resumeCount = currentCount + 1;
    const timestamp = Date.now();
    const newFileName = `${userId}_${userName}_resume_${timestamp}.docx`;

    // Extract text content from the uploaded resume buffer
    console.log('[6] Extracting text from DOCX buffer...');
    const extractionResult = await extractTextFromDocx(req.file.buffer);
    if (!extractionResult.success) {
      console.log(`[7] ❌ Extraction failed: ${extractionResult.error}`);
      throw new AppError(extractionResult.error || 'Failed to extract text from DOCX file', 400);
    }
    const rawText = extractionResult.text;

    // Upload file to Supabase Storage
    console.log('[8] Uploading file to Supabase Storage...');
    const fileUrl = await uploadFileToSupabase(req.file.buffer, newFileName, req.file.mimetype);
    finalFilePath = fileUrl; // For cleanup if needed, but it's a URL now

    // Extract title and targetRole from request body
    const resumeTitle = req.body.title || req.body.targetRole || `Resume ${resumeCount}`;
    const resumeTargetRole = req.body.targetRole || req.body.target_role || 'Not Specified';

    // Save resume record to database with new schema fields
    console.log('[9] Creating resume record in database...');
    resumeId = await UserResume.createResume(
      userId,
      resumeTitle,
      resumeTargetRole,
      newFileName,
      fileUrl, // Store URL in file_path
      req.file.size || 0,
      rawText // New column
    );
    console.log(`[10] Resume created with ID: ${resumeId}`);

    console.log(`[9] Text extracted: ${extractionResult.characterCount} chars, ${extractionResult.wordCount} words`);

    // Validate the extracted text
    const validation = validateExtractedText(extractionResult.text);
    if (!validation.isValid) {
      console.log(`[10] Text validation: FAILED - ${validation.message}`);
      throw new AppError(validation.message || 'Extracted resume text is invalid', 400);
    }

    console.log(`[11] Text validation: PASSED`);
    // Prepare text for GenAI API (optimize for cost and processing)
    const extractedText = prepareTextForAI(extractionResult.text);
    console.log(`[12] Text prepared for AI: ${extractedText.length} chars`);

    // Step 4: Perform Gemini AI analysis
    let analysisMetadata = {
      attempted: true,
      success: false,
      warning: null
    };

    console.log('[12] Starting Gemini AI analysis...');
    
    // Extract target role from request body (only REQUIRED user input for analysis)
    // Experience level and years are DETECTED by AI from resume
    const userInputs = {
      targetRole: req.body.targetRole || req.body.target_role || 'Not Specified'
    };
    console.log('[13] Target role:', userInputs.targetRole);

    const analysisResponse = await analyzeResumeWithGemini(
      extractedText,
      resumeId,
      userId,
      userInputs
    );

    const isRateLimitError = (errorMsg) => {
      if (!errorMsg || typeof errorMsg !== 'string') return false;
      const lower = errorMsg.toLowerCase();
      return lower.includes('429') || 
             lower.includes('resource_exhausted') || 
             lower.includes('rate limit') || 
             lower.includes('quota');
    };

    if (!analysisResponse.success || analysisResponse.skipped) {
      console.log('[14] ❌ Analysis failed or skipped:', analysisResponse.error);
      if (isRateLimitError(analysisResponse.error)) {
        throw new AppError('Our free AI rate limits are currently exhausted. Please try again after some time.', 429, true, 'RATE_LIMIT_EXCEEDED');
      } else {
        throw new AppError(analysisResponse.error || 'Failed to analyze resume with AI', 400, true, analysisResponse.code);
      }
    }

    analysisMetadata.success = true;
    analysisMetadata.analysisId = analysisResponse.analysisId;
    if (analysisResponse.warnings) {
      analysisMetadata.warnings = analysisResponse.warnings;
    }
    console.log('[14] ✅ Analysis completed with ID:', analysisResponse.analysisId);

    // Build response with resume details
    console.log('[15] Building final response...');
    const newResume = {
      id: resumeId,
      title: resumeTitle,
      name: resumeTitle, // backward-compat alias
      target_role: resumeTargetRole,
      file_name: newFileName,
      status: 'active',
      uploadedDate: formatRelativeDate(new Date()),
      uploaded_at: new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
      isPrimary: currentCount === 0
    };

    console.log('Resume uploaded, parsed and analyzed successfully:', {
      resumeId,
      fileName: newFileName,
      analysisMetadata
    });

    console.log('[16] ✅ UPLOAD AND ANALYSIS SUCCESSFUL');
    console.log('========================================\n');
    
    res.status(201).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      data: {
        ...newResume, // Spread resume properties at top level
        textExtractionMetadata: {
          success: true,
          characterCount: extractionResult.characterCount,
          wordCount: extractionResult.wordCount,
          isValid: true,
          validationMessage: validation.message
        },
        analysisMetadata: analysisMetadata
      }
    });
  } catch (error) {
    console.log('[ERROR] ❌ Upload failed:', error.message);
    console.log('========================================\n');
    
    // Clean up temp multer files
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
    
    // Clean up final destination files (Supabase Storage)
    if (finalFilePath && finalFilePath.startsWith('http')) {
      try {
        const filename = finalFilePath.split('/').pop();
        await deleteFileFromSupabase(filename);
      } catch (err) {
        console.error('Error deleting final file from Supabase:', err);
      }
    }
    
    // Clean up database records (rollback)
    if (resumeId) {
      try {
        const db = require('../config/db');
        await db.execute('DELETE FROM resume_analysis WHERE resume_id = ?', [resumeId]);
        await db.execute('DELETE FROM user_resumes WHERE id = ?', [resumeId]);
        console.log(`[Rollback] Deleted database entries for resume ID: ${resumeId}`);
      } catch (dbErr) {
        console.error('[Rollback Error] Failed to delete database entries for resume ID:', resumeId, dbErr);
      }
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      process.env.NODE_ENV === 'development' ? `Failed to upload resume: ${error.message}` : 'Failed to upload resume',
      error.statusCode || 500
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

/**
 * DELETE /api/resumes/:resumeId
 * Soft-delete a resume: sets status='deleted' instead of hard delete
 * Preserves data integrity and analysis history
 */
const deleteResume = async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Unauthorized: User information not found in token', 401);
  }

  if (!resumeId || isNaN(parseInt(resumeId, 10))) {
    throw new AppError('Invalid resume ID', 400);
  }

  const deleted = await UserResume.softDeleteResume(parseInt(resumeId, 10), userId);

  if (!deleted) {
    throw new AppError('Resume not found or you do not have access to delete it', 404);
  }

  console.log(`[Delete Resume] Resume ${resumeId} soft-deleted for user ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Resume deleted successfully'
  });
};

module.exports = {
  getResumesList,
  uploadResume,
  getResumeAnalysis,
  deleteResume
};
