// server/src/routes/interviewHistoryRoutes.js
// Secured interview history APIs for listing sessions and fetching detailed interview analytics.

const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const db = require('../config/db');
const { AppError, catchAsync } = require('../utils/errorHandler');

const router = express.Router();

// Shared list handler for current user or an explicit user id (must match auth user)
const listInterviewsHandler = async (req, res) => {
  const authUserId = req.user.id;
  const requestedUserId = req.params.userId ? Number(req.params.userId) : authUserId;

  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    throw new AppError('Invalid user ID', 400);
  }

  // Prevent one user from reading another user's interview history
  if (requestedUserId !== authUserId) {
    throw new AppError('Forbidden: You can only access your own interview history', 403);
  }

  const userId = requestedUserId;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  const sortBy = req.query.sortBy || 'date';
  const sortOrder = (req.query.sortOrder || 'desc').toUpperCase();

  if (limit < 1 || limit > 100) {
    throw new AppError('limit must be between 1 and 100', 400);
  }
  if (offset < 0) {
    throw new AppError('offset must be >= 0', 400);
  }
  if (!['date', 'score'].includes(sortBy)) {
    throw new AppError('sortBy must be "date" or "score"', 400);
  }
  if (!['ASC', 'DESC'].includes(sortOrder)) {
    throw new AppError('sortOrder must be "asc" or "desc"', 400);
  }

  const orderByClause = sortBy === 'score'
    ? `COALESCE(ir.overall_score, 0) ${sortOrder}, COALESCE(s.ended_at, s.started_at) ${sortOrder}`
    : `COALESCE(s.ended_at, s.started_at) ${sortOrder}`;

  const query = `
      SELECT 
        s.id,
        s.role AS target_role,
        s.resume_id,
        ur.title AS resume_title,
        COALESCE(ir.overall_score, 0) AS overall_score,
        ir.verdict,
        s.total_questions,
        s.weak_answer_count AS total_weak_answers,
        COALESCE(s.ended_at, s.started_at) AS created_at
      FROM interview_sessions s
      LEFT JOIN interview_results ir ON ir.session_id = s.id
      LEFT JOIN user_resumes ur ON ur.id = s.resume_id
      WHERE s.user_id = ?
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?
    `;

  console.log('[Interview History] Fetching interviews for user:', userId);
  const [interviews] = await db.query(query, [userId, limit, offset]);

  const countQuery = 'SELECT COUNT(*) as total FROM interview_sessions WHERE user_id = ?';
  const [countResult] = await db.query(countQuery, [userId]);
  const total = countResult[0]?.total || 0;

  const formattedInterviews = interviews.map(interview => ({
    session_id: interview.id,
    role: interview.target_role,
    resume_id: interview.resume_id,
    resume_title: interview.resume_title || null,
    score: interview.overall_score,
    verdict: interview.verdict,
    questions_asked: interview.total_questions,
    weak_answers: interview.total_weak_answers,
    date: interview.created_at,
    timestamp: new Date(interview.created_at).getTime()
  }));

  res.json({
    success: true,
    data: formattedInterviews,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
};

// Returns one session's full summary plus question/evaluation timeline for history drill-down.
const getSessionDetailHandler = async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  if (!sessionId || Number.isNaN(Number(sessionId))) {
    throw new AppError('Invalid session ID', 400);
  }

  // Fetch interview session (verify user owns it)
  const sessionQuery = `
      SELECT 
        s.id,
        s.user_id,
        s.role AS target_role,
        COALESCE(ir.overall_score, 0) AS overall_score,
        ir.verdict,
        ir.result_data,
        s.total_questions,
        s.weak_answer_count AS total_weak_answers,
        COALESCE(s.ended_at, s.started_at) AS created_at
      FROM interview_sessions s
      LEFT JOIN interview_results ir ON ir.session_id = s.id
      WHERE s.id = ? AND s.user_id = ?
    `;

  console.log('[Interview History] Fetching session:', sessionId, 'for user:', userId);
  const [sessions] = await db.query(sessionQuery, [sessionId, userId]);

  if (!sessions || sessions.length === 0) {
    throw new AppError('Interview session not found', 404);
  }

  const session = sessions[0];

  // Parse persisted result JSON for downstream UI cards/charts.
  let fullAnalysis = null;
  if (session.result_data) {
    try {
      fullAnalysis = typeof session.result_data === 'string' 
        ? JSON.parse(session.result_data)
        : session.result_data;
    } catch (parseErr) {
      console.error('[Interview History] Failed to parse result_data:', parseErr);
      fullAnalysis = null;
    }
  }

  const evaluationsQuery = `
      SELECT 
        iqe.id,
        iqe.question,
        iqe.answer,
        iqe.score,
        iqe.rating,
        iqe.confidence,
        iqe.created_at
      FROM interview_question_evaluations iqe
      WHERE iqe.session_id = ?
      ORDER BY iqe.created_at ASC
    `;

  const [evaluations] = await db.query(evaluationsQuery, [sessionId]);

  const goodAnswers = evaluations.filter(ev => ev.rating === 'good').length;
  const averageAnswers = evaluations.filter(ev => ev.rating === 'average').length;
  const weakAnswers = evaluations.filter(ev => ev.rating === 'weak').length;
  const confidenceSeries = evaluations.map((ev) => ev.confidence ?? null);

  res.json({
    success: true,
    data: {
      session_id: session.id,
      role: session.target_role,
      verdict: session.verdict,
      score: session.overall_score,
      stats: {
        total_questions: session.total_questions,
        good_answers: goodAnswers,
        average_answers: averageAnswers,
        weak_answers: weakAnswers
      },
      analysis: fullAnalysis,
      strengths: fullAnalysis?.strengths || ['Strong communication', 'Problem-solving ability'],
      improvements: fullAnalysis?.weaknesses || ['Deep system design', 'Algorithm optimization'],
      questions: evaluations.map((ev, index) => ({
        number: index + 1,
        question: ev.question,
        answer: ev.answer,
        score: ev.score,
        rating: ev.rating,
        confidence: ev.confidence
      })) || [],
      confidence_series: confidenceSeries,
      date: session.created_at,
      timestamp: new Date(session.created_at).getTime()
    }
  });
};

/**
 * GET /api/interviews
 * Fetch all interview sessions for the authenticated user
 * Query params:
 *   - limit: number of results (default: 10)
 *   - offset: pagination offset (default: 0)
 *   - sortBy: 'date' | 'score' (default: 'date')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
router.get('/', verifyToken, catchAsync(listInterviewsHandler));

/**
 * GET /api/interviews/user/:userId
 * Fetch all interview sessions for a specific user id (must be current authenticated user)
 */
router.get('/user/:userId', verifyToken, catchAsync(listInterviewsHandler));

/**
 * GET /api/interviews/:sessionId
 * Fetch detailed results for a specific interview session
 */
router.get('/session/:sessionId', verifyToken, catchAsync(getSessionDetailHandler));

module.exports = router;
