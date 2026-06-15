// client/src/IntervieweeDashboard.jsx
// Summary dashboard — profile card, resume stats, interview stats, skills from resume analysis.

import React, { useState, useEffect } from 'react';
import MobileSidebarBackdrop from './components/MobileSidebarBackdrop';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { useAuth } from './context/AuthContext';
import { useComingSoon } from './context/ComingSoonContext';
import { API_BASE_URL } from './services/api';
import { getUserAvatar } from './utils/avatar';
import Footer from './components/Footer';

const PROFICIENCY_STYLE = {
  expert:       'bg-primary/15 text-primary border-primary/30',
  advanced:     'bg-blue-500/10 text-blue-500 border-blue-500/30',
  intermediate: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
  beginner:     'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600',
};

const IntervieweeDashboard = ({
  onNavigateToLogin, onNavigateToLanding, onNavigateToHome,
  onNavigateToResume, onNavigateToMockInterview, onNavigateToInterviews,
  onNavigateToProfile, onNavigateToSettings, onLogout,
  onNavigateToDeveloper, onNavigateToHelp, onNavigateToTerms, onNavigateToPricing
}) => {
  const { token, isAuthenticated, logout, user } = useAuth();
  const { openComingSoon } = useComingSoon();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLimitBanner, setShowLimitBanner] = useState(() => {
    return sessionStorage.getItem('dismissedLimitBanner') !== 'true';
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (!isAuthenticated || !token) { onNavigateToLogin(); return; }

        const response = await fetch(`${API_BASE_URL}/interviewee/dashboard`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) { onNavigateToLogin(); return; }
        if (!response.ok) throw new Error('Failed to fetch dashboard data');

        const result = await response.json();
        if (result.success) setDashboardData(result.data);
        else throw new Error(result.message || 'Failed to load data');
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, isAuthenticated, onNavigateToLogin]);

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }
    } catch (e) { console.error('Backend logout error:', e); }
    finally { logout(); onLogout?.(); }
  };

  const handleComingSoon = (event, title, message) => {
    event.preventDefault();
    openComingSoon({ title, message });
  };

  const sidebarItems = [
    { key: 'home', icon: 'home', label: 'Home', isActive: true },
    { key: 'resume', icon: 'description', label: 'Resume' },
    { key: 'mock-interview', icon: 'smart_toy', label: 'Mock Interview' },
    { key: 'interviews', icon: 'videocam', label: 'Interviews' },
  ];

  const handleSidebarNavigate = (key) => {
    const map = {
      home: onNavigateToHome, resume: onNavigateToResume,
      'mock-interview': onNavigateToMockInterview, interviews: onNavigateToInterviews,
      profile: onNavigateToProfile, settings: onNavigateToSettings,
    };
    map[key]?.();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4" />
          <p className="text-text-main dark:text-white font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  const userData     = dashboardData?.user         || {};
  const profile      = dashboardData?.profile      || {};
  const resumeStats  = dashboardData?.resume_stats || {};
  const interviewStats = dashboardData?.interview_stats || {};
  const skills       = dashboardData?.skills       || [];

  const displayName = userData.full_name || user?.full_name || user?.name || 'User';
  const headerAvatar = getUserAvatar(profile.gender || user?.gender);
  const heroAvatar   = getUserAvatar(profile.gender || user?.gender);

  const MAX_RESUMES     = resumeStats.max_allowed || 3;
  const activeResumeCount = resumeStats.active_count || 0;
  const resumePercentage  = Math.round((activeResumeCount / MAX_RESUMES) * 100);

  const preferredRoles = Array.isArray(profile.preferred_roles) ? profile.preferred_roles : [];

  // Small ring SVG helper
  const ScoreRing = ({ score, size = 100, strokeWidth = 7, label = 'Score' }) => {
    const r = (size / 2) - strokeWidth;
    const circ = 2 * Math.PI * r;
    const pct = score != null ? Math.min(Math.max(Number(score), 0), 100) : 0;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100 dark:text-gray-800" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
            className="text-primary" strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-text-main dark:text-white">{score ?? '—'}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        </div>
      </div>
    );
  };

  const userProfile = { name: displayName, headerAvatar };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white transition-colors duration-300 flex overflow-hidden">
      <MobileSidebarBackdrop isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Sidebar
        items={sidebarItems}
        isOpen={isSidebarOpen}
        onNavigate={handleSidebarNavigate}
        onNavigateToSettings={onNavigateToSettings}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isProfileMenuOpen={isProfileMenuOpen}
          onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          onNavigateToLogin={onNavigateToLogin}
          onNavigateToLanding={onNavigateToLanding}
          onNavigateToHome={onNavigateToHome}
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToSettings={onNavigateToSettings}
          onLogout={handleLogout}
          onNavigateToHelp={onNavigateToHelp}
          userProfile={userProfile}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-6 pb-20">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">

            {/* ── Premium/Limit Info Banner ──────────────────────────────────── */}
            {showLimitBanner && dashboardData?.has_api_key === false && (
              <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px]">info</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                      SkillWise Free Daily Limits
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-gray-400 mt-1 max-w-3xl leading-relaxed">
                      SkillWise provides <strong>1 free resume analysis</strong> and <strong>1 free mock interview</strong> per day. Want unlimited access? You can easily add your own <strong>free Gemini API Key</strong> to unlock unlimited usage securely.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => onNavigateToSettings?.()}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
                  >
                    Add API Key
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('dismissedLimitBanner', 'true');
                      setShowLimitBanner(false);
                    }}
                    className="p-2 border border-border-light dark:border-border-dark text-text-secondary dark:text-gray-400 hover:text-red-500 rounded-lg transition-colors hover:bg-red-500/5 hover:border-red-500/20 flex items-center justify-center"
                    aria-label="Dismiss banner"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Profile Hero Card ─────────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                <div className="size-20 md:size-24 rounded-2xl bg-cover bg-center ring-4 ring-primary/20 shrink-0"
                  style={{ backgroundImage: `url('${heroAvatar}')` }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h2 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white mb-1">{displayName}</h2>
                    <button
                      onClick={() => onNavigateToProfile?.()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark hover:border-primary/30 transition-all duration-200 text-text-secondary dark:text-gray-400 hover:text-primary shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit Profile
                    </button>
                  </div>

                  {preferredRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {preferredRoles.map(role => (
                        <span key={role} className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {profile.experience_level && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">trending_up</span>
                        <span>{profile.experience_level}{profile.years_of_experience ? ` • ${profile.years_of_experience} yrs` : ''}</span>
                      </div>
                    )}
                    {profile.education && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">school</span>
                        <span>{profile.education}</span>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">person</span>
                        <span className="capitalize">{profile.gender.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio section */}
                  {profile.bio ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-2 border-l-2 border-primary/30 pl-3">
                      {profile.bio}
                    </p>
                  ) : (
                    <button
                      onClick={() => onNavigateToProfile?.()}
                      className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors group/bio"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span className="group-hover/bio:underline">Add bio</span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ── Stats Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Resume Stats */}
              <section className="bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark rounded-2xl shadow-soft border border-border-light dark:border-border-dark p-6 relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-main dark:text-white">Resume Overview</h4>
                    <p className="text-xs text-text-secondary dark:text-gray-400">Your uploaded resumes</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { val: activeResumeCount, label: 'Uploaded', color: 'text-primary' },
                    { val: resumeStats.highest_ats ?? '—', label: 'Best ATS', color: 'text-green-500' },
                    { val: resumeStats.average_ats ?? '—', label: 'Avg ATS', color: 'text-blue-500' },
                  ].map(({ val, label, color }) => (
                    <div key={label} className="bg-background-light dark:bg-background-dark rounded-xl p-3 border border-border-light dark:border-border-dark text-center">
                      <div className={`text-2xl font-bold ${color}`}>{val}</div>
                      <p className="text-xs text-text-secondary dark:text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text-secondary dark:text-gray-400">{activeResumeCount} of {MAX_RESUMES} slots used</span>
                    <span className="text-xs font-bold text-primary">{resumePercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-orange-600 rounded-full transition-all duration-500" style={{ width: `${resumePercentage}%` }} />
                  </div>
                </div>
                {resumeStats.latest_resume && (
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-2 mb-4 truncate">
                    Latest: <span className="font-medium text-text-main dark:text-white">{resumeStats.latest_resume.title}</span>
                  </p>
                )}
                <button onClick={() => onNavigateToResume?.()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-primary/30">
                  <span className="material-symbols-outlined text-base">description</span>
                  Manage Resumes
                </button>
              </section>

              {/* Interview Stats */}
              <section className="bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark rounded-2xl shadow-soft border border-border-light dark:border-border-dark p-6 relative overflow-hidden group">
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-2xl">smart_toy</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-main dark:text-white">Interview Performance</h4>
                    <p className="text-xs text-text-secondary dark:text-gray-400">Your text-based mock interview stats</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <ScoreRing score={interviewStats.average_score} size={100} strokeWidth={7} label="Avg Score" />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="bg-background-light dark:bg-background-dark rounded-xl p-3 border border-border-light dark:border-border-dark text-center">
                      <div className="text-2xl font-bold text-primary">{interviewStats.total_interviews || 0}</div>
                      <p className="text-xs text-text-secondary dark:text-gray-400">Total</p>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark rounded-xl p-3 border border-border-light dark:border-border-dark text-center">
                      <div className="text-2xl font-bold text-green-500">{interviewStats.best_score ?? '—'}</div>
                      <p className="text-xs text-text-secondary dark:text-gray-400">Best</p>
                    </div>
                  </div>
                </div>
                {interviewStats.latest_interview && (
                  <div className="mb-4 p-3 bg-background-light dark:bg-background-dark rounded-xl border border-border-light dark:border-border-dark">
                    <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">Latest interview</p>
                    <p className="text-sm font-semibold text-text-main dark:text-white truncate">{interviewStats.latest_interview.role}</p>
                    {interviewStats.latest_interview.resume_title && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Resume: {interviewStats.latest_interview.resume_title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-primary">Score: {interviewStats.latest_interview.score ?? '—'}</span>
                      {interviewStats.latest_interview.verdict && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full capitalize">
                          {interviewStats.latest_interview.verdict}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {/* ← orange to match Manage Resumes */}
                  <button onClick={() => onNavigateToMockInterview?.()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-primary/30">
                    <span className="material-symbols-outlined text-base">smart_toy</span>
                    Start Text Interview
                  </button>
                  <button onClick={() => onNavigateToInterviews?.()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark text-text-main dark:text-white rounded-xl text-sm font-semibold transition-all duration-300">
                    <span className="material-symbols-outlined text-base">history</span>
                    History
                  </button>
                </div>
              </section>
            </div>

            {/* ── Skills Section ────────────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark rounded-2xl border border-border-light dark:border-border-dark p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-xl">psychology</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-main dark:text-white">Skills</h4>
                    <p className="text-xs text-text-secondary dark:text-gray-400">Extracted from your resumes</p>
                  </div>
                </div>
                {skills.length > 0 && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {skills.length} skill{skills.length !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>

              {skills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">psychology_alt</span>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No skills detected yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">Upload a resume to automatically extract your skills</p>
                  <button onClick={() => onNavigateToResume?.()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all">
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Upload Resume
                  </button>
                </div>
              ) : (
                <>
                  {/* Proficiency legend */}
                  <div className="flex flex-wrap gap-3 mb-4 text-xs">
                    {[
                      { level: 'expert',       label: 'Expert',       style: 'bg-primary/15 text-primary' },
                      { level: 'advanced',     label: 'Advanced',     style: 'bg-blue-500/10 text-blue-500' },
                      { level: 'intermediate', label: 'Intermediate', style: 'bg-green-500/10 text-green-600 dark:text-green-400' },
                      { level: 'beginner',     label: 'Beginner',     style: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
                    ].map(({ level, label, style }) => {
                      const count = skills.filter(s => s.proficiency_level === level).length;
                      if (count === 0) return null;
                      return (
                        <span key={level} className={`px-2.5 py-1 rounded-full font-semibold ${style}`}>
                          {label} ({count})
                        </span>
                      );
                    })}
                  </div>

                  {/* Skill chips */}
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => {
                      const style = PROFICIENCY_STYLE[skill.proficiency_level] || PROFICIENCY_STYLE.intermediate;
                      return (
                        <div
                          key={skill.name}
                          title={`${skill.proficiency_level} • from "${skill.source_resume_title}"`}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-default ${style}`}
                        >
                          <span className="material-symbols-outlined text-xs" style={{ fontSize: '12px' }}>
                            {skill.proficiency_level === 'expert' ? 'star' :
                             skill.proficiency_level === 'advanced' ? 'bolt' :
                             skill.proficiency_level === 'intermediate' ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          {skill.name}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

          </div>

          <Footer
            onAbout={onNavigateToDeveloper}
            onHelp={onNavigateToHelp}
            onTerms={onNavigateToTerms}
            onPrivacy={onNavigateToTerms}
            onPricing={onNavigateToPricing}
          />
        </main>
      </div>
    </div>
  );
};

export default IntervieweeDashboard;