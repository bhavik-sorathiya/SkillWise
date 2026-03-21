/**
 * Resume Summarizer
 * Extracts key resume information for use in AI context
 * One-time generation per session with caching + fallback
 */

const db = require('../config/db');

/**
 * Generate resume summary from resume_analysis JSON
 * With fallback: if not found, try to fetch from user_resumes
 * @param {number} resumeId - Resume ID
 * @returns {Promise<Object>} Summarized resume data
 */
async function generateResumeSummary(resumeId) {
  const query = `
    SELECT analysis_data FROM resume_analysis WHERE resume_id = ? LIMIT 1
  `;

  const [rows] = await db.execute(query, [resumeId]);

  // If analysis found, use it
  if (rows && rows.length > 0) {
    try {
      const analysisData = typeof rows[0].analysis_data === 'string'
        ? JSON.parse(rows[0].analysis_data)
        : rows[0].analysis_data;
      return extractSummary(analysisData);
    } catch (err) {
      throw new Error(`Failed to parse resume analysis: ${err.message}`);
    }
  }

  // FALLBACK: If no analysis found, create minimal summary
  console.warn(`[resumeSummarizer] No analysis found for resume ${resumeId} - using fallback`);
  return createFallbackSummary(resumeId);
}

/**
 * Create fallback summary if analysis not available
 * Used when resume_analysis record doesn't exist
 * @param {number} resumeId - Resume ID
 * @returns {Object} Minimal summary
 */
function createFallbackSummary(resumeId) {
  return {
    target_role: 'Not specified',
    experience_level: 'Not specified',
    experience_years: 0,
    ats_score: 0,
    top_skills: [],
    key_projects: 0,
    experience_areas: [],
    education: [],
    strengths: [],
    weaknesses: [],
    is_summary: true,
    is_fallback: true,
    generated_at: new Date().toISOString()
  };
}

/**
 * Extract key information from resume analysis
 * DO NOT send raw JSON - return summarized object only
 * @param {Object} analysisData - Full resume analysis data
 * @returns {Object} Summarized resume
 */
function extractSummary(analysisData) {
  const {
    resume_context = {},
    skills_analysis = {},
    experience_analysis = {},
    education_analysis = {},
    ats_analysis = {}
  } = analysisData;

  // Extract top 5-8 skills
  const allSkills = [
    ...(skills_analysis.identified || []),
    ...(skills_analysis.additional_user_skills || [])
  ];
  const topSkills = allSkills.slice(0, 8).map(s => ({
    name: s.name,
    level: s.level
  }));

  // Extract key projects (if available)
  const keyProjects = experience_analysis.project_count || 0;

  // Extract education summary
  const educationSummary = (education_analysis.educations || []).map(edu => ({
    degree: edu.degree,
    field: edu.field_of_study,
    institution: edu.institution,
    status: edu.status
  }));

  // Extract experience areas
  const experienceAreas = (experience_analysis.role_based_experience || []).map(exp => ({
    area: exp.area,
    years: exp.experience_years,
    score: exp.experience_score
  }));

  return {
    target_role: resume_context.target_role || 'Not specified',
    experience_level: resume_context.experience_level || 'Not specified',
    experience_years: experience_analysis.total_estimated_years || 0,
    ats_score: ats_analysis.score || 0,
    top_skills: topSkills,
    key_projects: keyProjects,
    experience_areas: experienceAreas,
    education: educationSummary,
    strengths: analysisData.swot_analysis?.strengths || [],
    weaknesses: analysisData.swot_analysis?.weaknesses || [],

    // Keep these for context reference
    is_summary: true,
    generated_at: new Date().toISOString()
  };
}

module.exports = {
  generateResumeSummary,
  extractSummary,
  createFallbackSummary
};
