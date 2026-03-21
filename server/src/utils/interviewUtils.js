/**
 * Utility Functions for Interview
 * Fallback questions, helpers, and safe operations
 */

/**
 * Generate a fallback question when AI fails
 * Used as a safety net for JSON parsing failures
 * @returns {Object} Safe fallback question
 */
function getFallbackQuestion() {
  return {
    text: 'Can you tell me more about your experience with this skill or project?',
    type: 'follow_up',
    difficulty: 'medium',
    reason: 'follow_up'
  };
}

/**
 * Generate fallback evaluation when AI fails
 * Allows interview to continue even if AI response is completely broken
 * Marked with is_fallback flag for honest data handling
 * @returns {Object} Safe fallback evaluation
 */
function getFallbackEvaluation() {
  return {
    score: 50,
    rating: 'average',
    confidence: 0.5,
    dimensions: {
      technical_proficiency: 0.5,
      communication: 0.5,
      problem_solving: 0.5
    },
    strengths: ['Provided a response'],
    mistakes: [],
    feedback: 'Unable to fully evaluate. Please continue with the next question.',
    is_fallback: true // Marker for data filtering later
  };
}

/**
 * Calculate confidence trend from evaluations
 * Extracts confidence values in chronological order
 * @param {Array} evaluations - All evaluations
 * @returns {Array} Confidence trend values (0-1)
 */
function calculateConfidenceTrend(evaluations) {
  if (!evaluations || evaluations.length === 0) {
    return [];
  }

  return evaluations
    .map(e => {
      // Convert confidence_score (0-100) to (0-1) if needed
      const confidence = e.confidence;
      if (typeof confidence === 'number') {
        return Math.min(Math.max(confidence / 100, 0), 1); // Normalize to 0-1
      }
      return 0.5; // Default fallback
    })
    .slice(-10); // Last 10 evaluations for trend
}

/**
 * Safe JSON parse with fallback
 * Attempts to parse JSON, returns fallback on failure
 * @param {string} jsonString - JSON string to parse
 * @param {Object} fallback - Fallback value
 * @param {string} context - Context for logging
 * @returns {Object} Parsed object or fallback
 */
function safeJsonParse(jsonString, fallback, context = 'JSON Parse') {
  try {
    if (typeof jsonString !== 'string') {
      return jsonString;
    }

    const trimmed = jsonString.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const payload = fencedMatch ? fencedMatch[1] : trimmed;

    return JSON.parse(payload);
  } catch (error) {
    console.error(`[${context}] JSON parse failed, using fallback:`, error.message);
    return fallback;
  }
}

module.exports = {
  getFallbackQuestion,
  getFallbackEvaluation,
  calculateConfidenceTrend,
  safeJsonParse
};
