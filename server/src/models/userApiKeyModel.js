/**
 * User API Key Model
 * Handles CRUD operations for the user_gemini_api_keys table
 */

const db = require('../config/db');

const UserApiKeyModel = {
  /**
   * Get the API key for a user
   * @param {number} userId - The user's ID
   * @returns {Promise<Object|null>} The API key record or null if not found
   */
  getApiKey: async (userId) => {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM user_gemini_api_keys WHERE user_id = ?',
        [userId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error fetching API key for user ${userId}:`, error.message);
      throw error;
    }
  },

  /**
   * Set or update the API key for a user
   * @param {number} userId - The user's ID
   * @param {string} apiKey - The Gemini API key
   * @returns {Promise<boolean>} Success status
   */
  setApiKey: async (userId, apiKey) => {
    try {
      await db.execute(
        `INSERT INTO user_gemini_api_keys (user_id, api_key, is_valid) 
         VALUES (?, ?, true)
         ON DUPLICATE KEY UPDATE api_key = VALUES(api_key), is_valid = true, updated_at = CURRENT_TIMESTAMP`,
        [userId, apiKey]
      );
      return true;
    } catch (error) {
      console.error(`Error saving API key for user ${userId}:`, error.message);
      throw error;
    }
  },

  /**
   * Update the validity status of a user's API key
   * @param {number} userId - The user's ID
   * @param {boolean} isValid - The validity status
   * @returns {Promise<boolean>} Success status
   */
  updateValidity: async (userId, isValid) => {
    try {
      await db.execute(
        'UPDATE user_gemini_api_keys SET is_valid = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [isValid, userId]
      );
      return true;
    } catch (error) {
      console.error(`Error updating API key validity for user ${userId}:`, error.message);
      throw error;
    }
  },
  
  /**
   * Delete the API key for a user
   * @param {number} userId - The user's ID
   * @returns {Promise<boolean>} Success status
   */
  deleteApiKey: async (userId) => {
    try {
      await db.execute(
        'DELETE FROM user_gemini_api_keys WHERE user_id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error(`Error deleting API key for user ${userId}:`, error.message);
      throw error;
    }
  }
};

module.exports = UserApiKeyModel;
