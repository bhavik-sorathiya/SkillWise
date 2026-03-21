/**
 * Interviewee Dashboard Controller
 * Handles dashboard data fetching and transformation
 * MVC Pattern - Controller Layer
 */

const UserProfile = require('../models/userProfileModel');

/**
 * Get dashboard data for interviewee
 * Fetches user and profile data from database and transforms it for frontend
 * Requires authentication - userId extracted from JWT token
 * @route GET /api/interviewee/dashboard
 * @auth Required - Bearer token in Authorization header
 */
const getDashboardData = async (req, res) => {
  try {
    // Get authenticated user ID from JWT token (via authMiddleware)
    const userId = req.user?.id;

    // Validation: userId should exist (set by authMiddleware)
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User information not found in token'
      });
    }

    // Fetch user and profile data from database
    const userData = await UserProfile.getUserById(userId);
    
    // Check if user exists
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profileData = await UserProfile.getProfileByUserId(userId);
    
    // Check if profile exists
    if (!profileData) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found. Please complete profile setup.'
      });
    }

    // Transform data to match frontend template
    const dashboardData = transformDashboardData(userData, profileData);

    // Return successful response
    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Transform database data to frontend dashboard template
 * Removes unnecessary fields and adds computed properties
 * No demo data - returns actual null values if data doesn't exist
 * @param {Object} user - User data from database
 * @param {Object} profile - Profile data from database
 * @returns {Object} Transformed dashboard data with no hardcoded demo values
 */
const transformDashboardData = (user, profile) => {
  // Transform user data
  const transformedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    joined_at: user.created_at
  };

  // Transform skills - remove last_updated field, return null if no skills
  const transformedSkills = profile.skills && Array.isArray(profile.skills)
    ? profile.skills.map(skill => ({
        name: skill.name || null,
        level: skill.level || null,
        source: skill.source || null
      }))
    : null;

  // Transform ATS data - remove evaluated_at field, return null if not available
  const transformedAts = profile.ats && typeof profile.ats === 'object'
    ? {
        score: profile.ats.score !== undefined ? profile.ats.score : null,
        explanation: profile.ats.explanation || null
      }
    : null;

  // Transform resumes data - add can_upload field, return null if not available
  const transformedResumes = profile.resumes && typeof profile.resumes === 'object'
    ? {
        uploaded_count: profile.resumes.uploaded_count || 0,
        max_allowed: profile.resumes.max_allowed || 3,
        can_upload: (profile.resumes.uploaded_count || 0) < (profile.resumes.max_allowed || 3)
      }
    : null;

  // Build transformed profile (exclude ai_metadata)
  const transformedProfile = {
    target_role: profile.target_role || null,
    experience: profile.experience || null,
    ats: transformedAts,
    skills: transformedSkills,
    resumes: transformedResumes
  };

  // Return complete dashboard data
  return {
    user: transformedUser,
    profile: transformedProfile
  };
};

// Static resume analysis data - will be replaced with database/AI pipeline later
const getResumeAnalysisData = async (req, res) => {
  try {
    const resumeAnalysisData = {
      resume_context: {
        target_role: "Frontend Developer",
        experience_level: "Fresher",
        experience_range_years: "0-1"
      },
      ats_analysis: {
        score: 72,
        verdict: "Good",
        explanation: "Resume aligns well with entry-level frontend roles"
      },
      skills_analysis: {
        identified: [
          {
            name: "JavaScript",
            level: "intermediate"
          },
          {
            name: "React",
            level: "beginner"
          }
        ],
        additional_user_skills: [
          {
            name: "CSS",
            level: "advanced"
          }
        ]
      },
      experience_analysis: {
        total_estimated_years: 0.5,
        role_based_experience: [
          {
            area: "Software Engineering",
            experience_years: 0.5,
            experience_score: 60
          },
          {
            area: "Design / UI",
            experience_years: 0.3,
            experience_score: 45
          },
          {
            area: "Leadership / Management",
            experience_years: 0,
            experience_score: 10
          }
        ],
        project_count: 3,
        internship_experience: false
      },
      education_analysis: {
        educations: [
          {
            degree: "B.Tech",
            field_of_study: "Information Technology",
            institution: "ABC Institute of Technology",
            institution_type: "University",
            start_year: 2023,
            end_year: 2027,
            status: "Pursuing"
          },
          {
            degree: "M.Tech",
            field_of_study: "Computer Science",
            institution: "XYZ University",
            institution_type: "University",
            start_year: 2027,
            end_year: 2029,
            status: "Planned"
          }
        ]
      },
      resume_sections: {
        summary: true,
        education: true,
        projects: true,
        experience: false,
        skills: true,
        certifications: false
      },
      swot_analysis: {
        strengths: [
          "Strong JavaScript fundamentals",
          "Good academic background"
        ],
        weaknesses: [
          "Limited professional experience",
          "Resume lacks quantified impact"
        ],
        opportunities: [
          "Can highlight academic projects better",
          "Add internship or freelance work"
        ],
        threats: [
          "High competition for entry-level roles",
          "ATS preference for experienced candidates"
        ]
      },
      resume_improvements: {
        high_priority: [
          {
            area: "Experience Section",
            suggestion: "Add internship, freelance, or real-world project experience",
            impact: "High"
          },
          {
            area: "Project Descriptions",
            suggestion: "Include metrics (performance, users, impact)",
            impact: "High"
          }
        ],
        medium_priority: [
          {
            area: "Skills Section",
            suggestion: "Reorder skills to match frontend job descriptions",
            impact: "Medium"
          }
        ],
        low_priority: [
          {
            area: "Formatting",
            suggestion: "Reduce paragraph length for better ATS readability",
            impact: "Low"
          }
        ]
      },
      recommendations: {
        career_growth: [
          "Learn TypeScript and modern React patterns",
          "Contribute to open-source frontend projects"
        ],
        learning_focus: [
          "Systematic frontend problem solving",
          "UI performance optimization"
        ]
      },
      analysis_metadata: {
        model: "gpt-x",
        prompt_version: "resume-analysis-v2.1",
        analyzed_at: "2026-01-25T10:00:00Z"
      }
    };

    res.status(200).json({
      success: true,
      data: resumeAnalysisData
    });
  } catch (error) {
    console.error('Error fetching resume analysis data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume analysis data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardData,
  getResumeAnalysisData
};
