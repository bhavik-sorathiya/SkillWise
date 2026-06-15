/**
 * AI Modules for Interview
 * Two simple, focused functions:
 * 1. Question Flow AI - Evaluate answer + generate next question
 * 2. Final Evaluation AI - Generate final verdict
 * 
 * Uses Gemini API with fallback handling
 */

const { generateText } = require('./geminiService');
const { getFallbackQuestion, getFallbackEvaluation, safeJsonParse } = require('./interviewUtils');

/**
 * AI Module 1: Question Flow
 * Evaluates user answer and generates next question
 * SINGLE AI CALL returns both evaluation and next question
 * With retry logic: try once, retry once, fallback
 * 
 * @param {Object} context - Interview context
 * @param {string} context.currentQuestion - Current question asked
 * @param {string} context.userAnswer - User's answer
 * @param {Object} context.resumeSummary - Resume summary
 * @param {string} context.role - Target role
 * @param {Array} context.lastMessages - Last 3-5 messages for context
 * @returns {Promise<Object>} { answer_evaluation, next_question }
 */
async function callQuestionFlowAI(context) {
  const {
    currentQuestion,
    userAnswer,
    resumeSummary,
    role,
    lastMessages = [],
    askedQuestions = [],
    typeCounts = {},
    questionLimits = {}
  } = context;

  // Build conversation history string
  const conversationHistory = lastMessages
    .map(msg => `${msg.sender === 'ai' ? 'INTERVIEWER' : 'CANDIDATE'}: ${msg.message}`)
    .join('\n');

  const prompt = `You are an expert interviewer running a structured, high-quality interview.

OUTPUT CONTRACT (MANDATORY):
- Return ONLY valid JSON.
- No markdown, no code fences, no commentary.
- Do not add extra top-level keys.
- Keep values concise and directly usable by backend.

TARGET ROLE: ${role}

CANDIDATE RESUME SUMMARY:
- Experience: ${resumeSummary.experience_level} (${resumeSummary.experience_years} years)
- ATS Score: ${resumeSummary.ats_score}/100
- Top Skills: ${resumeSummary.top_skills.map(s => s.name).join(', ')}
- Key Strengths: ${resumeSummary.strengths.join(', ')}

INTERVIEW CONVERSATION:
${conversationHistory || 'Interview started'}

PREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT OR PARAPHRASE):
${askedQuestions.length > 0 ? askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : 'None yet'}

QUESTION TYPE COUNTS SO FAR:
${JSON.stringify(typeCounts)}

TYPE LIMITS:
${JSON.stringify(questionLimits)}

CURRENT QUESTION: "${currentQuestion}"

CANDIDATE ANSWER: "${userAnswer}"

---

Now evaluate this answer and generate the next question.

NONSENSICAL / OFF-TOPIC ANSWER HANDLING:
- If the candidate's answer is a joke, nonsensical, off-topic, unrelated to the question or target role, or empty (for example: "i think we should increase the height of the room 😅", or talking about unrelated things like furniture, games, weather):
  - You MUST award a score of EXACTLY 0 to 10 (never higher!) & lead towards the ending of the interview as soon as possible (minimize the questions).
  - Set rating to "weak".
  - Set confidence to 0.0.
  - Set all dimensions (technical_proficiency, communication, problem_solving) to 0.0.
  - In mistakes and feedback, explicitly state that the response is completely off-topic or nonsensical.

STRICT RULES:
- CRITICAL SCORING STRICTNESS: Be extremely strict and rigorous. Do NOT give generous scores. 
- If the answer is off-topic, unrelated, brief, empty, or completely misses the point, score it strictly below 25 (rating: "weak", and reduce confidence).
- High scores (80+) must be hard to earn—requiring detailed, context-rich, concrete explanations with metrics and evidence.
- Penalize vague, buzzword-heavy, generic, or textbook definitions that lack personal experience/evidence.
- Never ask the same question or close paraphrase of any previous question.
- Similar wording with same intent is also forbidden.
- Prefer new dimensions over re-asking project/skills repeatedly.
- If candidate repeats/similarly repeats answers, penalize score and confidence.
- Repeated answers must not receive medium/high score unless genuinely improved with new detail.
- Track loopholes: vague claims, missing evidence, inconsistent statements, no metrics.
- Penalize loopholes explicitly in mistakes/feedback.
- Keep interview balanced by type counts/limits provided above.
- Do not exceed a type limit. If limit reached, switch type or set next_question=null.
- Use follow_up only when it adds new signal, not as repetition.
- If any early-end condition is met, set "next_question": null.
- Early-end conditions (strict):
  1) candidate gives repeated/similar answers across multiple turns,
  2) multiple low/weak score answers in recent turns,
  3) no new information despite follow-up,
  4) enough evidence already collected for final decision.
- When early-end condition is met, do not ask another question.
- Difficulty should adapt to performance: weak->easy/medium, good->medium/hard.
- Keep next question short, specific, and non-redundant.

CONTEXT USAGE RULE:
- Use the full conversation history provided above for decisions, not only the latest turn.

**IMPORTANT**: Return EXACTLY this JSON structure (no markdown, no code blocks):

{
  "answer_evaluation": {
    "score": <0-100 integer>,
    "rating": "<good|average|weak>",
    "confidence": <0-1 decimal>,
    "dimensions": {
      "technical_proficiency": <0-1>,
      "communication": <0-1>,
      "problem_solving": <0-1>
    },
    "strengths": ["strength1", "strength2"],
    "mistakes": ["mistake1"],
    "feedback": "Brief feedback on the answer"
  },
  "next_question": {
    "text": "Next question to ask",
    "type": "<technical|hr|resume|scenario|follow_up>",
    "difficulty": "<easy|medium|hard>",
    "reason": "<follow_up|weak_answer|topic_switch|depth_increase>"
  } OR null
}`;

  // Retry logic: try once, retry once, then fallback
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[Question Flow AI] Attempt ${attempt}/2`);
      const response = await generateText(prompt, { apiKey: context.apiKey });

      // Safe JSON parse with fallback evaluation
      const fallback = {
        answer_evaluation: getFallbackEvaluation(),
        next_question: getFallbackQuestion()
      };

      let jsonResponse = safeJsonParse(response, fallback, `Question Flow AI (Attempt ${attempt})`);

      // If parsing returned fallback, use it
      if (jsonResponse === fallback) {
        if (attempt === 2) {
          console.warn('[Question Flow AI] Using fallback after 2 attempts');
          return fallback;
        }
        lastError = 'Parse failed';
        continue; // Retry
      }

      const normalized = {
        answer_evaluation:
          jsonResponse?.answer_evaluation ||
          jsonResponse?.evaluation ||
          jsonResponse?.answerEvaluation,
        next_question:
          Object.prototype.hasOwnProperty.call(jsonResponse || {}, 'next_question')
            ? jsonResponse.next_question
            : jsonResponse?.nextQuestion
      };

      // Validate required fields exist (next_question may be null intentionally)
      if (!normalized.answer_evaluation || typeof normalized.next_question === 'undefined') {
        if (attempt === 2) {
          console.warn('[Question Flow AI] Missing fields, using fallback');
          return fallback;
        }
        lastError = 'Missing required fields';
        continue; // Retry
      }

      return {
        answer_evaluation: normalized.answer_evaluation,
        next_question: normalized.next_question
      };
    } catch (error) {
      lastError = error.message;
      console.error(`[Question Flow AI] Attempt ${attempt} failed:`, error.message);

      if (attempt === 2) {
        // All retries exhausted, use fallback
        console.warn('[Question Flow AI] All retries exhausted, using fallback');
        return {
          answer_evaluation: getFallbackEvaluation(),
          next_question: getFallbackQuestion()
        };
      }
      // Continue to next attempt
    }
  }

  // Safety fallback (should not reach here)
  return {
    answer_evaluation: getFallbackEvaluation(),
    next_question: getFallbackQuestion()
  };
}

/**
 * AI Module 2: Final Evaluation
 * Reviews all interview evaluations and generates final verdict
 * 
 * @param {Array} evaluations - All question evaluations
 * @param {Object} resumeSummary - Resume summary
 * @param {string} role - Target role
 * @param {string} apiKey - Custom API key (optional)
 * @returns {Promise<Object>} Final verdict with 7 dimensions
 */
async function callFinalEvaluationAI(evaluations, resumeSummary, role, apiKey = null) {
  if (!evaluations || evaluations.length === 0) {
    throw new Error('No evaluations provided for final assessment');
  }

  // Calculate aggregate scores
  const scores = evaluations.map(e => e.score || 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const technicalScores = evaluations.map(e => e.technical_score || 0);
  const avgTechnical = technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length;
  const commScores = evaluations.map(e => e.communication_score || 0);
  const avgComm = commScores.reduce((a, b) => a + b, 0) / commScores.length;
  const probScores = evaluations.map(e => e.problem_solving_score || 0);
  const avgProb = probScores.reduce((a, b) => a + b, 0) / probScores.length;

  // Count ratings
  const ratings = evaluations.map(e => e.rating);
  const weakCount = ratings.filter(r => r === 'weak').length;
  const goodCount = ratings.filter(r => r === 'good').length;

  // Extract all feedback
  const feedback = evaluations.map(e => e.feedback).filter(Boolean);

  // Calculate confidence trend from evaluations (NOT from AI)
  const { calculateConfidenceTrend } = require('./interviewUtils');
  const confidenceTrend = calculateConfidenceTrend(evaluations);

  const prompt = `You are a senior hiring manager evaluating a complete interview.

OUTPUT CONTRACT (MANDATORY):
- Return ONLY valid JSON.
- No markdown, no code fences, no extra prose.
- Strictly use the schema below.

TARGET ROLE: ${role}

CANDIDATE RESUME:
- Experience: ${resumeSummary.experience_level} (${resumeSummary.experience_years} years)
- ATS Score: ${resumeSummary.ats_score}/100

INTERVIEW STATISTICS:
- Total Questions: ${evaluations.length}
- Average Score: ${avgScore.toFixed(1)}/100
- Good Answers: ${goodCount}
- Weak Answers: ${weakCount}

TECHNICAL ASSESSMENT: ${(avgTechnical / 100 * 5).toFixed(1)}/5
COMMUNICATION: ${(avgComm / 100 * 5).toFixed(1)}/5
PROBLEM SOLVING: ${(avgProb / 100 * 5).toFixed(1)}/5

INTERVIEW FEEDBACK HIGHLIGHTS:
${feedback.slice(0, 5).join('\n- ')}

---

Based on this complete interview, provide a final assessment.

STRICT EVALUATION RULES:
- Be extremely rigorous. No generous or encouraging uplifting. Only score what is genuinely earned.
- Do not inflate overall_score. If the candidate had multiple weak answers, or failed to explain key concepts, score conservatively (e.g., overall_score below 50, and verdict HIRE is not allowed).
- Overall score and dimension scores must reflect the true rigorous average of their performance.
- Verdict STRONG_HIRE should be exceptionally rare, reserved only for candidates who exhibited master-level proficiency, technical depth, and clear evidence in almost every response.
- If the candidate provided off-topic, vague, or empty responses, they must be graded strictly as NO_HIRE or LEANING_NO, and overall_score must be heavily penalized (below 45).
- Detect redundancy patterns in candidate responses and reflect them in weaknesses/key_observations.
- Penalize repeated low-information answers and unsupported claims.
- Keep scores internally consistent (e.g., low dimensions should not produce very high overall).
- Include practical, actionable improvement_suggestions.

**IMPORTANT**: Return EXACTLY this JSON structure (no markdown, no code blocks):

{
  "overall_score": <0-100>,
  "verdict": "<STRONG_HIRE|HIRE|LEANING_NO|NO_HIRE>",
  "dimension_scores": {
    "role_alignment": <0-100>,
    "technical_proficiency": <0-100>,
    "problem_solving": <0-100>,
    "communication": <0-100>,
    "confidence": <0-100>,
    "behavioral_fit": <0-100>,
    "leadership": <0-100>
  },
  "confidence_trend": [<0-1>, <0-1>, <0-1>],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1"],
  "key_observations": ["observation1"],
  "improvement_suggestions": ["suggestion1"]
}`;

  const defaultFallback = {
    overall_score: 60,
    verdict: 'LEANING_NO',
    dimension_scores: {
      role_alignment: 60,
      technical_proficiency: 60,
      problem_solving: 60,
      communication: 60,
      confidence: 60,
      behavioral_fit: 60,
      leadership: 60
    },
    confidence_trend: confidenceTrend || [0.5],
    strengths: ['Completed interview'],
    weaknesses: ['Unable to fully assess'],
    key_observations: [],
    improvement_suggestions: [],
    is_fallback: true // Mark as approximated
  };

  // Retry logic: try once, retry once, then fallback
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[Final Evaluation AI] Attempt ${attempt}/2`);
      const response = await generateText(prompt, { apiKey });
      const jsonResponse = safeJsonParse(response, defaultFallback, `Final Evaluation AI (Attempt ${attempt})`);

      // If parsing returned fallback, retry once before returning fallback
      if (jsonResponse === defaultFallback) {
        if (attempt === 2) {
          console.warn('[Final Evaluation AI] Using fallback after 2 attempts');
          return defaultFallback;
        }
        continue;
      }

      // Ensure confidence_trend is set properly (computed above, not from AI)
      if (!jsonResponse.confidence_trend || jsonResponse.confidence_trend.length === 0) {
        jsonResponse.confidence_trend = confidenceTrend || [avgScore / 100];
      }

      return jsonResponse;
    } catch (error) {
      console.error(`[AI Error] Final evaluation AI attempt ${attempt} failed:`, error.message);
      if (attempt === 2) {
        console.warn('[Final Evaluation AI] All retries exhausted, using fallback');
        return defaultFallback;
      }
    }
  }

  // Safety fallback
  return defaultFallback;
}

module.exports = {
  callQuestionFlowAI,
  callFinalEvaluationAI
};
