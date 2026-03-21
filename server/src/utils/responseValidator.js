/**
 * Response Validator
 * Validates Gemini AI response structure and format for resume analysis
 * Utility Layer - Ensures data quality before database storage
 */

const Joi = require('joi');

/**
 * Joi schema for validating resume analysis response from Gemini
 * Defines the exact structure and data types expected
 */
const resumeAnalysisSchema = Joi.object({
  resume_context: Joi.object({
    target_role: Joi.string().min(2).max(200).required(),
    detected_experience_level: Joi.string().min(1).max(100).required(), // AI-detected from resume
    detected_experience_years: Joi.number().min(0).max(70).allow(null).required() // AI-detected from dates
  })
    .required(),

  ats_analysis: Joi.object({
    score: Joi.number().min(0).max(100).required(),
    verdict: Joi.string()
      .valid('Poor', 'Fair', 'Good', 'Very Good', 'Excellent')
      .required(),
    explanation: Joi.string().min(10).max(1000).required()
  })
    .required(),

  skills_analysis: Joi.object({
    identified: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(100).required(),
          level: Joi.string()
            .valid('basic', 'intermediate', 'advanced')
            .required()
        })
      )
      .required(),
    additional_user_skills: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(100).required(),
          level: Joi.string()
            .valid('basic', 'intermediate', 'advanced')
            .required()
        })
      )
      .required()
  })
    .required(),

  experience_analysis: Joi.object({
    total_estimated_years: Joi.number().min(0).max(70).allow(null).required(),
    role_based_experience: Joi.array()
      .items(
        Joi.object({
          area: Joi.string().min(2).max(100).required(),
          experience_years: Joi.number().min(0).required(),
          experience_score: Joi.number().min(0).max(100).required()
        })
      )
      .required(),
    project_count: Joi.number().min(0).required(),
    internship_experience: Joi.boolean().required()
  })
    .required(),

  education_analysis: Joi.object({
    educations: Joi.array()
      .items(
        Joi.object({
          degree: Joi.string().min(1).max(100).allow(null).required(),
          field_of_study: Joi.string().min(1).max(200).allow(null).required(),
          institution: Joi.string().min(1).max(200).allow(null).required(),
          institution_type: Joi.string().min(1).max(100).allow(null).required(),
          start_year: Joi.number().min(1900).max(new Date().getFullYear() + 10).allow(null).required(),
          end_year: Joi.number().min(1900).max(new Date().getFullYear() + 10).allow(null).required(),
          status: Joi.string()
            .valid('Completed', 'Pursuing', 'Planned', 'In Progress', 'Dropped')
            .allow(null)
            .required()
        })
      )
      .required()
  })
    .required(),

  resume_sections: Joi.object({
    summary: Joi.boolean().required(),
    education: Joi.boolean().required(),
    projects: Joi.boolean().required(),
    experience: Joi.boolean().required(),
    skills: Joi.boolean().required(),
    certifications: Joi.boolean().required()
  })
    .required(),

  swot_analysis: Joi.object({
    strengths: Joi.array().items(Joi.string().min(5).max(500)).required(),
    weaknesses: Joi.array().items(Joi.string().min(5).max(500)).required(),
    opportunities: Joi.array().items(Joi.string().min(5).max(500)).required(),
    threats: Joi.array().items(Joi.string().min(5).max(500)).required()
  })
    .required(),

  resume_improvements: Joi.object({
    high_priority: Joi.array()
      .items(
        Joi.object({
          area: Joi.string().min(2).max(100).required(),
          suggestion: Joi.string().min(10).max(500).required(),
          impact: Joi.string().valid('High', 'Medium', 'Low').required()
        })
      )
      .required(),
    medium_priority: Joi.array()
      .items(
        Joi.object({
          area: Joi.string().min(2).max(100).required(),
          suggestion: Joi.string().min(10).max(500).required(),
          impact: Joi.string().valid('High', 'Medium', 'Low').required()
        })
      )
      .required(),
    low_priority: Joi.array()
      .items(
        Joi.object({
          area: Joi.string().min(2).max(100).required(),
          suggestion: Joi.string().min(10).max(500).required(),
          impact: Joi.string().valid('High', 'Medium', 'Low').required()
        })
      )
      .required()
  })
    .required(),

  recommendations: Joi.object({
    career_growth: Joi.array().items(Joi.string().min(5).max(500)).required(),
    learning_focus: Joi.array().items(Joi.string().min(5).max(500)).required()
  })
    .required(),

  analysis_metadata: Joi.object({
    model: Joi.string().min(1).max(100).required(),
    prompt_version: Joi.string().min(1).max(50).required(),
    analyzed_at: Joi.string().isoDate().required()
  })
    .required()
});

