/**
 * User Resume Model
 * Handles database operations for user resumes
 * Updated for skillwise_dev schema: title, target_role, file_size, status columns
 * Removed: file_type column (gone in new schema)
 */

const db = require('../config/db');

const UserResume = {
  /**
   * Get all active resumes for a user
   * Only returns resumes with status='active'
   * @param {number} userId - The user ID
   * @returns {Promise<Array>} List of active resume rows
   */
  getResumesByUserId: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT id, title, target_role, file_name, file_link, file_size, status, uploaded_at
         FROM user_resumes
         WHERE user_id = ? AND status = 'active'
         ORDER BY uploaded_at DESC`,
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
   * Only returns active resumes (not deleted/failed)
   * @param {number} resumeId - The resume ID
   * @param {number} userId - The user ID (for ownership validation)
   * @returns {Promise<Object|null>} Resume with analysis data or null
   */
  getResumeWithAnalysis: async (resumeId, userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT 
          ur.id AS resume_id,
          ur.title,
          ur.target_role,
          ur.file_name,
          ur.file_size,
          ur.status,
          ur.user_id,
          ur.uploaded_at,
          ra.analysis_data,
          ra.analyzed_at
        FROM user_resumes ur
        LEFT JOIN resume_analysis ra ON ur.id = ra.resume_id
        WHERE ur.id = ? AND ur.user_id = ? AND ur.status = 'active'
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
        title: rows[0].title,
        target_role: rows[0].target_role,
        file_name: rows[0].file_name,
        file_size: rows[0].file_size,
        status: rows[0].status,
        user_id: rows[0].user_id,
        uploaded_at: rows[0].uploaded_at,
        analysis_data: analysisData,
        analyzed_at: rows[0].analyzed_at
      };
    } catch (error) {
      console.error('Error fetching resume with analysis:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Get active resume count for a user
   * Only counts active resumes (not deleted/failed)
   * @param {number} userId - The user ID
   * @returns {Promise<number>} Number of active resumes
   */
  getResumeCountByUserId: async (userId) => {
    try {
      const [rows] = await db.execute(
        "SELECT COUNT(*) as count FROM user_resumes WHERE user_id = ? AND status = 'active'",
        [userId]
      );
      return rows[0].count;
    } catch (error) {
      console.error('Error counting user resumes:', error);
      throw new Error('Database query failed');
    }
  },

  /**
   * Create a new resume record with status='active'
   * @param {number} userId     - The user ID
   * @param {string} title      - User-facing display title (e.g. "Digital Marketing Resume")
   * @param {string} targetRole - Target job role for AI analysis
   * @param {string} fileName   - System storage file name
   * @param {string} fileLink   - Absolute server file link or URL
   * @param {number} fileSize   - File size in bytes
   * @param {string} rawText    - Extracted resume text
   * @returns {Promise<number>} Inserted resume ID
   */
  createResume: async (userId, title, targetRole, fileName, fileLink, fileSize, rawText = null) => {
    try {
      const [result] = await db.execute(
        `INSERT INTO user_resumes (user_id, title, target_role, file_name, file_link, file_size, status, raw_text)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
        [userId, title, targetRole, fileName, fileLink, fileSize || 0, rawText]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating resume record:', error);
      throw new Error('Database insert failed');
    }
  },

  /**
   * Soft-delete a resume by setting status='deleted'
   * Preserves the physical file and DB record for audit purposes
   * @param {number} resumeId - The resume ID
   * @param {number} userId   - The user ID (ownership check)
   * @returns {Promise<boolean>} True if deleted
   */
  softDeleteResume: async (resumeId, userId) => {
    try {
      const [result] = await db.execute(
        "UPDATE user_resumes SET status = 'deleted' WHERE id = ? AND user_id = ?",
        [resumeId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error soft-deleting resume:', error);
      throw new Error('Database update failed');
    }
  }
};

module.exports = UserResume;
