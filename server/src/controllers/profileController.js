// server/src/controllers/profileController.js
// Handles user profile CRUD operations
// Works with individual columns in user_profiles — no JSON blob

const UserProfile = require('../models/userProfileModel');
const UserApiKeyModel = require('../models/userApiKeyModel');
const UsageTracker = require('../utils/usageTracker');
const { generateText } = require('../utils/geminiService');
const { AppError } = require('../utils/errorHandler');

/**
 * GET /api/profile
 * Get current user's full profile (user + profile columns)
 */
const getProfile = async (req, res) => {
  const userId = req.user.id;

  const userRow = await UserProfile.getUserById(userId);
  if (!userRow) {
    throw new AppError('User not found', 404);
  }

  const profileRow = await UserProfile.getProfileByUserId(userId);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: userRow.id,
        full_name: userRow.full_name,
        email: userRow.email,
        created_at: userRow.created_at
      },
      profile: profileRow || {
        gender: null,
        preferred_roles: [],
        experience_level: null,
        years_of_experience: 0,
        education: null,
        bio: null,
        profile_completed: false
      }
    }
  });
};

/**
 * PUT /api/profile
 * Update profile fields — accepts any subset of allowed columns
 * Body: { gender?, preferred_roles?, experience_level?, years_of_experience?, education?, bio? }
 */
const updateProfile = async (req, res) => {
  const userId = req.user.id;

  const {
    gender,
    preferred_roles,
    experience_level,
    years_of_experience,
    education,
    bio
  } = req.body;

  // Validate gender if provided
  const validGenders = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
  if (gender !== undefined) {
    if (gender === null || gender === '') {
      throw new AppError('Gender is required', 400);
    }
    if (!validGenders.includes(gender)) {
      throw new AppError(`Invalid gender value. Must be one of: ${validGenders.join(', ')}`, 400);
    }
  }

  // Validate preferred_roles if provided
  if (preferred_roles !== undefined) {
    if (preferred_roles === null || !Array.isArray(preferred_roles)) {
      throw new AppError('preferred_roles must be an array', 400);
    }
    if (preferred_roles.length === 0) {
      throw new AppError('At least one preferred role is required', 400);
    }
    if (preferred_roles.length > 3) {
      throw new AppError('You can select a maximum of 3 preferred roles', 400);
    }
  }

  // Validate experience_level if provided
  if (experience_level !== undefined) {
    if (experience_level === null || experience_level === '') {
      throw new AppError('Experience level is required', 400);
    }
  }

  // Validate years_of_experience if provided
  if (years_of_experience !== undefined) {
    if (years_of_experience === null || years_of_experience === '') {
      throw new AppError('Years of experience is required', 400);
    }
    const years = Number(years_of_experience);
    if (isNaN(years) || years < 0 || years > 60) {
      throw new AppError('years_of_experience must be a number between 0 and 60', 400);
    }
  }

  const updated = await UserProfile.updateProfile(userId, {
    gender,
    preferred_roles,
    experience_level,
    years_of_experience: years_of_experience !== undefined ? Number(years_of_experience) : undefined,
    education,
    bio
  });

  // We don't throw an error if not updated; it just means no new valid fields were provided.
  // We'll just fetch and return the current profile to keep the frontend happy.

  // Fetch and return the updated profile
  const updatedProfile = await UserProfile.getProfileByUserId(userId);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile: updatedProfile }
  });
};

/**
 * PATCH /api/profile/complete
 * Mark onboarding as complete — sets profile_completed = true
 * Called at the end of the onboarding flow
 */
const markProfileComplete = async (req, res) => {
  const userId = req.user.id;

  const success = await UserProfile.setProfileCompleted(userId);

  if (!success) {
    throw new AppError('Failed to complete profile. Please try again.', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Profile setup complete. Welcome to SkillWise!'
  });
};

/**
 * GET /api/profile/api-key
 * Get current user's Gemini API key status
 */
const getApiKey = async (req, res) => {
  const userId = req.user.id;
  
  const apiKeyRecord = await UserApiKeyModel.getApiKey(userId);
  
  res.status(200).json({
    success: true,
    data: {
      hasApiKey: !!apiKeyRecord,
      isValid: apiKeyRecord ? apiKeyRecord.is_valid : false,
      // For security, don't return the full key, just masked or partial
      maskedKey: apiKeyRecord ? `...${apiKeyRecord.api_key.slice(-4)}` : null
    }
  });
};

/**
 * PUT /api/profile/api-key
 * Update user's custom Gemini API key
 * Body: { apiKey }
 */
const updateApiKey = async (req, res) => {
  const userId = req.user.id;
  const { apiKey } = req.body;
  
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new AppError('A valid API key must be provided', 400);
  }
  
  try {
    // Verify the key works before saving it
    const testResponse = await generateText('Return the word "OK"', { apiKey, timeout: 10000 });
    
    if (!testResponse) {
      throw new AppError('Invalid API Key. Gemini API returned empty response.', 400);
    }
    
    // Key is valid, save it
    await UserApiKeyModel.setApiKey(userId, apiKey);
    
    res.status(200).json({
      success: true,
      message: 'API key successfully verified and saved'
    });
  } catch (error) {
    throw new AppError(`Failed to verify API key: ${error.message}`, 400);
  }
};

/**
 * GET /api/profile/check-limits
 * Check if the user is within free limit or has a valid api key
 * Query: ?type=resume|interview
 */
const checkLimits = async (req, res) => {
  const userId = req.user.id;
  const { type } = req.query;

  if (type !== 'resume' && type !== 'interview') {
    throw new AppError('Invalid limit type. Must be "resume" or "interview".', 400);
  }

  try {
    const customApiKey = await UsageTracker.getApiKeyIfLimitExceeded(userId, type);
    res.status(200).json({
      success: true,
      allowed: true,
      useCustomKey: !!customApiKey
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      allowed: false,
      code: error.code || 'LIMIT_EXCEEDED',
      message: error.message
    });
  }
};

module.exports = { 
  getProfile, 
  updateProfile, 
  markProfileComplete, 
  getApiKey, 
  updateApiKey,
  checkLimits
};
