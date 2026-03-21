// server/src/controllers/skillsController.js
const db = require('../config/db');

/**
 * Parse JSON data safely - handle both string and object formats
 * @param {any} data - JSON data from database
 * @returns {Object|null} Parsed data or null
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
 * Get all user skills from both profile and latest resume analysis
 * Merges skills from both sources
 * GET /api/skills
 */
exports.getSkills = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user profile
    const [profileRows] = await db.execute(
      'SELECT profile_data FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (profileRows.length === 0) {
      return res.status(200).json({
        success: true,
        skills: [],
        source: 'none'
      });
    }

    const profileData = parseJSONData(profileRows[0].profile_data);
    const profileSkills = profileData?.skills || [];

    return res.status(200).json({
      success: true,
      skills: profileSkills,
      source: 'profile',
      count: profileSkills.length
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
 * Add a new skill to user profile
 * Also updates the latest resume analysis if it exists
 * POST /api/skills/add
 * Body: { skill_name, proficiency_level, years_of_experience }
 */
exports.addSkill = async (req, res) => {
  try {
    const { skill_name, proficiency_level = 'intermediate', years_of_experience = 0 } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!skill_name || skill_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    // Validate proficiency level
    const validProficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];
    const normalizedProficiency = proficiency_level.toLowerCase();
    if (!validProficiencies.includes(normalizedProficiency)) {
      return res.status(400).json({
        success: false,
        message: `Invalid proficiency level. Must be one of: ${validProficiencies.join(', ')}`
      });
    }

    // ===== FETCH AND UPDATE USER PROFILE =====
    const [profileRows] = await db.execute(
      'SELECT user_id, profile_data FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const profileData = parseJSONData(profileRows[0].profile_data) || {};
    const profileSkills = Array.isArray(profileData.skills) ? profileData.skills : [];

    // Check if skill already exists in profile
    const skillExists = profileSkills.some(
      s => s.name.toLowerCase() === skill_name.trim().toLowerCase()
    );

    if (skillExists) {
      return res.status(409).json({
        success: false,
        message: 'This skill already exists in your profile'
      });
    }

    // Create new skill object with profile structure
    const newSkillProfile = {
      name: skill_name.trim(),
      level: normalizedProficiency,
      source: 'user'
    };

    // Add skill to profile skills array
    profileSkills.push(newSkillProfile);
    profileData.skills = profileSkills;

    // Update user profile table
    await db.execute(
      'UPDATE user_profiles SET profile_data = ? WHERE user_id = ?',
      [JSON.stringify(profileData), userId]
    );

    // ===== FETCH AND UPDATE LATEST RESUME ANALYSIS =====
    const [resumeRows] = await db.execute(
      `SELECT ra.id, ra.analysis_data, ur.id as resume_id
       FROM resume_analysis ra
       JOIN user_resumes ur ON ra.resume_id = ur.id
       WHERE ur.user_id = ?
       ORDER BY ur.uploaded_at DESC
       LIMIT 1`,
      [userId]
    );

    // If resume analysis exists, also add skill there
    if (resumeRows.length > 0) {
      const analysisData = parseJSONData(resumeRows[0].analysis_data) || {};
      
      // Ensure skills_analysis structure exists
      if (!analysisData.skills_analysis) {
        analysisData.skills_analysis = { identified: [] };
      }
      if (!Array.isArray(analysisData.skills_analysis.identified)) {
        analysisData.skills_analysis.identified = [];
      }

      const resumeSkills = analysisData.skills_analysis.identified;

      // Check if skill already exists in resume analysis
      const skillExistsInResume = resumeSkills.some(
        s => s.name.toLowerCase() === skill_name.trim().toLowerCase()
      );

      if (!skillExistsInResume) {
        // Create skill object with resume analysis structure
        const newSkillResume = {
          name: skill_name.trim(),
          level: normalizedProficiency
        };

        resumeSkills.push(newSkillResume);
        analysisData.skills_analysis.identified = resumeSkills;

        // Update resume analysis table
        await db.execute(
          'UPDATE resume_analysis SET analysis_data = ? WHERE id = ?',
          [JSON.stringify(analysisData), resumeRows[0].id]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      skill: {
        name: skill_name.trim(),
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
 * Delete a skill from user profile
 * Also removes from latest resume analysis if it exists
 * DELETE /api/skills/:skillName
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

    // ===== FETCH AND UPDATE USER PROFILE =====
    const [profileRows] = await db.execute(
      'SELECT profile_data FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const profileData = parseJSONData(profileRows[0].profile_data) || {};
    const profileSkills = Array.isArray(profileData.skills) ? profileData.skills : [];

    // Find and remove skill from profile
    const skillIndexProfile = profileSkills.findIndex(
      s => s.name.toLowerCase() === skillName.trim().toLowerCase()
    );

    if (skillIndexProfile === -1) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found in your profile'
      });
    }

    profileSkills.splice(skillIndexProfile, 1);
    profileData.skills = profileSkills;

    // Update user profile table
    await db.execute(
      'UPDATE user_profiles SET profile_data = ? WHERE user_id = ?',
      [JSON.stringify(profileData), userId]
    );

    // ===== FETCH AND UPDATE LATEST RESUME ANALYSIS =====
    const [resumeRows] = await db.execute(
      `SELECT ra.id, ra.analysis_data
       FROM resume_analysis ra
       JOIN user_resumes ur ON ra.resume_id = ur.id
       WHERE ur.user_id = ?
       ORDER BY ur.uploaded_at DESC
       LIMIT 1`,
      [userId]
    );

    if (resumeRows.length > 0) {
      const analysisData = parseJSONData(resumeRows[0].analysis_data) || {};

      if (analysisData.skills_analysis && Array.isArray(analysisData.skills_analysis.identified)) {
        const resumeSkills = analysisData.skills_analysis.identified;
        const skillIndexResume = resumeSkills.findIndex(
          s => s.name.toLowerCase() === skillName.trim().toLowerCase()
        );

        if (skillIndexResume !== -1) {
          resumeSkills.splice(skillIndexResume, 1);
          analysisData.skills_analysis.identified = resumeSkills;

          // Update resume analysis table
          await db.execute(
            'UPDATE resume_analysis SET analysis_data = ? WHERE id = ?',
            [JSON.stringify(analysisData), resumeRows[0].id]
          );
        }
      }
    }

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
 * Update a skill in user profile
 * Also updates in latest resume analysis if it exists
 * PUT /api/skills/:skillName
 * Body: { proficiency_level, years_of_experience, new_skill_name }
 */
exports.updateSkill = async (req, res) => {
  try {
    const { skillName } = req.params;
    const { proficiency_level, years_of_experience, new_skill_name } = req.body;
    const userId = req.user.id;

    if (!skillName || skillName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    // Validate proficiency level if provided
    if (proficiency_level) {
      const validProficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validProficiencies.includes(proficiency_level.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid proficiency level. Must be one of: ${validProficiencies.join(', ')}`
        });
      }
    }

    // ===== FETCH AND UPDATE USER PROFILE =====
    const [profileRows] = await db.execute(
      'SELECT profile_data FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const profileData = parseJSONData(profileRows[0].profile_data) || {};
    const profileSkills = Array.isArray(profileData.skills) ? profileData.skills : [];

    // Find skill in profile
    const skillIndexProfile = profileSkills.findIndex(
      s => s.name.toLowerCase() === skillName.trim().toLowerCase()
    );

    if (skillIndexProfile === -1) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found in your profile'
      });
    }

    // Update skill in profile
    if (new_skill_name && new_skill_name.trim() !== skillName.trim()) {
      profileSkills[skillIndexProfile].name = new_skill_name.trim();
    }
    if (proficiency_level) {
      profileSkills[skillIndexProfile].level = proficiency_level.toLowerCase();
    }

    profileData.skills = profileSkills;

    // Update user profile table
    await db.execute(
      'UPDATE user_profiles SET profile_data = ? WHERE user_id = ?',
      [JSON.stringify(profileData), userId]
    );

    // ===== FETCH AND UPDATE LATEST RESUME ANALYSIS =====
    const [resumeRows] = await db.execute(
      `SELECT ra.id, ra.analysis_data
       FROM resume_analysis ra
       JOIN user_resumes ur ON ra.resume_id = ur.id
       WHERE ur.user_id = ?
       ORDER BY ur.uploaded_at DESC
       LIMIT 1`,
      [userId]
    );

    if (resumeRows.length > 0) {
      const analysisData = parseJSONData(resumeRows[0].analysis_data) || {};

      if (analysisData.skills_analysis && Array.isArray(analysisData.skills_analysis.identified)) {
        const resumeSkills = analysisData.skills_analysis.identified;
        const skillIndexResume = resumeSkills.findIndex(
          s => s.name.toLowerCase() === skillName.trim().toLowerCase()
        );

        if (skillIndexResume !== -1) {
          if (new_skill_name && new_skill_name.trim() !== skillName.trim()) {
            resumeSkills[skillIndexResume].name = new_skill_name.trim();
          }
          if (proficiency_level) {
            resumeSkills[skillIndexResume].level = proficiency_level.toLowerCase();
          }

          analysisData.skills_analysis.identified = resumeSkills;

          // Update resume analysis table
          await db.execute(
            'UPDATE resume_analysis SET analysis_data = ? WHERE id = ?',
            [JSON.stringify(analysisData), resumeRows[0].id]
          );
        }
      }
    }

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

