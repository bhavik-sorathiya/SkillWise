/**
 * Resume Analysis Model
 * Handles database operations for resume analysis results from Gemini
 * MVC Pattern - Model Layer
 */

const db = require('../config/db');

const ResumeAnalysis = {

  /**
   * Create a new resume analysis record
   * Stores the Gemini AI analysis result in the database
   * @param {number} resumeId - Resume ID (foreign key to user_resumes)
   * @param {number} userId - User ID (foreign key to users)
   * @param {Object} analysisData - Complete analysis JSON from Gemini
   * @returns {Promise<number>} Inserted analysis record ID
   */
  createAnalysis: async (resumeId, userId, analysisData) => {
    try {
      if (!resumeId || !userId || !analysisData) {
        throw new Error('resumeId, userId, and analysisData are required');
      }

      const [result] = await db.execute(
        `INSERT INTO resume_analysis 
         (resume_id, user_id, analysis_data, analyzed_at) 
         VALUES (?, ?, ?, NOW())`,
        [resumeId, userId, JSON.stringify(analysisData)]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creating resume analysis:', error);
      throw new Error(`Failed to store analysis in database: ${error.message}`);
    }
  },

  /**
   * Get existing analysis for a resume
   * Returns null if analysis doesn't exist
   * @param {number} resumeId - Resume ID
   * @param {number} userId - User ID (for authorization check)
   * @returns {Promise<Object|null>} Analysis record with parsed JSON or null
   */
  getAnalysisByResumeId: async (resumeId, userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT ra.id, ra.resume_id, ra.user_id, ra.analysis_data, ra.analyzed_at
         FROM resume_analysis ra
         WHERE ra.resume_id = ? AND ra.user_id = ?
         LIMIT 1`,
        [resumeId, userId]
      );

      if (!rows[0]) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        resume_id: row.resume_id,
        user_id: row.user_id,
        analysis_data: typeof row.analysis_data === 'string'
          ? JSON.parse(row.analysis_data)
          : row.analysis_data,
        analyzed_at: row.analyzed_at
      };
    } catch (error) {
      console.error('Error fetching resume analysis:', error);
      throw new Error(`Failed to fetch analysis from database: ${error.message}`);
    }
  },

  /**
   * Update an existing analysis record
   * Used if re-analysis is needed
   * @param {number} analysisId - Analysis record ID
   * @param {Object} analysisData - Updated analysis JSON
   * @returns {Promise<boolean>} True if update successful
   */
  updateAnalysis: async (analysisId, analysisData) => {
    try {
      if (!analysisId || !analysisData) {
        throw new Error('analysisId and analysisData are required');
      }

      const [result] = await db.execute(
        `UPDATE resume_analysis 
         SET analysis_data = ?, analyzed_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(analysisData), analysisId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating resume analysis:', error);
      throw new Error(`Failed to update analysis in database: ${error.message}`);
    }
  },

  /**
   * Delete analysis for a resume
   * Called when resume is deleted
   * @param {number} resumeId - Resume ID
   * @returns {Promise<boolean>} True if deletion successful
   */
  deleteAnalysis: async (resumeId) => {
    try {
      const [result] = await db.execute(
        `DELETE FROM resume_analysis WHERE resume_id = ?`,
        [resumeId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting resume analysis:', error);
      throw new Error(`Failed to delete analysis from database: ${error.message}`);
    }
  },

  /**
   * Check if analysis exists and is recent
   * Useful for deciding whether to re-analyze
   * @param {number} resumeId - Resume ID
   * @param {number} maxAgeHours - Maximum age of analysis in hours (default: 24)
   * @returns {Promise<{exists: boolean, isRecent: boolean, analyzedAt: Date|null}>}
   */
  checkAnalysisStatus: async (resumeId, maxAgeHours = 24) => {
    try {
      const [rows] = await db.execute(
        `SELECT analyzed_at FROM resume_analysis WHERE resume_id = ? LIMIT 1`,
        [resumeId]
      );

      if (!rows[0]) {
        return {
          exists: false,
          isRecent: false,
          analyzedAt: null
        };
      }

      const analyzedAt = new Date(rows[0].analyzed_at);
      const now = new Date();
      const ageHours = (now - analyzedAt) / (1000 * 60 * 60);
      const isRecent = ageHours < maxAgeHours;

      return {
        exists: true,
        isRecent,
        analyzedAt,
        ageHours: Math.round(ageHours * 10) / 10
      };
    } catch (error) {
      console.error('Error checking analysis status:', error);
      throw new Error(`Failed to check analysis status: ${error.message}`);
    }
  },

  /**
   * Get all analyses for a user
   * For dashboard or analytics purposes
   * @param {number} userId - User ID
   * @param {number} limit - Max results (default: 10)
   * @returns {Promise<Array>} Array of analysis records with resume info
   */
  getAnalysesByUserId: async (userId, limit = 10) => {
    try {
      const [rows] = await db.execute(
        `SELECT ra.id, ra.resume_id, ur.file_name, ra.analyzed_at
         FROM resume_analysis ra
         JOIN user_resumes ur ON ra.resume_id = ur.id
         WHERE ra.user_id = ?
         ORDER BY ra.analyzed_at DESC
         LIMIT ?`,
        [userId, limit]
      );

      return rows || [];
    } catch (error) {
      console.error('Error fetching user analyses:', error);
      throw new Error(`Failed to fetch analyses: ${error.message}`);
    }
  }
};

module.exports = ResumeAnalysis;
