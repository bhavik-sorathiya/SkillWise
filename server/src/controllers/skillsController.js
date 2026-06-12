// server/src/controllers/skillsController.js
// Skills management — operates exclusively on resume_analysis.analysis_data
// No profile_data reads/writes (that column is gone in skillwise_dev schema)

const db = require('../config/db');

/**
 * Parse JSON data safely - handle both string and object formats
 */
const parseJSONData = (data) => {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return null;
    }
  }
  return data;
};

/**
 * Fetch the latest active resume analysis for a user
 * Returns { id, analysis_data, resume_id } or null
 */
const getLatestResumeAnalysis = async (userId) => {
  const [rows] = await db.execute(
    `SELECT ra.id, ra.analysis_data, ur.id as resume_id
     FROM resume_analysis ra
     JOIN user_resumes ur ON ra.resume_id = ur.id
     WHERE ur.user_id = ? AND ur.status = 'active'
     ORDER BY ur.uploaded_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * GET /api/skills
 * Read skills from the latest active resume's analysis_data
 */
exports.getSkills = async (req, res) => {
  try {
    const userId = req.user.id;

    const analysisRow = await getLatestResumeAnalysis(userId);

    if (!analysisRow) {
      return res.status(200).json({
        success: true,
        skills: [],
        source: 'none',
        message: 'No resume analysis found. Upload a resume to see your skills.'
      });
    }

    const analysisData = parseJSONData(analysisRow.analysis_data) || {};
    const identified = analysisData.skills_analysis?.identified || [];

    const skills = identified.map((skill, index) => ({
      id: index + 1,
      name: skill.name,
      skill_name: skill.name,
      level: skill.level || 'intermediate',
      source: skill.source || 'resume'
    }));

    return res.status(200).json({
      success: true,
      skills,
      source: 'resume_analysis',
      count: skills.length
    });
  } catch (error) {
    console.error('Get skills error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve skills',
      error: error.message
    });
  }
};

/**
 * POST /api/skills/add
 * Add a skill to the latest active resume's analysis_data
 * Body: { skill_name, proficiency_level, years_of_experience }
 */
exports.addSkill = async (req, res) => {
  try {
    const { skill_name, proficiency_level = 'intermediate', years_of_experience = 0 } = req.body;
    const userId = req.user.id;

    if (!skill_name || skill_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    const validProficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];
    const normalizedProficiency = proficiency_level.toLowerCase();
    if (!validProficiencies.includes(normalizedProficiency)) {
      return res.status(400).json({
        success: false,
        message: `Invalid proficiency level. Must be one of: ${validProficiencies.join(', ')}`
      });
    }

    const analysisRow = await getLatestResumeAnalysis(userId);

    if (!analysisRow) {
      return res.status(404).json({
        success: false,
        message: 'No resume analysis found. Upload a resume before adding skills.'
      });
    }

    const analysisData = parseJSONData(analysisRow.analysis_data) || {};

    if (!analysisData.skills_analysis) {
      analysisData.skills_analysis = { identified: [] };
    }
    if (!Array.isArray(analysisData.skills_analysis.identified)) {
      analysisData.skills_analysis.identified = [];
    }

    const skills = analysisData.skills_analysis.identified;

    // Check duplicate
    const exists = skills.some(s => s.name.toLowerCase() === skill_name.trim().toLowerCase());
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'This skill already exists in your resume analysis'
      });
    }

    // Append new skill
    const newSkill = {
      name: skill_name.trim(),
      level: normalizedProficiency,
      source: 'user'
    };
    skills.push(newSkill);
    analysisData.skills_analysis.identified = skills;

    await db.execute(
      'UPDATE resume_analysis SET analysis_data = ? WHERE id = ?',
      [JSON.stringify(analysisData), analysisRow.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      skill: {
        name: skill_name.trim(),
        skill_name: skill_name.trim(),
        level: normalizedProficiency,
        source: 'user',
        years_of_experience
      }
    });
  } catch (error) {
    console.error('Add skill error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add skill',
      error: error.message
    });
  }
};

/**
 * DELETE /api/skills/:skillName
 * Remove a skill from the latest active resume's analysis_data
 */
exports.deleteSkill = async (req, res) => {
  try {
    const { skillName } = req.params;
    const userId = req.user.id;

    if (!skillName || skillName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    const analysisRow = await getLatestResumeAnalysis(userId);

    if (!analysisRow) {
      return res.status(404).json({
        success: false,
        message: 'No resume analysis found'
      });
    }

    const analysisData = parseJSONData(analysisRow.analysis_data) || {};
    const skills = analysisData.skills_analysis?.identified || [];

    const idx = skills.findIndex(s => s.name.toLowerCase() === skillName.trim().toLowerCase());

    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found in your resume analysis'
      });
    }

    skills.splice(idx, 1);
    analysisData.skills_analysis.identified = skills;

    await db.execute(
      'UPDATE resume_analysis SET analysis_data = ? WHERE id = ?',
      [JSON.stringify(analysisData), analysisRow.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete skill',
      error: error.message
    });
  }
};

/**
 * PUT /api/skills/:skillName
 * Update a skill in the latest active resume's analysis_data
 * Body: { proficiency_level?, new_skill_name? }
 */
exports.updateSkill = async (req, res) => {
  try {
    const { skillName } = req.params;
    const { proficiency_level, new_skill_name } = req.body;
    const userId = req.user.id;

    if (!skillName || skillName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    if (proficiency_level) {
      const validProficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validProficiencies.includes(proficiency_level.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid proficiency level. Must be one of: ${validProficiencies.join(', ')}`
        });
      }
    }

    const analysisRow = await getLatestResumeAnalysis(userId);

    if (!analysisRow) {
      return res.status(404).json({
        success: false,
        message: 'No resume analysis found'
      });
    }

    const analysisData = parseJSONData(analysisRow.analysis_data) || {};
    const skills = analysisData.skills_analysis?.identified || [];

    const idx = skills.findIndex(s => s.name.toLowerCase() === skillName.trim().toLowerCase());

    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found in your resume analysis'
      });
    }

    if (new_skill_name && new_skill_name.trim() !== skillName.trim()) {
      skills[idx].name = new_skill_name.trim();
    }
    if (proficiency_level) {
      skills[idx].level = proficiency_level.toLowerCase();
    }

    analysisData.skills_analysis.identified = skills;

    await db.execute(
      'UPDATE resume_analysis SET analysis_data = ? WHERE id = ?',
      [JSON.stringify(analysisData), analysisRow.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Skill updated successfully'
    });
  } catch (error) {
    console.error('Update skill error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update skill',
      error: error.message
    });
  }
};
