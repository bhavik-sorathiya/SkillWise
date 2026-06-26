/**
 * Interview Socket Handler
 * Manages real-time interview socket events: start_interview, user_message, end_interview
 * Enforces strict flow and database consistency
 */

const InterviewModel = require('../models/interviewModel');
const { generateResumeSummary } = require('../utils/resumeSummarizer');
const { callQuestionFlowAI, callFinalEvaluationAI } = require('../utils/interviewAI');
const { buildInterviewContext } = require('../utils/contextBuilder');
const { validateQuestionFlowResponse, validateFinalEvaluationResponse } = require('../utils/responseParser');
const { getFallbackEvaluation, getFallbackQuestion } = require('../utils/interviewUtils');
const UsageTracker = require('../utils/usageTracker');

// In-memory session cache to store resume summaries (one-time per session)
const sessionResumeSummaryCache = new Map();
// Cache custom API keys for the session
const sessionApiKeys = new Map();

const QUESTION_TYPE_LIMITS = {
  technical: 3,
  resume: 4,
  follow_up: 2,
  hr: 3,
  scenario: 2
};

const QUESTION_TYPE_TARGETS = {
  technical: 2,
  resume: 3,
  follow_up: 1,
  hr: 2
};

function normalizeText(text = '') {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenSimilarity(a, b) {
  const aTokens = new Set(normalizeText(a).split(' ').filter(Boolean));
  const bTokens = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let inter = 0;
  aTokens.forEach((t) => {
    if (bTokens.has(t)) inter += 1;
  });

  return inter / Math.max(aTokens.size, bTokens.size);
}

function isSimilarQuestion(nextQuestionText, askedQuestions) {
  return askedQuestions.some((q) => tokenSimilarity(nextQuestionText, q) >= 0.72);
}

function classifyQuestionType(question = '') {
  const q = normalizeText(question);
  if (/project|resume|experience|cv|role/.test(q)) return 'resume';
  if (/conflict|team|lead|manager|stakeholder|behavior|challenge|pressure/.test(q)) return 'hr';
  if (/if|suppose|scenario|case|what would you do/.test(q)) return 'scenario';
  if (/follow up|clarify|explain more|elaborate|why/.test(q)) return 'follow_up';
  return 'technical';
}

function getTypeCounts(evaluations = []) {
  const counts = { technical: 0, resume: 0, follow_up: 0, hr: 0, scenario: 0 };
  evaluations.forEach((ev) => {
    const t = ev.question_type;
    if (counts[t] !== undefined) counts[t] += 1;
  });
  return counts;
}

function getNextAllowedType(typeCounts) {
  const priority = ['technical', 'resume', 'hr', 'follow_up', 'scenario'];
  return priority.find((t) => (typeCounts[t] || 0) < (QUESTION_TYPE_LIMITS[t] || 0)) || null;
}

function buildNonRedundantQuestion(type, role) {
  const bank = {
    technical: `Walk me through a technical decision you made in a recent ${role} task and its measurable outcome.`,
    resume: 'Pick one bullet point from your resume and explain the exact impact with numbers.',
    hr: 'Tell me about a difficult team situation and how you resolved it constructively.',
    follow_up: 'Please clarify one specific step you took and why you chose that approach.',
    scenario: `Imagine a high-priority blocker appears in your ${role} workflow. How would you handle it end-to-end?`
  };
  return bank[type] || bank.technical;
}

function shouldEarlyStop({ totalQuestions, typeCounts, recentEvaluations, repeatedAnswerHits }) {
  const totalAsked = totalQuestions || 0;
  const recent = recentEvaluations.slice(-3);
  const weakRecent = recent.filter((e) => e.rating === 'weak').length;
  const avgRecent = recent.length > 0
    ? recent.reduce((sum, e) => sum + (Number(e.score) || 0), 0) / recent.length
    : 0;

  const meetsCoreTargets = Object.entries(QUESTION_TYPE_TARGETS).every(
    ([type, minCount]) => (typeCounts[type] || 0) >= minCount
  );

  if (repeatedAnswerHits >= 2 && avgRecent <= 65) {
    return { stop: true, reason: 'repeated_answer_pattern' };
  }

  if (weakRecent >= 2 && avgRecent <= 55) {
    return { stop: true, reason: 'low_quality_streak' };
  }

  if (meetsCoreTargets && totalAsked >= 8 && avgRecent < 85) {
    return { stop: true, reason: 'balanced_interview_completed' };
  }

  return { stop: false, reason: null };
}

function emitClosingAndTriggerFinalization(socket, sessionId, reason = 'interview_completed') {
  socket.emit('ai_message', {
    sessionId,
    question: 'Thank you. We have enough information to complete your interview. We are now preparing your final evaluation.',
    questionNumber: null
  });

  socket.emit('interview_closing', {
    sessionId,
    reason,
    evaluatingInMs: 3500,
    redirectInMs: 2000
  });
}

/**
 * Helper: Emit structured error to client
 * @param {Object} socket - Socket instance
 * @param {string} message - User-friendly error message
 * @param {string} errorType - Error type for categorization
 * @param {Error} error - Original error for logging
 */
function emitError(socket, message, errorType = 'error', error = null) {
  if (error) {
    console.error(`[Interview Error] Type: ${errorType} | ${error.message}`);
  }
  socket.emit('error', {
    message,
    type: errorType,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper: Check if interview should end
 * Based on total_questions >= max or weak_answer_count >= 3
 * @param {Object} session - Session object
 * @returns {boolean} True if interview should end
 */
function shouldEndInterview(session) {
  const { total_questions, max_questions, weak_answer_count } = session;
  
  if (total_questions >= max_questions) {
    console.log(`[shouldEndInterview] Reached max questions (${total_questions}/${max_questions})`);
    return true;
  }
  
  if (weak_answer_count >= 3) {
    console.log(`[shouldEndInterview] Reached weak answer limit (${weak_answer_count}/3)`);
    return true;
  }
  
  return false;
}

/**
 * Register interview socket handlers
 * @param {Object} io - Socket.IO instance
 * @param {Object} socket - Socket instance
 */
function registerInterviewHandlers(io, socket) {
  // Verify authentication
  const token = socket.handshake.auth.token;
  if (!token) {
    socket.disconnect(true);
    return;
  }

  let userId = null;
  try {
    // Extract userId from token (you may need to decode JWT here)
    // For now, we'll get it from handshake data
    userId = socket.handshake.auth.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }
  } catch (err) {
    console.error('Auth error:', err);
    socket.disconnect(true);
    return;
  }

  /**
   * EVENT: start_interview
   * Create interview session, generate resume summary, send first question
   * 
   * Payload: { resumeId, role }
   */
  socket.on('start_interview', async (payload) => {
    try {
      const { resumeId, role } = payload;

      // Validate input
      if (!resumeId || !role) {
        emitError(socket, 'Resume and role are required to start interview', 'validation_error');
        return;
      }
      
      let session = null;
      try {
        // Step 0: Check limits
        let customApiKey = null;
        try {
          customApiKey = await UsageTracker.getApiKeyIfLimitExceeded(userId, 'interview');
        } catch (limitError) {
          emitError(socket, limitError.message, limitError.code);
          return;
        }

        // Step 1: Create interview session
        session = await InterviewModel.createSession(userId, resumeId, role);

        if (customApiKey && session && session.id) {
          sessionApiKeys.set(session.id, customApiKey);
        }
        
        if (!session || !session.id) {
          emitError(socket, 'Failed to create interview session', 'database_error');
          return;
        }

        // Step 2: Generate and cache resume summary (one-time per session)
        const resumeSummary = await generateResumeSummary(resumeId);
        if (!resumeSummary) {
          emitError(socket, 'Could not process resume. Please check your resume format', 'resume_error');
          return;
        }
        sessionResumeSummaryCache.set(session.id, resumeSummary);

        // Step 3: Save fixed first question
        const firstQuestion = 'Tell me about yourself';
        await InterviewModel.saveMessage(session.id, 'ai', firstQuestion);

        // Step 4: Send to client
        socket.emit('ai_message', {
          sessionId: session.id,
          question: firstQuestion,
          questionNumber: 1
        });

        console.log(`[Interview] Started | Session: ${session.id} | User: ${userId} | Role: ${role}`);
      } catch (dbError) {
        if (dbError.message.includes('resume')) {
          emitError(socket, 'Resume not found or invalid', 'resume_error', dbError);
        } else if (dbError.message.includes('database') || dbError.code) {
          emitError(socket, 'Database error while starting interview', 'database_error', dbError);
        } else {
          emitError(socket, 'Error starting interview: ' + dbError.message, 'error', dbError);
        }
      }
    } catch (error) {
      emitError(socket, 'An unexpected error occurred while starting the interview', 'unexpected_error', error);
    }
  });

  /**
   * EVENT: user_message
   * CORE LOGIC:
   * - Save user answer
   * - Fetch current question
   * - Build context
   * - Call AI for evaluation + next question
   * - Parse + validate AI response
   * - Save evaluation
   * - Update counters
   * - Check stop condition
   * - Emit next question or trigger end
   * 
   * Payload: { sessionId, message }
   */
  socket.on('user_message', async (payload) => {
    try {
      const { sessionId, message } = payload;

      // Validate input
      if (!sessionId || !message) {
        emitError(socket, 'Session ID and message are required', 'validation_error');
        return;
      }

      try {
        // STEP 1: Save user message
        await InterviewModel.saveMessage(sessionId, 'user', message);

        // STEP 2: Fetch current question (last AI message)
        const currentQuestion = await InterviewModel.getCurrentQuestion(sessionId);

        if (!currentQuestion) {
          emitError(socket, 'No question found in this interview session', 'session_error');
          return;
        }

        // STEP 3: Get resume summary from cache
        const resumeSummary = sessionResumeSummaryCache.get(sessionId);
        if (!resumeSummary) {
          emitError(socket, 'Interview session expired. Please start a new interview', 'session_error');
          return;
        }

        // Get session to fetch role
        let session;
        try {
          session = await InterviewModel.getSession(sessionId);
          if (!session) {
            emitError(socket, 'Interview session not found', 'session_error');
            return;
          }
        } catch (err) {
          emitError(socket, 'Could not retrieve interview session details', 'database_error', err);
          return;
        }

        const role = session.role;

        const messageWindow = await InterviewModel.getLastMessages(sessionId, 1000);
        const userAnswers = messageWindow.filter((m) => m.sender === 'user').map((m) => m.message);
        const currentAnswer = userAnswers[userAnswers.length - 1] || message;
        const repeatedAnswerHits = userAnswers
          .slice(0, -1)
          .filter((ans) => tokenSimilarity(ans, currentAnswer) >= 0.82).length;

        const allEvaluationsBefore = await InterviewModel.getAllEvaluations(sessionId);
        const typeCountsBefore = getTypeCounts(allEvaluationsBefore);
        const askedQuestions = [
          ...new Set(
            messageWindow
              .filter((m) => m.sender === 'ai')
              .map((m) => m.message)
              .filter(Boolean)
          )
        ];

        // STEP 4: Build context (fetch last 3-5 messages + resume + question)
        socket.emit('loading', { message: 'Evaluating your answer...' });

        let context;
        try {
          context = await buildInterviewContext(sessionId, resumeSummary, role);
          context.userAnswer = message;
          context.askedQuestions = askedQuestions;
          context.typeCounts = typeCountsBefore;
          context.questionLimits = QUESTION_TYPE_LIMITS;
          context.apiKey = sessionApiKeys.get(sessionId);
        } catch (err) {
          emitError(
            socket,
            `Failed to prepare evaluation context: ${err.message}`,
            'processing_error',
            err
          );
          return;
        }

        // STEP 5: Call AI for evaluation + next question (SINGLE CALL)
        let aiResponse;
        try {
          aiResponse = await callQuestionFlowAI(context);
          if (!aiResponse) {
            emitError(socket, 'AI service did not return a response. Please try again', 'ai_error');
            return;
          }
        } catch (err) {
          if (!context.apiKey && (err.message.includes('429') || err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('quota') || err.message.includes('API'))) {
            try {
              console.warn(`[Interview Fallback] System key failed: ${err.message}. Checking for user custom API key...`);
              const UserApiKeyModel = require('../models/userApiKeyModel');
              const userKeyData = await UserApiKeyModel.getApiKey(userId);
              
              if (userKeyData && userKeyData.is_valid) {
                console.log(`[Interview Fallback] Found user custom API key, retrying question flow...`);
                context.apiKey = userKeyData.api_key;
                sessionApiKeys.set(sessionId, userKeyData.api_key); // Save it for next questions
                aiResponse = await callQuestionFlowAI(context);
                
                if (!aiResponse) {
                  emitError(socket, 'AI service did not return a response using custom key', 'INVALID_CUSTOM_API_KEY');
                  return;
                }
              } else {
                emitError(socket, 'Daily free interview limit reached or service busy. Please add your own Gemini API Key in settings.', 'RATE_LIMIT_EXCEEDED');
                return;
              }
            } catch (fallbackErr) {
              emitError(socket, 'Daily free interview limit reached. Please add your own Gemini API Key in settings.', 'RATE_LIMIT_EXCEEDED');
              return;
            }
          } else if (err.message.includes('timeout')) {
            emitError(socket, 'Request timed out. The AI service took too long to respond. Please try again', 'timeout_error', err);
            return;
          } else {
            if (context.apiKey) {
               emitError(socket, 'Your custom API Key failed: ' + err.message, 'INVALID_CUSTOM_API_KEY');
            } else {
               emitError(socket, 'AI service is temporarily unavailable. Please try again in a moment', 'ai_error', err);
            }
            return;
          }
        }

        // STEP 6: Parse + validate AI response (STRICT JSON)
        let validatedResponse;
        try {
          validatedResponse = validateQuestionFlowResponse(aiResponse);
          if (!validatedResponse || !validatedResponse.evaluation) {
            emitError(socket, 'Invalid response format from AI. Please try again', 'parsing_error');
            return;
          }
        } catch (err) {
          console.warn('[Interview] Falling back due to parse error:', err.message);
          validatedResponse = {
            evaluation: getFallbackEvaluation(),
            next_question: getFallbackQuestion()
          };
        }

        const { evaluation, next_question } = validatedResponse;

        let finalNextQuestion = next_question;
        if (finalNextQuestion) {
          const exceededTypeLimit = (typeCountsBefore[finalNextQuestion.type] || 0) >= (QUESTION_TYPE_LIMITS[finalNextQuestion.type] || 0);
          const redundantQuestion = isSimilarQuestion(finalNextQuestion.text, askedQuestions);

          if (exceededTypeLimit || redundantQuestion) {
            const fallbackType = getNextAllowedType(typeCountsBefore);
            finalNextQuestion = fallbackType
              ? {
                  text: buildNonRedundantQuestion(fallbackType, role),
                  type: fallbackType,
                  difficulty: 'medium',
                  reason: exceededTypeLimit ? 'topic_switch' : 'follow_up'
                }
              : null;
          }
        }

        // STEP 7: Save evaluation to DB
        try {
          const currentQuestionType = classifyQuestionType(currentQuestion);
          await InterviewModel.saveEvaluation(sessionId, {
            question: currentQuestion,
            answer: message,
            question_type: currentQuestionType,
            difficulty: finalNextQuestion?.difficulty || 'medium',
            score: evaluation.score,
            rating: evaluation.rating,
            confidence: evaluation.confidence,
            technical_score: evaluation.dimensions.technical_proficiency * 100,
            communication_score: evaluation.dimensions.communication * 100,
            problem_solving_score: evaluation.dimensions.problem_solving * 100,
            feedback: evaluation.feedback
          });
        } catch (err) {
          emitError(socket, 'Failed to save evaluation. Please try again', 'database_error', err);
          return;
        }

        // STEP 8: Update session counters
        let newTotal = (session.total_questions || 0) + 1;
        let newWeakCount = session.weak_answer_count || 0;

        if (evaluation.rating === 'weak') {
          newWeakCount += 1;
        } else {
          newWeakCount = 0; // Reset if not weak
        }

        try {
          await InterviewModel.updateSessionCounters(sessionId, newTotal, newWeakCount);
        } catch (err) {
          emitError(socket, 'Failed to update interview progress', 'database_error', err);
          return;
        }

        // STEP 9: Check STOP CONDITION
        const updatedSession = {
          ...session,
          total_questions: newTotal,
          weak_answer_count: newWeakCount
        };

        if (shouldEndInterview(updatedSession)) {
          emitClosingAndTriggerFinalization(socket, sessionId, 'max_or_weak_limit');
          console.log(`[Interview] End Triggered | Q${newTotal} | Weak: ${newWeakCount} | Session: ${sessionId}`);
          return;
        }

        const allEvaluationsAfter = await InterviewModel.getAllEvaluations(sessionId);
        const typeCountsAfter = getTypeCounts(allEvaluationsAfter);
        const earlyStopDecision = shouldEarlyStop({
          totalQuestions: newTotal,
          typeCounts: typeCountsAfter,
          recentEvaluations: allEvaluationsAfter,
          repeatedAnswerHits
        });

        if (earlyStopDecision.stop || finalNextQuestion === null) {
          emitClosingAndTriggerFinalization(
            socket,
            sessionId,
            earlyStopDecision.reason || 'ai_indicated_completion'
          );
          return;
        }

        // STEP 10: Save next question and emit
        try {
          await InterviewModel.saveMessage(sessionId, 'ai', finalNextQuestion.text);
        } catch (err) {
          emitError(socket, 'Failed to save next question', 'database_error', err);
          return;
        }

        socket.emit('ai_message', {
          sessionId,
          question: finalNextQuestion.text,
          questionNumber: newTotal + 1
        });

        console.log(`[Interview] Q${newTotal} processed | Rating: ${evaluation.rating} | Score: ${evaluation.score} | Session: ${sessionId}`);
      } catch (innerError) {
        emitError(socket, 'An error occurred while processing your answer', 'processing_error', innerError);
      }
    } catch (error) {
      emitError(socket, 'An unexpected error occurred during the interview', 'unexpected_error', error);
    }
  });

  /**
   * EVENT: end_interview
   * FLOW:
   * - Fetch all evaluations
   * - Call AI for final verdict
   * - Parse + validate response
   * - Store in interview_results
   * - Update session status
   * - Emit interview_result
   * 
   * Payload: { sessionId }
   */
  socket.on('end_interview', async (payload) => {
    try {
      const { sessionId } = payload;

      // Validate input
      if (!sessionId) {
        emitError(socket, 'Session ID is required to end the interview', 'validation_error');
        return;
      }

      try {
        socket.emit('loading', { message: 'Generating final evaluation...' });

        // STEP 1: Fetch all evaluations
        let evaluations;
        try {
          evaluations = await InterviewModel.getAllEvaluations(sessionId);
        } catch (err) {
          emitError(socket, 'Could not retrieve interview evaluations', 'database_error', err);
          return;
        }

        if (!evaluations || evaluations.length === 0) {
          emitError(socket, 'No answers were recorded for final assessment', 'session_error');
          return;
        }

        // STEP 2: Get session for resume summary
        let session;
        try {
          session = await InterviewModel.getSession(sessionId);
          if (!session) {
            emitError(socket, 'Interview session not found', 'session_error');
            return;
          }
        } catch (err) {
          emitError(socket, 'Could not retrieve interview session', 'database_error', err);
          return;
        }

        const resumeSummary = sessionResumeSummaryCache.get(sessionId);
        if (!resumeSummary) {
          emitError(socket, 'Resume summary not available. Please try again', 'session_error');
          return;
        }

        const role = session.role;

        // STEP 3: Call AI for final evaluation
        let aiResponse;
        let apiKey = sessionApiKeys.get(sessionId);
        try {
          aiResponse = await callFinalEvaluationAI(evaluations, resumeSummary, role, apiKey);
          if (!aiResponse) {
            emitError(socket, 'AI service did not return a evaluation. Please try again', 'ai_error');
            return;
          }
        } catch (err) {
          if (!apiKey && (err.message.includes('429') || err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('quota') || err.message.includes('API'))) {
            try {
              console.warn(`[Interview Fallback] System key failed for evaluation: ${err.message}. Checking user key...`);
              const UserApiKeyModel = require('../models/userApiKeyModel');
              const userKeyData = await UserApiKeyModel.getApiKey(userId);
              
              if (userKeyData && userKeyData.is_valid) {
                console.log(`[Interview Fallback] Found user custom API key, retrying evaluation...`);
                apiKey = userKeyData.api_key;
                sessionApiKeys.set(sessionId, apiKey);
                aiResponse = await callFinalEvaluationAI(evaluations, resumeSummary, role, apiKey);
                
                if (!aiResponse) {
                  emitError(socket, 'AI service did not return an evaluation using custom key', 'INVALID_CUSTOM_API_KEY');
                  return;
                }
              } else {
                emitError(socket, 'Daily free interview limit reached or service busy. Please add your own Gemini API Key in settings.', 'RATE_LIMIT_EXCEEDED');
                return;
              }
            } catch (fallbackErr) {
              emitError(socket, 'Daily free interview limit reached. Please add your own Gemini API Key in settings.', 'RATE_LIMIT_EXCEEDED');
              return;
            }
          } else if (err.message.includes('timeout')) {
            emitError(socket, 'Request timed out generating your evaluation. Please try again later', 'timeout_error', err);
            return;
          } else {
            if (apiKey) {
               emitError(socket, 'Your custom API Key failed: ' + err.message, 'INVALID_CUSTOM_API_KEY');
            } else {
               emitError(socket, 'AI service is temporarily unavailable. Your interview data has been saved', 'ai_error', err);
            }
            return;
          }
        }

        // STEP 4: Parse + validate final response
        let finalResult;
        try {
          finalResult = validateFinalEvaluationResponse(aiResponse);
          if (!finalResult || !finalResult.verdict) {
            emitError(socket, 'Could not parse final evaluation. Using fallback data', 'parsing_error');
            // Send a default result instead of failing completely
            finalResult = {
              verdict: 'LEANING_NO',
              overall_score: 50,
              dimension_scores: {
                role_alignment: 50,
                technical_proficiency: 50,
                problem_solving: 50,
                communication: 50,
                confidence: 50,
                behavioral_fit: 50,
                leadership: 50
              },
              confidence_trend: [0.5],
              strengths: ['Interview completed'],
              weaknesses: ['Unable to complete evaluation'],
              key_observations: ['Fallback final evaluation used'],
              improvement_suggestions: ['Try the interview again for a more accurate evaluation'],
              is_fallback: true
            };
          }
        } catch (err) {
          emitError(socket, 'Could not parse final evaluation. Using fallback data', 'parsing_error', err);
          finalResult = {
            verdict: 'LEANING_NO',
            overall_score: 50,
            dimension_scores: {
              role_alignment: 50,
              technical_proficiency: 50,
              problem_solving: 50,
              communication: 50,
              confidence: 50,
              behavioral_fit: 50,
              leadership: 50
            },
            confidence_trend: [0.5],
            strengths: ['Interview completed'],
            weaknesses: ['Unable to complete evaluation'],
            key_observations: ['Fallback final evaluation used'],
            improvement_suggestions: ['Try the interview again for a more accurate evaluation'],
            is_fallback: true
          };
        }

        // STEP 5: Store in interview_results
        try {
          await InterviewModel.saveResult(sessionId, finalResult);
        } catch (err) {
          emitError(socket, 'Failed to save final evaluation, but results will be available in history', 'database_error', err);
          // Don't return - continue to emit results since we have the data
        }

        // STEP 6: Update session status to completed
        try {
          await InterviewModel.updateSessionStatus(sessionId, 'completed');
        } catch (err) {
          console.error(`[Interview] Failed to update session status for ${sessionId}:`, err);
          // Don't fail the interview for this - continue to emit results
        }

        // Clean up cache
        sessionResumeSummaryCache.delete(sessionId);

        // STEP 7: Emit interview_result
        socket.emit('interview_result', finalResult);

        console.log(`[Interview] Completed | Verdict: ${finalResult.verdict} | Score: ${finalResult.overall_score} | Session: ${sessionId}`);
      } catch (innerError) {
        emitError(socket, 'An error occurred while finalizing the interview', 'processing_error', innerError);
      }
    } catch (error) {
      emitError(socket, 'An unexpected error occurred while ending the interview', 'unexpected_error', error);
    }
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log(`[User Disconnected] User ${userId}, Socket ${socket.id}`);
  });
}

/**
 * Initialize interview socket namespace
 * @param {Object} io - Socket.IO instance
 */
function initializeInterviewSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[User Connected] Socket ${socket.id}`);
    registerInterviewHandlers(io, socket);
  });
}

module.exports = {
  initializeInterviewSocket,
  registerInterviewHandlers,
  shouldEndInterview
};
