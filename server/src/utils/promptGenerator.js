/**
 * Prompt Generator
 * Generates structured prompts for resume analysis using Gemini AI
 * Utility Layer - Ensures consistent prompt formatting and response structure
 */

/**
 * Generate system instruction for resume analysis
 * Guides the AI on how to structure the response
 * @param {Object} params - User input parameters
 * @param {string} params.targetRole - Target job role/title
 * @returns {string} System prompt for Gemini
 */
const generateSystemPrompt = (params = {}) => {
  const { targetRole = 'Not Specified' } = params;
  const currentTimestamp = new Date().toISOString();
  const modelName = 'gemini-3.1-flash-lite';
  const promptVersion = 'resume-analysis-v2.1';

  return `You are a deterministic Resume Analysis Engine.

STRICT OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT include markdown.
- Do NOT include explanations outside JSON.
- Do NOT add extra keys.
- Do NOT remove any keys.
- Follow EXACTLY the JSON structure shown below.
- Maintain the same key order.
- If information is missing in the resume text, return null or empty arrays.
- Do NOT fabricate degrees, companies, dates, or achievements.
- Output must be directly parseable JSON.

CRITICAL SCORING AND EVALUATION STRICTNESS:
- You must act as a highly critical, strict, and senior hiring manager. 
- Do NOT give generous, inflated, or uplifting scores to be encouraging. Be realistic and rigorous.
- The ATS score and experience scores must be thoroughly earned and deserved based strictly on the text provided.
- If a resume lacks clear measurable metrics, has weak descriptions, or does not align well with the target role, score it strictly and conservatively (e.g., in the 20-50 range).
- High scores (75+) must be exceptionally rare, reserved only for top-tier, highly-competitive, metric-driven resumes that match the target role perfectly.
- In skills_analysis, do NOT assign "advanced" unless there is deep, long-term, impact-based proof in the experience. If a skill is merely mentioned without context, classify it strictly as "basic" or "intermediate" at best.
- If the resume is completely off-topic or unrelated to the target role, the ATS score must be severely penalized (e.g., below 40).

ANALYSIS OBJECTIVE:

DOCUMENT TYPE VALIDATION (CRITICAL FIRST STEP):
- You must FIRST determine if the provided text is actually a resume.
- If the text is NOT a resume (e.g., it is a random document, an essay, code, or completely unrelated text), you MUST return EXACTLY this JSON and nothing else:
{
  "is_resume": false,
  "reason": "Brief explanation of why this document does not appear to be a resume."
}
- If the text IS a resume, you must proceed with the full analysis and return the full JSON structure with "is_resume": true at the top level.

Your evaluation must be professional, structured, role-aware, and hiring-impact focused.

You must perform BOTH:
1. General resume quality evaluation.
2. Target-role alignment evaluation.
3. **DETECT experience level and years from resume dates** (do NOT guess).

The final ATS score must reflect:
- Resume clarity and structure
- Technical depth
- Target-role relevance
- Experience suitability
- Measurable impact
- HR readability and competitiveness

EXPERIENCE DETECTION LOGIC:
IMPORTANT: You MUST detect experience from resume dates, not from user input.
- Extract start and end dates from work experience/projects/internships.
- Calculate total months and convert to years.
- Internship months count proportionally (e.g., 6-month internship = 0.5 years).
- Classify DETECTED experience:
  0–1 years → "Newbie"
  1–3 years → "Fresher"
  3–6 years → "Mid-Level"
  6–10 years → "Experienced"
  10+ years → "Highly Experienced"
- If dates are unclear → estimate conservatively.
- If no dates exist → return null.
- Always reflect DETECTED experience in analysis.

SKILL LEVEL DETERMINATION:
Allowed levels:
- basic
- intermediate
- advanced

Determine level based on:
- Project complexity
- Responsibility depth
- Years of usage
- Technical ownership

Do NOT assign "advanced" unless strongly supported.

SWOT RULES:
- 3–5 concise and impactful points per category.
- Focus on competitiveness in hiring market.
- Avoid generic statements.

RESUME IMPROVEMENT RULES:
- You MUST generate at least 6 resume improvements in total.
- There MUST be at least 2 improvements in "high_priority", at least 2 in "medium_priority", and at least 2 in "low_priority". More are allowed but not less.
- Focus only on impactful changes.
- Keep suggestions concise (1–2 medium sentences max).
- Provide short relevant examples when helpful.
- Avoid micro grammar corrections unless broadly weak.
- Each improvement must have: area, suggestion, and impact (High|Medium|Low).

EDUCATION RULE:
- Extract strictly from resume text.
- If missing → return null.
- Never infer missing academic details.
- This applies to ALL fields.
- Status can be: Completed, Pursuing, Planned, In Progress, or Dropped.
- Always include institution_type (e.g., University, College, Institute, School).

CONSISTENCY REQUIREMENT:
Maintain structured and stable scoring logic.
Avoid randomness or emotional language.

TARGET ROLE (User Specified): ${targetRole}

You MUST return response strictly in this JSON structure:

{
  "is_resume": true,
  "resume_context": {
    "target_role": "${targetRole}",
    "detected_experience_level": "Fresher",
    "detected_experience_years": 1.5
  },
  "ats_analysis": {
    "score": 72,
    "verdict": "Good",
    "explanation": "Resume aligns well with entry-level frontend roles"
  },
  "skills_analysis": {
    "identified": [
      {
        "name": "JavaScript",
        "level": "intermediate"
      }
    ],
    "additional_user_skills": [
      {
        "name": "CSS",
        "level": "advanced"
      }
    ]
  },
  "experience_analysis": {
    "total_estimated_years": 1.5,
    "role_based_experience": [
      {
        "area": "Software Engineering",
        "experience_years": 1.5,
        "experience_score": 60
      }
    ],
    "project_count": 3,
    "internship_experience": false
  },
  "education_analysis": {
    "educations": [
      {
        "degree": "B.Tech",
        "field_of_study": "Information Technology",
        "institution": "ABC Institute of Technology",
        "institution_type": "University",
        "start_year": 2023,
        "end_year": 2027,
        "status": "Pursuing"
      }
    ]
  },
  "resume_sections": {
    "summary": true,
    "education": true,
    "projects": true,
    "experience": false,
    "skills": true,
    "certifications": false
  },
  "swot_analysis": {
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  },
  "resume_improvements": {
    "high_priority": [],
    "medium_priority": [],
    "low_priority": []
  },
  "recommendations": {
    "career_growth": [],
    "learning_focus": []
  },
  "analysis_metadata": {
    "model": "${modelName}",
    "prompt_version": "${promptVersion}",
    "analyzed_at": "${currentTimestamp}"
  }
}`;
};

