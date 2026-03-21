/**
 * Context Builder
 * Constructs structured context for AI from session data
 * Fetches: resume summary, last messages, current question
 */

const InterviewModel = require('../models/interviewModel');

/**
 * Build interview context for AI
 * Fetches last 3-5 messages + resume summary + current question
 * 
 * @param {number} sessionId - Interview session ID
 * @param {Object} resumeSummary - Cached resume summary
 * @param {string} role - Target role
 * @returns {Promise<Object>} Structured context
 */
async function buildInterviewContext(sessionId, resumeSummary, role) {
  try {
    // Fetch the full session history (bounded high limit) for better anti-redundancy decisions.
    const lastMessages = await InterviewModel.getLastMessages(sessionId, 1000);

    // Format messages for AI
    const formattedMessages = lastMessages.map(msg => ({
      sender: msg.sender,
      message: msg.message,
      created_at: msg.created_at
    }));

    // Get current question (last AI message)
    const currentQuestion = await InterviewModel.getCurrentQuestion(sessionId);

    if (!currentQuestion) {
      throw new Error('No current question found for session');
    }

    return {
      sessionId,
      currentQuestion,
      resumeSummary,
      role,
      lastMessages: formattedMessages,
      messageCount: formattedMessages.length
    };
  } catch (error) {
    console.error(`[Context Builder] Error building context: ${error.message}`);
    throw error;
  }
}

module.exports = {
  buildInterviewContext
};
