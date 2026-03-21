/**
 * AI Response Parser
 * Strict JSON validation for AI responses
 * Handles both question flow and final evaluation responses
 */

/**
 * Parse and validate question flow AI response
 * Ensures all required fields are present and valid
 * 
 * @param {Object} response - Raw AI response (should be parsed JSON already)
 * @returns {Object} Validated response with both evaluation and next_question
 * @throws {Error} If validation fails
 */
function parseJsonIfString(response) {
  if (typeof response !== 'string') {
    return response;
  }

  const trimmed = response.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const payload = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(payload);
}

function normalizeQuestionFlowShape(rawResponse) {
  const response = parseJsonIfString(rawResponse);
  const answerEvaluation = response?.answer_evaluation || response?.evaluation || response?.answerEvaluation;
  const nextQuestion = response?.next_question || response?.nextQuestion;

  return {
    answer_evaluation: answerEvaluation,
    next_question: nextQuestion
  };
}

function validateQuestionFlowResponse(response) {
  try {
    const normalized = normalizeQuestionFlowShape(response);

    // Check top-level structure
    if (!normalized.answer_evaluation || typeof normalized.next_question === 'undefined') {
      throw new Error('Missing required fields: answer_evaluation or next_question');
    }

    const { answer_evaluation, next_question } = normalized;

    // Validate answer_evaluation
    validateEvaluation(answer_evaluation);

    // Validate next_question
    validateNextQuestion(next_question);

    return {
      evaluation: answer_evaluation,
      next_question: next_question
    };
  } catch (error) {
    console.error('[Parser] Question flow validation failed:', error.message);
    throw new Error(`Invalid question flow response: ${error.message}`);
  }
}

/**
 * Validate evaluation object structure
 * @param {Object} evaluation - Evaluation object
 * @throws {Error} If validation fails
 */
function validateEvaluation(evaluation) {
  const required = ['score', 'rating', 'confidence', 'dimensions', 'feedback'];
  
  for (const field of required) {
    if (!(field in evaluation)) {
      throw new Error(`Missing field in evaluation: ${field}`);
    }
  }

  // Validate score (0-100)
  if (typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 100) {
    throw new Error('Score must be number between 0-100');
  }

  // Validate rating
  const validRatings = ['good', 'average', 'weak'];
  if (!validRatings.includes(evaluation.rating)) {
    throw new Error(`Rating must be one of: ${validRatings.join(', ')}`);
  }

  // Validate confidence (0-1)
  if (typeof evaluation.confidence !== 'number' || evaluation.confidence < 0 || evaluation.confidence > 1) {
    throw new Error('Confidence must be decimal between 0-1');
  }

  // Validate dimensions
  const { dimensions } = evaluation;
  if (!dimensions || typeof dimensions !== 'object') {
    throw new Error('Dimensions must be an object');
  }

  const dimensionFields = ['technical_proficiency', 'communication', 'problem_solving'];
  for (const field of dimensionFields) {
    if (!(field in dimensions)) {
      throw new Error(`Missing dimension: ${field}`);
    }
    const value = dimensions[field];
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error(`Dimension ${field} must be decimal between 0-1`);
    }
  }

  // Validate arrays
  if (!Array.isArray(evaluation.strengths)) {
    throw new Error('Strengths must be an array');
  }

  if (!Array.isArray(evaluation.mistakes)) {
    throw new Error('Mistakes must be an array');
  }

  // Validate feedback
  if (typeof evaluation.feedback !== 'string') {
    throw new Error('Feedback must be a string');
  }
}

/**
 * Validate next question object
 * @param {Object} nextQuestion - Next question object
 * @throws {Error} If validation fails
 */
function validateNextQuestion(nextQuestion) {
  if (nextQuestion === null) {
    return;
  }

  const required = ['text', 'type', 'difficulty', 'reason'];
  
  for (const field of required) {
    if (!(field in nextQuestion)) {
      throw new Error(`Missing field in next_question: ${field}`);
    }
  }

  // Validate text
  if (typeof nextQuestion.text !== 'string' || nextQuestion.text.length === 0) {
    throw new Error('Question text must be non-empty string');
  }

  // Validate type
  const validTypes = ['technical', 'hr', 'resume', 'scenario', 'follow_up'];
  if (!validTypes.includes(nextQuestion.type)) {
    throw new Error(`Type must be one of: ${validTypes.join(', ')}`);
  }

  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(nextQuestion.difficulty)) {
    throw new Error(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }

  // Validate reason
  const validReasons = ['follow_up', 'weak_answer', 'topic_switch', 'depth_increase'];
  if (!validReasons.includes(nextQuestion.reason)) {
    throw new Error(`Reason must be one of: ${validReasons.join(', ')}`);
  }
}

/**
 * Parse and validate final evaluation response
 * @param {Object} response - Raw final evaluation response
 * @returns {Object} Validated final result
 * @throws {Error} If validation fails
 */
function validateFinalEvaluationResponse(response) {
  try {
    // Check required top-level fields
    const required = ['overall_score', 'verdict', 'dimension_scores', 'confidence_trend', 'strengths', 'weaknesses', 'key_observations', 'improvement_suggestions'];
    
    for (const field of required) {
      if (!(field in response)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate overall_score
    if (typeof response.overall_score !== 'number' || response.overall_score < 0 || response.overall_score > 100) {
      throw new Error('overall_score must be number between 0-100');
    }

    // Validate verdict
    const validVerdicts = ['STRONG_HIRE', 'HIRE', 'LEANING_NO', 'NO_HIRE'];
    if (!validVerdicts.includes(response.verdict)) {
      throw new Error(`Verdict must be one of: ${validVerdicts.join(', ')}`);
    }

    // Validate dimension_scores (7 dimensions)
    const dimensions = ['role_alignment', 'technical_proficiency', 'problem_solving', 'communication', 'confidence', 'behavioral_fit', 'leadership'];
    const { dimension_scores } = response;

    for (const dim of dimensions) {
      if (!(dim in dimension_scores)) {
        throw new Error(`Missing dimension: ${dim}`);
      }
      const value = dimension_scores[dim];
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new Error(`Dimension ${dim} must be number between 0-100`);
      }
    }

    // Validate confidence_trend (array of 0-1 values)
    if (!Array.isArray(response.confidence_trend)) {
      throw new Error('confidence_trend must be an array');
    }
    
    response.confidence_trend.forEach((val, idx) => {
      if (typeof val !== 'number' || val < 0 || val > 1) {
        throw new Error(`confidence_trend[${idx}] must be decimal between 0-1`);
      }
    });

    // Validate arrays
    if (!Array.isArray(response.strengths)) {
      throw new Error('strengths must be an array');
    }

    if (!Array.isArray(response.weaknesses)) {
      throw new Error('weaknesses must be an array');
    }

    if (!Array.isArray(response.key_observations)) {
      throw new Error('key_observations must be an array');
    }

    if (!Array.isArray(response.improvement_suggestions)) {
      throw new Error('improvement_suggestions must be an array');
    }

    return response;
  } catch (error) {
    console.error('[Parser] Final evaluation validation failed:', error.message);
    throw new Error(`Invalid final evaluation response: ${error.message}`);
  }
}

module.exports = {
  validateQuestionFlowResponse,
  validateFinalEvaluationResponse,
  validateEvaluation,
  validateNextQuestion
};
