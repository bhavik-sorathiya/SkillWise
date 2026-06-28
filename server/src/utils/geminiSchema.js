const { Type } = require('@google/genai');

/**
 * Gemini AI Structured Output Schema
 * Enforces the exact JSON structure returned by the model natively.
 */
const resumeSchema = {
  type: Type.OBJECT,
  required: [
    "is_resume", 
    "resume_context", 
    "ats_analysis", 
    "skills_analysis", 
    "experience_analysis", 
    "education_analysis", 
    "resume_sections", 
    "swot_analysis", 
    "resume_improvements", 
    "recommendations", 
    "analysis_metadata"
  ],
  properties: {
    is_resume: {
      type: Type.BOOLEAN,
      description: "Must be true if the document is a valid resume, CV, or professional profile. False otherwise."
    },
    reason: {
      type: Type.STRING,
      description: "If is_resume is false, explain why.",
      nullable: true
    },
    resume_context: {
      type: Type.OBJECT,
      required: ["target_role", "detected_experience_level", "detected_experience_years", "completeness_score"],
      properties: {
        target_role: { type: Type.STRING, description: "Maximum 100 characters. E.g. Software Engineer" },
        detected_experience_level: { type: Type.STRING },
        detected_experience_years: { type: Type.NUMBER, nullable: true },
        completeness_score: { type: Type.NUMBER }
      }
    },
    ats_analysis: {
      type: Type.OBJECT,
      required: ["score", "verdict", "explanation"],
      properties: {
        score: { type: Type.NUMBER },
        verdict: { type: Type.STRING, description: "One of: Poor, Fair, Good, Very Good, Excellent" },
        explanation: { type: Type.STRING }
      }
    },
    skills_analysis: {
      type: Type.OBJECT,
      required: ["identified", "additional_user_skills"],
      properties: {
        identified: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["name", "level"],
            properties: {
              name: { type: Type.STRING },
              level: { type: Type.STRING, description: "One of: basic, intermediate, advanced" }
            }
          }
        },
        additional_user_skills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["name", "level"],
            properties: {
              name: { type: Type.STRING },
              level: { type: Type.STRING }
            }
          }
        }
      }
    },
    experience_analysis: {
      type: Type.OBJECT,
      required: ["total_estimated_years", "role_based_experience", "project_count", "internship_experience"],
      properties: {
        total_estimated_years: { type: Type.NUMBER, nullable: true },
        role_based_experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["area", "experience_years", "experience_score"],
            properties: {
              area: { type: Type.STRING },
              experience_years: { type: Type.NUMBER },
              experience_score: { type: Type.NUMBER }
            }
          }
        },
        project_count: { type: Type.NUMBER },
        internship_experience: { type: Type.BOOLEAN }
      }
    },
    education_analysis: {
      type: Type.OBJECT,
      required: ["educations"],
      properties: {
        educations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["degree", "field_of_study", "institution", "institution_type", "start_year", "end_year", "status"],
            properties: {
              degree: { type: Type.STRING, nullable: true },
              field_of_study: { type: Type.STRING, nullable: true },
              institution: { type: Type.STRING, nullable: true },
              institution_type: { type: Type.STRING, nullable: true },
              start_year: { type: Type.NUMBER, nullable: true },
              end_year: { type: Type.NUMBER, nullable: true },
              status: { type: Type.STRING, nullable: true }
            }
          }
        }
      }
    },
    resume_sections: {
      type: Type.OBJECT,
      required: ["summary", "education", "projects", "experience", "skills", "certifications"],
      properties: {
        summary: { type: Type.BOOLEAN },
        education: { type: Type.BOOLEAN },
        projects: { type: Type.BOOLEAN },
        experience: { type: Type.BOOLEAN },
        skills: { type: Type.BOOLEAN },
        certifications: { type: Type.BOOLEAN }
      }
    },
    swot_analysis: {
      type: Type.OBJECT,
      required: ["strengths", "weaknesses", "opportunities", "threats"],
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    resume_improvements: {
      type: Type.OBJECT,
      required: ["high_priority", "medium_priority", "low_priority"],
      properties: {
        high_priority: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["area", "suggestion", "impact"],
            properties: {
              area: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              impact: { type: Type.STRING }
            }
          }
        },
        medium_priority: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["area", "suggestion", "impact"],
            properties: {
              area: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              impact: { type: Type.STRING }
            }
          }
        },
        low_priority: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["area", "suggestion", "impact"],
            properties: {
              area: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              impact: { type: Type.STRING }
            }
          }
        }
      }
    },
    recommendations: {
      type: Type.OBJECT,
      required: ["career_growth", "learning_focus"],
      properties: {
        career_growth: { type: Type.ARRAY, items: { type: Type.STRING } },
        learning_focus: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    analysis_metadata: {
      type: Type.OBJECT,
      required: ["model", "prompt_version", "analyzed_at"],
      properties: {
        model: { type: Type.STRING },
        prompt_version: { type: Type.STRING },
        analyzed_at: { type: Type.STRING }
      }
    }
  }
};

module.exports = resumeSchema;
