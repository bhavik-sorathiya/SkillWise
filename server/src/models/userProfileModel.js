/**
 * User Profile Model
 * Handles database operations for user profiles
 * MVC Pattern - Model Layer
 */

const db = require('../config/db');

const UserProfile = {
  /**
   * Get user basic information by user ID
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} User data (id, name, email, created_at)
   */
  getUserById: async (userId) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, email, created_at FROM users WHERE id = ?',
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Get user profile data by user ID
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Profile data (JSON column)
   */
  getProfileByUserId: async (userId) => {
    try {
      const [rows] = await db.execute(
        'SELECT profile_data, updated_at FROM user_profiles WHERE user_id = ?',
        [userId]
      );
      
      if (!rows[0]) {
        return null;
      }

      // Parse JSON data if it's a string
      const profileData = typeof rows[0].profile_data === 'string' 
        ? JSON.parse(rows[0].profile_data) 
        : rows[0].profile_data;

      return {
        ...profileData,
        updated_at: rows[0].updated_at
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Get combined user and profile data
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Combined user and profile data
   */
  getUserWithProfile: async (userId) => {
    try {
      const user = await UserProfile.getUserById(userId);
      if (!user) {
        return null;
      }

      const profile = await UserProfile.getProfileByUserId(userId);
      
      return {
        user,
        profile
      };
    } catch (error) {
      console.error('Error fetching user with profile:', error);
      throw new Error('Failed to fetch user data');
    }
  }
};

module.exports = UserProfile;
