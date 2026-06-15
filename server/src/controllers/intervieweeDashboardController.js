// server/src/controllers/intervieweeDashboardController.js
// Dashboard API: aggregates user, profile, resume, skills, and interview data into one response.
// Fully rewritten for skillwise_dev schema — no profile_data JSON blob.

const db = require('../config/db');
const { AppError } = require('../utils/errorHandler');

// Proficiency rank for deduplication — higher number = more skilled
const PROFICIENCY_RANK = { expert: 4, advanced: 3, intermediate: 2, beginner: 1 };

/**
 * GET /api/interviewee/dashboard
 * Returns aggregated dashboard metrics:
 *   - user     { id, full_name, email, joined_at }
 *   - profile  { gender, preferred_roles, experience_level, years_of_experience, education, bio, profile_completed }
 *   - resume_stats { active_count, max_allowed, can_upload, average_ats, highest_ats, latest_resume }
 *   - interview_stats { total_interviews, average_score, best_score, latest_interview }
 *   - skills   [{ name, proficiency_level, source_resume_title }] — deduplicated, sorted
 */
const getDashboardData = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Unauthorized: User information not found in token', 401);
  }

  // ── 1. User basic info ──────────────────────────────────────────────────────
  const [userRows] = await db.execute(
    'SELECT id, full_name, email, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (!userRows[0]) {
    throw new AppError('User not found', 404);
  }

  const user = userRows[0];

  // ── 2. Profile individual columns ──────────────────────────────────────────
  const [profileRows] = await db.execute(
    `SELECT gender, preferred_roles, experience_level, years_of_experience,
            education, bio, profile_completed
     FROM user_profiles WHERE user_id = ?`,
    [userId]
  );

  const profileRow = profileRows[0] || null;
  const profile = profileRow
    ? {
        gender: profileRow.gender || null,
        preferred_roles: (() => {
          try {
            return typeof profileRow.preferred_roles === 'string'
              ? JSON.parse(profileRow.preferred_roles)
              : profileRow.preferred_roles || [];
          } catch {
            return [];
          }
        })(),
        experience_level: profileRow.experience_level || null,
        years_of_experience: profileRow.years_of_experience || 0,
        education: profileRow.education || null,
        bio: profileRow.bio || null,
        profile_completed: !!profileRow.profile_completed
      }
    : {
        gender: null,
        preferred_roles: [],
        experience_level: null,
        years_of_experience: 0,
        education: null,
        bio: null,
        profile_completed: false
      };

  // ── 3. Resumes + ATS scores + skills (active only) ─────────────────────────
  const [resumeRows] = await db.execute(
    `SELECT ur.id, ur.title, ur.target_role, ur.uploaded_at,
            ra.analysis_data
     FROM user_resumes ur
     LEFT JOIN resume_analysis ra ON ur.id = ra.resume_id
     WHERE ur.user_id = ? AND ur.status = 'active'
     ORDER BY ur.uploaded_at DESC`,
    [userId]
  );

  const MAX_RESUMES = 3;
  const activeCount = resumeRows.length;

  // ATS scores from analysis_data
  const atsScores = resumeRows
    .map(r => {
      try {
        const data = typeof r.analysis_data === 'string'
          ? JSON.parse(r.analysis_data) : r.analysis_data;
        return data?.ats_analysis?.score ?? null;
      } catch { return null; }
    })
    .filter(s => s !== null && !isNaN(s));

  const averageAts = atsScores.length > 0
    ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length) : null;
  const highestAts = atsScores.length > 0 ? Math.max(...atsScores) : null;

  const latestResume = resumeRows[0]
    ? { id: resumeRows[0].id, title: resumeRows[0].title,
        target_role: resumeRows[0].target_role, uploaded_at: resumeRows[0].uploaded_at }
    : null;

  // ── 3b. Aggregate & deduplicate skills across all active resumes ───────────
  // Strategy: keep one entry per skill name (case-insensitive), highest proficiency wins
  const skillMap = new Map();

  for (const row of resumeRows) {
    try {
      const data = typeof row.analysis_data === 'string'
        ? JSON.parse(row.analysis_data) : row.analysis_data;

      const identified = data?.skills_analysis?.identified || [];

      for (const skill of identified) {
        const name = (skill.name || skill.skill_name || '').trim();
        if (!name) continue;

        const key = name.toLowerCase();
        const proficiency = (skill.proficiency_level || skill.proficiency || 'intermediate').toLowerCase();
        const existing = skillMap.get(key);

        if (!existing) {
          skillMap.set(key, { name, proficiency_level: proficiency, source_resume_title: row.title });
        } else {
          // Upgrade to higher proficiency if found in another resume
          const existingRank = PROFICIENCY_RANK[existing.proficiency_level] || 2;
          const newRank = PROFICIENCY_RANK[proficiency] || 2;
          if (newRank > existingRank) {
            skillMap.set(key, { name, proficiency_level: proficiency, source_resume_title: row.title });
          }
        }
      }
    } catch {
      // skip resumes with malformed analysis_data
    }
  }

  // Sort: expert → advanced → intermediate → beginner, then A–Z
  const skills = Array.from(skillMap.values()).sort((a, b) => {
    const rankDiff = (PROFICIENCY_RANK[b.proficiency_level] || 2) - (PROFICIENCY_RANK[a.proficiency_level] || 2);
    return rankDiff !== 0 ? rankDiff : a.name.localeCompare(b.name);
  });

  // ── 4. Interview stats ─────────────────────────────────────────────────────
  const [interviewRows] = await db.execute(
    `SELECT
       COUNT(DISTINCT s.id) AS total_interviews,
       ROUND(AVG(ir.overall_score), 1) AS average_score,
       MAX(ir.overall_score) AS best_score
     FROM interview_sessions s
     LEFT JOIN interview_results ir ON s.id = ir.session_id
     WHERE s.user_id = ? AND s.status = 'completed'`,
    [userId]
  );
  const interviewStats = interviewRows[0] || {};

  const [latestInterviewRows] = await db.execute(
    `SELECT s.id AS session_id, s.role, s.started_at AS created_at,
            ur.title AS resume_title,
            ir.overall_score AS score, ir.verdict
     FROM interview_sessions s
     LEFT JOIN user_resumes ur ON s.resume_id = ur.id
     LEFT JOIN interview_results ir ON s.id = ir.session_id
     WHERE s.user_id = ? AND s.status = 'completed'
     ORDER BY s.started_at DESC
     LIMIT 1`,
    [userId]
  );
  const latestInterview = latestInterviewRows[0] || null;

  // ── 4b. API Key status check ───────────────────────────────────────────────
  const [apiKeyRows] = await db.execute(
    'SELECT 1 FROM user_gemini_api_keys WHERE user_id = ? AND is_valid = true',
    [userId]
  );
  const hasApiKey = apiKeyRows.length > 0;

  // ── 5. Response ─────────────────────────────────────────────────────────────
  res.status(200).json({
    success: true,
    data: {
      has_api_key: hasApiKey,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        joined_at: user.created_at
      },
      profile,
      resume_stats: {
        active_count: activeCount,
        max_allowed: MAX_RESUMES,
        can_upload: activeCount < MAX_RESUMES,
        average_ats: averageAts,
        highest_ats: highestAts,
        latest_resume: latestResume
      },
      interview_stats: {
        total_interviews: interviewStats.total_interviews || 0,
        average_score: interviewStats.average_score || null,
        best_score: interviewStats.best_score || null,
        latest_interview: latestInterview
          ? {
              session_id: latestInterview.session_id,
              role: latestInterview.role,
              resume_title: latestInterview.resume_title,
              score: latestInterview.score,
              verdict: latestInterview.verdict,
              date: latestInterview.created_at
            }
          : null
      },
      skills   // [{ name, proficiency_level, source_resume_title }]
    }
  });
};

module.exports = { getDashboardData };
