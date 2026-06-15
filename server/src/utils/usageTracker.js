/**
 * Usage Tracker Utility
 * Checks daily limits for free resume analysis and interviews
 */

const db = require('../config/db');
const UserApiKeyModel = require('../models/userApiKeyModel');

const FREE_RESUME_ANALYSIS_PER_DAY = 1;
const FREE_INTERVIEWS_PER_DAY = 1;

const UsageTracker = {
  /**
   * Check if a user has exceeded their daily free resume analysis limit
   * @param {number} userId - The user's ID
   * @returns {Promise<{exceeded: boolean, usageCount: number}>}
   */
  checkResumeLimit: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM resume_analysis 
         WHERE user_id = ? AND DATE(analyzed_at) = CURDATE()`,
        [userId]
      );
      
      const usageCount = rows[0].count;
      return {
        exceeded: usageCount >= FREE_RESUME_ANALYSIS_PER_DAY,
        usageCount
      };
    } catch (error) {
      console.error(`Error checking resume limit for user ${userId}:`, error.message);
      throw error;
    }
  },

  /**
   * Check if a user has exceeded their daily free interview limit
   * @param {number} userId - The user's ID
   * @returns {Promise<{exceeded: boolean, usageCount: number}>}
   */
  checkInterviewLimit: async (userId) => {
    try {
      // NOTE: interview_sessions uses started_at
      const [rows] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM interview_sessions 
         WHERE user_id = ? AND DATE(started_at) = CURDATE()`,
        [userId]
      );
      
      const usageCount = rows[0].count;
      return {
        exceeded: usageCount >= FREE_INTERVIEWS_PER_DAY,
        usageCount
      };
    } catch (error) {
      console.error(`Error checking interview limit for user ${userId}:`, error.message);
      throw error;
    }
  },

  /**
   * Helper to check limits and fetch custom API key if limits are exceeded.
   * Throws an error with a specific structure if the user has no custom API key and exceeded limits.
   * @param {number} userId - The user's ID
   * @param {'resume' | 'interview'} type - The type of limit to check
   * @returns {Promise<string|null>} Returns the custom API key if it should be used, or null if within free limits.
   */
  getApiKeyIfLimitExceeded: async (userId, type) => {
    let limitCheck;
    if (type === 'resume') {
      limitCheck = await UsageTracker.checkResumeLimit(userId);
    } else if (type === 'interview') {
      limitCheck = await UsageTracker.checkInterviewLimit(userId);
    } else {
      throw new Error('Invalid limit type check');
    }

    if (limitCheck.exceeded) {
      // Exceeded daily free limit, check for custom API key
      const apiKeyRecord = await UserApiKeyModel.getApiKey(userId);
      
      if (!apiKeyRecord || !apiKeyRecord.api_key) {
        const err = new Error(`Daily free limit for ${type} reached. Please add your own Gemini API key in settings to continue.`);
        err.code = 'QUOTA_EXCEEDED';
        throw err;
      }
      
      if (!apiKeyRecord.is_valid) {
        const err = new Error('Your custom Gemini API key is marked as invalid. Please update it in settings.');
        err.code = 'INVALID_CUSTOM_API_KEY';
        throw err;
      }

      return apiKeyRecord.api_key;
    }

    // Still within free limits, no custom API key needed
    return null;
  }
};

module.exports = UsageTracker;
