/**
 * User Resume Model
 * Handles database operations for user resumes
 * MVC Pattern - Model Layer
 */

const db = require('../config/db');

const UserResume = {
  /**
   * Get all resumes for a user
   * @param {number} userId - The user ID
   * @returns {Promise<Array>} List of resume rows
   */
  getResumesByUserId: async (userId) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, file_name, file_type, uploaded_at FROM user_resumes WHERE user_id = ? ORDER BY uploaded_at DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching user resumes:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Get resume with analysis by resume ID
   * Joins user_resumes and resume_analysis tables
   * @param {number} resumeId - The resume ID
   * @param {number} userId - The user ID (for validation)
   * @returns {Promise<Object|null>} Resume with analysis data or null
   */
  getResumeWithAnalysis: async (resumeId, userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT 
          ur.id AS resume_id,
          ur.file_name,
          ur.user_id,
          ra.analysis_data,
          ra.analyzed_at
        FROM user_resumes ur
        LEFT JOIN resume_analysis ra ON ur.id = ra.resume_id
        WHERE ur.id = ? AND ur.user_id = ?
        LIMIT 1`,
        [resumeId, userId]
      );
      
      if (!rows[0]) {
        return null;
      }

      // Parse analysis_data JSON if it's a string
      const analysisData = rows[0].analysis_data 
        ? (typeof rows[0].analysis_data === 'string' 
            ? JSON.parse(rows[0].analysis_data) 
            : rows[0].analysis_data)
        : null;

      return {
        resume_id: rows[0].resume_id,
        file_name: rows[0].file_name,
        user_id: rows[0].user_id,
        analysis_data: analysisData,
        analyzed_at: rows[0].analyzed_at
      };
    } catch (error) {
      console.error('Error fetching resume with analysis:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Get resume count for a user
   * @param {number} userId - The user ID
   * @returns {Promise<number>} Number of resumes
   */
  getResumeCountByUserId: async (userId) => {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM user_resumes WHERE user_id = ?',
        [userId]
      );
      return rows[0].count;
    } catch (error) {
      console.error('Error counting user resumes:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Create a new resume record
   * @param {number} userId - The user ID
   * @param {string} fileName - Original file name
   * @param {string} filePath - Server file path
   * @param {string} fileType - File type (docx, pdf, etc.)
   * @returns {Promise<number>} Inserted resume ID
   */
  createResume: async (userId, fileName, filePath, fileType) => {
    try {
      const [result] = await db.execute(
        'INSERT INTO user_resumes (user_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)',
        [userId, fileName, filePath, fileType]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating resume record:', error);
      throw new Error('Database insert failed');
    }
  }
};

module.exports = UserResume;
