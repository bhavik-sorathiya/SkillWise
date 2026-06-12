// server/src/models/userProfileModel.js
// Handles DB operations for the user_profiles table.
// New schema: individual columns (no profile_data JSON blob)

const db = require('../config/db');

const UserProfile = {
  /**
   * Get user basic information by user ID
   * @param {number} userId - The user ID
   * @returns {Promise<Object|null>} User data (id, full_name, email, created_at)
   */
  getUserById: async (userId) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, full_name, email, created_at FROM users WHERE id = ?',
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Get user profile by user ID — reads individual columns (no JSON blob)
   * @param {number} userId - The user ID
   * @returns {Promise<Object|null>} Profile data with individual columns
   */
  getProfileByUserId: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT 
          gender,
          preferred_roles,
          experience_level,
          years_of_experience,
          education,
          bio,
          profile_completed,
          created_at,
          updated_at
         FROM user_profiles
         WHERE user_id = ?`,
        [userId]
      );

      if (!rows[0]) {
        return null;
      }

      const row = rows[0];

      // Parse preferred_roles JSON if stored as string
      const preferredRoles = typeof row.preferred_roles === 'string'
        ? JSON.parse(row.preferred_roles)
        : row.preferred_roles;

      return {
        gender: row.gender || null,
        preferred_roles: preferredRoles || [],
        experience_level: row.experience_level || null,
        years_of_experience: row.years_of_experience || 0,
        education: row.education || null,
        bio: row.bio || null,
        profile_completed: !!row.profile_completed,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Get combined user + profile data
   * @param {number} userId - The user ID
   * @returns {Promise<Object|null>} Combined user and profile data
   */
  getUserWithProfile: async (userId) => {
    try {
      const user = await UserProfile.getUserById(userId);
      if (!user) return null;

      const profile = await UserProfile.getProfileByUserId(userId);

      return { user, profile };
    } catch (error) {
      console.error('Error fetching user with profile:', error);
      throw new Error('Failed to fetch user data');
    }
  },

  /**
   * Create an empty profile row for a newly registered user
   * Called immediately after user creation in authController
   * @param {number} userId - The user ID
   * @returns {Promise<void>}
   */
  createEmptyProfile: async (userId) => {
    try {
      await db.execute(
        `INSERT INTO user_profiles (user_id, profile_completed)
         VALUES (?, FALSE)
         ON DUPLICATE KEY UPDATE user_id = user_id`,
        [userId]
      );
    } catch (error) {
      console.error('Error creating empty profile:', error);
      throw new Error('Failed to create user profile');
    }
  },

  /**
   * Update profile fields — operates on individual columns only
   * @param {number} userId - The user ID
   * @param {Object} fields - Fields to update
   * @param {string} [fields.gender]
   * @param {Array}  [fields.preferred_roles]
   * @param {string} [fields.experience_level]
   * @param {number} [fields.years_of_experience]
   * @param {string} [fields.education]
   * @param {string} [fields.bio]
   * @returns {Promise<boolean>} True if updated
   */
  updateProfile: async (userId, fields) => {
    try {
      const allowed = ['gender', 'preferred_roles', 'experience_level', 'years_of_experience', 'education', 'bio'];
      const setClauses = [];
      const values = [];

      for (const key of allowed) {
        if (fields[key] !== undefined) {
          setClauses.push(`${key} = ?`);
          // JSON-stringify arrays before inserting
          values.push(Array.isArray(fields[key]) ? JSON.stringify(fields[key]) : fields[key]);
        }
      }

      if (setClauses.length === 0) return false;

      values.push(userId);
      const [result] = await db.execute(
        `UPDATE user_profiles SET ${setClauses.join(', ')} WHERE user_id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  },

  /**
   * Mark profile as completed
   * @param {number} userId - The user ID
   * @returns {Promise<boolean>}
   */
  setProfileCompleted: async (userId) => {
    try {
      const [result] = await db.execute(
        'UPDATE user_profiles SET profile_completed = TRUE WHERE user_id = ?',
        [userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking profile complete:', error);
      throw new Error('Failed to mark profile as completed');
    }
  }
};

module.exports = UserProfile;