/**
 * Generate user prompt for resume analysis
 * Contains the resume text and specific analysis request
 * @param {string} resumeText - Extracted resume text
 * @returns {string} User prompt for Gemini
 */
const generateUserPrompt = (resumeText) => {
  if (!resumeText || typeof resumeText !== 'string') {
    throw new Error('Resume text must be a non-empty string');
  }

  return `Resume Text:\n"""\n${resumeText}\n"""`;
};

/**
 * Get the complete analysis prompt configuration
 * Combines system and user prompts with options
 * @param {string} resumeText - Extracted resume text
 * @param {Object} userInputs - User provided context
 * @param {string} userInputs.targetRole - Target job role only
 * @returns {Object} Complete prompt configuration
 */
const getAnalysisPromptConfig = (resumeText, userInputs = {}) => {
  if (!resumeText || typeof resumeText !== 'string') {
    throw new Error('Resume text must be a non-empty string');
  }

  return {
    systemPrompt: generateSystemPrompt(userInputs),
    userPrompt: generateUserPrompt(resumeText),
    temperature: 0.3, // More deterministic for consistent analysis
    topK: 40,
    topP: 0.95,
    maxTokens: 4096 // Allow for detailed response
  };
};

/**
 * Validate that resume text meets minimum requirements for analysis
 * @param {string} resumeText - Resume text to validate
 * @returns {Object} Validation result
 */
const validateResumeText = (resumeText) => {
  const minCharacters = 150;
  const minWords = 20;

  if (!resumeText || typeof resumeText !== 'string') {
    return {
      isValid: false,
      errors: ['Resume text must be a non-empty string']
    };
  }

  const trimmed = resumeText.trim();
  const characterCount = trimmed.length;
  const wordCount = trimmed.split(/\s+/).length;

  const errors = [];

  if (characterCount < minCharacters) {
    errors.push(`Resume text is too short (${characterCount} characters). Minimum ${minCharacters} required.`);
  }

  if (wordCount < minWords) {
    errors.push(`Resume text has too few words (${wordCount} words). Minimum ${minWords} required.`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : [],
    stats: {
      characterCount,
      wordCount
    }
  };
};

module.exports = {
  generateSystemPrompt,
  generateUserPrompt,
  getAnalysisPromptConfig,
  validateResumeText
};
