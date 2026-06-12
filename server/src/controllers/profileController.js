// server/src/controllers/profileController.js
// Handles user profile CRUD operations
// Works with individual columns in user_profiles — no JSON blob

const UserProfile = require('../models/userProfileModel');
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
  if (gender && !validGenders.includes(gender)) {
    throw new AppError(`Invalid gender value. Must be one of: ${validGenders.join(', ')}`, 400);
  }

  // Validate preferred_roles if provided
  if (preferred_roles !== undefined) {
    if (!Array.isArray(preferred_roles)) {
      throw new AppError('preferred_roles must be an array', 400);
    }
    if (preferred_roles.length > 3) {
      throw new AppError('You can select a maximum of 3 preferred roles', 400);
    }
  }

  // Validate years_of_experience if provided
  if (years_of_experience !== undefined) {
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

  if (!updated) {
    throw new AppError('No fields were updated. Provide at least one valid field.', 400);
  }

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

module.exports = { getProfile, updateProfile, markProfileComplete };
