/**
 * Interview Model/Helper Layer
 * Centralized database operations for interview management
 * Handles: sessions, messages, evaluations, results
 */

const db = require('../config/db');

function normalizeSessionId(sessionId) {
  const parsed = Number(sessionId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid sessionId: ${sessionId}`);
  }
  return parsed;
}

class InterviewModel {
  /**
   * Create new interview session
   * @param {number} userId - User ID
   * @param {number} resumeId - Resume ID
   * @param {string} role - Target role
   * @returns {Promise<Object>} Created session
   */
  static async createSession(userId, resumeId, role) {
    const query = `
      INSERT INTO interview_sessions (user_id, resume_id, role, total_questions, weak_answer_count, status)
      VALUES (?, ?, ?, 0, 0, 'active')
    `;

    const [result] = await db.execute(query, [userId, resumeId, role]);

    return {
      id: result.insertId,
      userId,
      resumeId,
      role,
      total_questions: 0,
      max_questions: 15,
      weak_answer_count: 0,
      status: 'active',
      started_at: new Date()
    };
  }

  /**
   * Save message in interview_messages
   * @param {number} sessionId - Session ID
   * @param {'ai' | 'user'} sender - Message sender
   * @param {string} message - Message text
   * @returns {Promise<Object>} Saved message
   */
  static async saveMessage(sessionId, sender, message) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      INSERT INTO interview_messages (session_id, sender, message)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [safeSessionId, sender, message]);

    return {
      id: result.insertId,
      sessionId: safeSessionId,
      sender,
      message,
      created_at: new Date()
    };
  }

  /**
   * Save question evaluation
   * @param {number} sessionId - Session ID
   * @param {Object} evaluation - Evaluation data
   * @returns {Promise<void>}
   */
  static async saveEvaluation(sessionId, evaluation) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      INSERT INTO interview_question_evaluations 
      (session_id, question, answer, question_type, difficulty, score, rating, confidence, technical_score, communication_score, problem_solving_score, feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const {
      question,
      answer,
      question_type,
      difficulty,
      score,
      rating,
      confidence,
      technical_score = 0,
      communication_score = 0,
      problem_solving_score = 0,
      feedback = ''
    } = evaluation;

    const dbConfidence = typeof confidence === 'number'
      ? (confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence))
      : 50;

    await db.execute(query, [
      safeSessionId,
      question,
      answer,
      question_type,
      difficulty,
      score,
      rating,
      dbConfidence,
      technical_score,
      communication_score,
      problem_solving_score,
      feedback
    ]);
  }

  /**
   * Get last N messages (ordered ASC for context building)
   * @param {number} sessionId - Session ID
   * @param {number} limit - Number of messages (default 5)
   * @returns {Promise<Array>} Messages
   */
  static async getLastMessages(sessionId, limit = 5) {
    const safeSessionId = normalizeSessionId(sessionId);
    const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 5, 100));

    const query = `
      SELECT * FROM interview_messages 
      WHERE session_id = ?
      ORDER BY created_at ASC
      LIMIT ${safeLimit}
    `;

    const [rows] = await db.execute(query, [safeSessionId]);
    return rows || [];
  }

  /**
   * Get current question (last AI message)
   * @param {number} sessionId - Session ID
   * @returns {Promise<string>} Current question text
   */
  static async getCurrentQuestion(sessionId) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      SELECT message FROM interview_messages
      WHERE session_id = ? AND sender = 'ai'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const [rows] = await db.execute(query, [safeSessionId]);
    return rows && rows.length > 0 ? rows[0].message : null;
  }

  /**
   * Update session counters
   * @param {number} sessionId - Session ID
   * @param {number} totalQuestions - New total questions
   * @param {number} weakAnswerCount - New weak answer count
   * @returns {Promise<void>}
   */
  static async updateSessionCounters(sessionId, totalQuestions, weakAnswerCount) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      UPDATE interview_sessions
      SET total_questions = ?, weak_answer_count = ?
      WHERE id = ?
    `;

    await db.execute(query, [totalQuestions, weakAnswerCount, safeSessionId]);
  }

  /**
   * Get session details
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} Session data
   */
  static async getSession(sessionId) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      SELECT * FROM interview_sessions WHERE id = ?
    `;

    const [rows] = await db.execute(query, [safeSessionId]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all evaluations for a session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Array>} Evaluations
   */
  static async getAllEvaluations(sessionId) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      SELECT * FROM interview_question_evaluations
      WHERE session_id = ?
      ORDER BY created_at ASC
    `;

    const [rows] = await db.execute(query, [safeSessionId]);
    return rows || [];
  }

  /**
   * Save final interview result
   * @param {number} sessionId - Session ID
   * @param {Object} result - Final result data
   * @returns {Promise<void>}
   */
  static async saveResult(sessionId, result) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      INSERT INTO interview_results (session_id, overall_score, verdict, result_data)
      VALUES (?, ?, ?, ?)
    `;

    const { overall_score, verdict } = result;
    await db.execute(query, [safeSessionId, overall_score, verdict, JSON.stringify(result)]);
  }

  /**
   * Update session status
   * @param {number} sessionId - Session ID
   * @param {'active' | 'completed'} status - New status
   * @returns {Promise<void>}
   */
  static async updateSessionStatus(sessionId, status) {
    const safeSessionId = normalizeSessionId(sessionId);

    const query = `
      UPDATE interview_sessions
      SET status = ?, ended_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [status, safeSessionId]);
  }
}

module.exports = InterviewModel;