/**
 * Validate resume analysis response structure
 * Checks if response matches expected JSON schema
 * @param {Object} analysisData - Resume analysis data from Gemini
 * @returns {Object} Validation result with errors if any
 */
const validateAnalysisStructure = (analysisData) => {
  try {
    if (!analysisData || typeof analysisData !== 'object') {
      return {
        isValid: false,
        errors: ['Analysis data must be a non-null object'],
        data: null
      };
    }

    // Validate using Joi schema
    const { error, value } = resumeAnalysisSchema.validate(analysisData, {
      abortEarly: false, // Collect all errors
      stripUnknown: true // Remove any extra fields
    });

    if (error) {
      const errorMessages = error.details.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return {
        isValid: false,
        errors: errorMessages,
        data: null
      };
    }

    return {
      isValid: true,
      errors: [],
      data: value
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`],
      data: null
    };
  }
};

/**
 * Sanitize analysis data for safe database storage
 * Removes any potentially harmful content while preserving data integrity
 * @param {Object} analysisData - Validated analysis data
 * @returns {Object} Sanitized data ready for database storage
 */
const sanitizeAnalysisData = (analysisData) => {
  try {
    // Deep clone to avoid mutations
    const sanitized = JSON.parse(JSON.stringify(analysisData));

    // Trim all string fields
    const trimStrings = (obj) => {
      if (typeof obj === 'string') {
        return obj.trim();
      }
      if (Array.isArray(obj)) {
        return obj.map(trimStrings);
      }
      if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = trimStrings(value);
        }
        return result;
      }
      return obj;
    };

    return trimStrings(sanitized);
  } catch (error) {
    console.error('Error sanitizing analysis data:', error);
    return analysisData;
  }
};

/**
 * Complete validation pipeline
 * Validates structure, then sanitizes, then checks data quality
 * @param {Object} analysisData - Resume analysis from Gemini
 * @returns {Object} Complete validation result
 */
const validateAndSanitizeAnalysis = (analysisData) => {
  // Step 1: Validate structure
  const structureValidation = validateAnalysisStructure(analysisData);

  if (!structureValidation.isValid) {
    return {
      success: false,
      data: null,
      errors: structureValidation.errors,
      stage: 'structure_validation'
    };
  }

  // Step 2: Sanitize
  const sanitized = sanitizeAnalysisData(structureValidation.data);

  // Step 3: Quality checks
  const qualityChecks = [];

  if (!sanitized.resume_context.target_role) {
    qualityChecks.push('Target role is missing');
  }

  if (sanitized.ats_analysis.score < 30) {
    qualityChecks.push('Warning: Very low ATS score (below 30)');
  }

  if (sanitized.skills_analysis.identified.length === 0) {
    qualityChecks.push('Warning: No skills identified in resume');
  }

  if (sanitized.experience_analysis.total_estimated_years === 0) {
    qualityChecks.push('Warning: No experience detected in resume');
  }

  return {
    success: true,
    data: sanitized,
    warnings: qualityChecks.length > 0 ? qualityChecks : null,
    stage: 'validation_complete'
  };
};

module.exports = {
  validateAnalysisStructure,
  sanitizeAnalysisData,
  validateAndSanitizeAnalysis,
  resumeAnalysisSchema
};
