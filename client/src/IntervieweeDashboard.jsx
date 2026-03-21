// client/src/IntervieweeDashboard.jsx
// Interviewee home dashboard with profile summary, skills, and resume upload status.

import React, { useState, useEffect } from 'react';
import MobileSidebarBackdrop from './components/MobileSidebarBackdrop';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AddSkillModal from './components/AddSkillModal';
import { useAuth } from './context/AuthContext';
import { useComingSoon } from './context/ComingSoonContext';
import { API_BASE_URL, skillsAPI } from './services/api';
import { DataSyncService } from './utils/cacheSync';
import './IntervieweeDashboard.css';

const IntervieweeDashboard = ({ onNavigateToLogin, onNavigateToLanding, onNavigateToHome, onNavigateToResume, onNavigateToMockInterview, onNavigateToInterviews, onLogout }) => {
  const { token, isAuthenticated, user, logout } = useAuth();
  const { openComingSoon } = useComingSoon();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [skills, setSkills] = useState([]);
  const [uploadedResumes, setUploadedResumes] = useState([]);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Check if user is authenticated
        if (!isAuthenticated || !token) {
          setError('Authentication required');
          onNavigateToLogin();
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/interviewee/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          // Unauthorized - token expired or invalid
          setError('Session expired. Please login again.');
          onNavigateToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setDashboardData(result.data);
          // Transform skills data for component use
          if (result.data.profile.skills) {
            setSkills(result.data.profile.skills.map((skill, index) => ({
              id: index + 1,
              name: skill.name,
              level: skill.level,
              source: skill.source,
            })));
          }
        } else {
          throw new Error(result.message || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, isAuthenticated, onNavigateToLogin]);

  // Calculate resume stats from API data
  const MAX_RESUMES = dashboardData?.profile?.resumes?.max_allowed || 3;
  const resumeCount = dashboardData?.profile?.resumes?.uploaded_count || 0;
  const canUpload = dashboardData?.profile?.resumes?.can_upload ?? true;
  const resumePercentage = (resumeCount / MAX_RESUMES) * 100;

  const handleResumeUpload = async (event) => {
    if (!canUpload) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type on client
      const allowedMimes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedMimes.includes(file.type)) {
        alert(`Invalid file type. Only DOCX (Word) files are allowed.`);
        return;
      }

      // Validate file size on client (3MB max)
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 3MB limit.`);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.status === 401) {
        onNavigateToLogin();
        return;
      }

      if (!response.ok) {
        alert(result.message || 'Upload failed');
        return;
      }

      if (result.success) {
        // Reload dashboard data to get updated resume count
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert(`Upload failed: ${error.message}`);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleDeleteResume = (id) => {
    setUploadedResumes(uploadedResumes.filter(resume => resume.id !== id));
  };

  const handleAddSkill = async (newSkill) => {
    // Add new skill to local state
    setSkills([...skills, newSkill]);
    // Invalidate cache so next fetch gets updated data
    DataSyncService.invalidateCache('user_skills');
  };

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      if (token) {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.warn('Backend logout failed:', response.status);
        }
      }
    } catch (error) {
      console.error('Backend logout error:', error);
    } finally {
      // Clear auth context and local storage
      logout();
      // Navigate to landing page
      onLogout?.();
    }
  };

  const handleDeleteSkill = async (skillName) => {
    try {
      await skillsAPI.deleteSkill(skillName);
      setSkills(skills.filter(skill => (skill.skill_name || skill.name) !== skillName));
    } catch (error) {
      console.error('Error deleting skill:', error);
      openComingSoon({ title: 'Error', message: `Failed to delete skill: ${error.message}` });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-text-main dark:text-white font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const userProfile = {
    name: dashboardData.user.name,
    targetRole: dashboardData.profile.target_role,
    experience: dashboardData.profile.experience,
    atsScore: dashboardData.profile.ats.score,
    atsExplanation: dashboardData.profile.ats.explanation,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmQ6dM8c8L0mc96FrXf3QWAEU8NS2oI82kLLKHkLeRpEJxHZUluhI6wVR5CnYwLYr6Cs6RNFna4Q6v6F05Mu6twWRvEdFBP6XyaUxpammSts4smMnQfoX5Ue33AD_1NkHd9nwPUPhETrwsGHMrD1B5QXEjIvkc8CseGIe59wLGDnnsc_YA3Pp3AUhvcK0Veg_HK8DOP8SjsaX2jlvrkuINK7KMadcKk4_xgdSh9pw4yl_cfTOxUL0lzkaedEqBKn67W-IT4YCdEpo',
    headerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnvE6dtuVKhnW1CG7Ru8xLYWNZdR9yGwUzMbh1BuPP2rELZxbRZ5yS7AhQvk9zJeviK0mBKRSz8Rc8k8KDAT7u2AfT0060uk2OxG7XGB4uqdTIqd1lzCRRUzd2sgOQGVdXvhIUyFFBF0q_R3ESFNnd2WWgRCKQIWNsBHx69PgFWtSQ9G0C7R6HxM_6Ubjys3nsZpIq4xKgBFxoLicLN7JMLvbua5o_wOw-juJa4vCX__Zxk3qVxTKFBXnCEap7BR8WmUCWQaZyB0w',
  };

  const sidebarItems = [
    { key: 'home', icon: 'home', label: 'Home', isActive: true },
    { key: 'resume', icon: 'description', label: 'Resume' },
    { key: 'mock-interview', icon: 'smart_toy', label: 'Mock Interview' },
    { key: 'interviews', icon: 'videocam', label: 'Interviews' },
  ];

  const handleSidebarNavigate = (key) => {
    switch (key) {
      case 'home':
        onNavigateToHome?.();
        break;
      case 'resume':
        onNavigateToResume?.();
        break;
      case 'mock-interview':
        onNavigateToMockInterview?.();
        break;
      case 'interviews':
        onNavigateToInterviews?.();
        break;
      default:
        break;
    }
  };

  const handleComingSoon = (event, title, message) => {
    event.preventDefault();
    openComingSoon({ title, message });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white transition-colors duration-300 flex overflow-hidden">
      <MobileSidebarBackdrop
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <Sidebar items={sidebarItems} isOpen={isSidebarOpen} onNavigate={handleSidebarNavigate} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <TopBar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isProfileMenuOpen={isProfileMenuOpen}
          onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          onNavigateToLogin={onNavigateToLogin}
          onNavigateToLanding={onNavigateToLanding}
          onNavigateToHome={onNavigateToHome}
          onLogout={handleLogout}
          userProfile={userProfile}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-6 pb-20 scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <section className="bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                <div
                  className="size-20 md:size-24 rounded-2xl bg-cover bg-center ring-4 ring-primary/20 shrink-0"
                  style={{ backgroundImage: `url('${userProfile.avatar}')` }}
                />
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white mb-1">{userProfile.name}</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{userProfile.targetRole}</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">trending_up</span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{userProfile.experience.level} • {userProfile.experience.range_years} years</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border-light dark:border-border-dark relative z-10">
                <div className="flex flex-col items-center">
                  <div className="relative size-28 mb-4">
                    <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-primary"
                        strokeDasharray={`${(userProfile.atsScore / 100) * 339.29} 339.29`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-text-main dark:text-white">{userProfile.atsScore}</span>
                      <span className="text-xs text-gray-500">ATS Score</span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex flex-col justify-center">
                  <h3 className="font-semibold text-text-main dark:text-white mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    {userProfile.atsExplanation}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your resume is well-optimized for entry-level positions. Consider adding more technical keywords and quantifiable achievements to improve scores.</p>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm md:text-base font-semibold text-text-main dark:text-white">Skills</h4>
              </div>
              <div className="flex gap-2 md:gap-3 overflow-x-auto hide-scrollbar pb-2 px-1">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="group relative flex items-center gap-2 px-4 py-2 rounded-full shrink-0 font-medium text-sm transition-all duration-500 whitespace-nowrap bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark border border-border-light dark:border-border-dark text-text-main dark:text-white hover:border-primary hover:from-primary/10 hover:to-primary/5 hover:shadow-[0_4px_20px_-4px_rgba(242,127,13,0.4)] hover:text-primary"
                  >
                    <span>{skill.skill_name || skill.name}</span>
                    <button
                      onClick={() => handleDeleteSkill(skill.skill_name || skill.name)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-950 rounded text-gray-400 hover:text-red-500"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setIsAddSkillModalOpen(true)}
                  className="size-9 md:size-10 rounded-full bg-surface-light dark:bg-surface-dark border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 shrink-0 flex items-center justify-center cursor-pointer hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-500"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </section>

            <AddSkillModal
              isOpen={isAddSkillModalOpen}
              onClose={() => setIsAddSkillModalOpen(false)}
              onSkillAdded={handleAddSkill}
            />

            <section className="bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark rounded-2xl shadow-soft border border-border-light dark:border-border-dark p-6 md:p-8 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
                <div className="lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-2xl">description</span>
                      </div>
                      <div>
                        <h4 className="text-lg md:text-xl font-bold text-text-main dark:text-white">Resume Management</h4>
                        <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">Manage your professional resume</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-6">
                    <div className="bg-background-light dark:bg-background-dark rounded-xl p-4 border border-border-light dark:border-border-dark hover:shadow-soft transition-all hover:-translate-y-1 duration-300">
                      <div className="text-2xl font-bold text-primary mb-1">{resumeCount}</div>
                      <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">Resumes Uploaded</p>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark rounded-xl p-4 border border-border-light dark:border-border-dark hover:shadow-soft transition-all hover:-translate-y-1 duration-300">
                      <div className="text-2xl font-bold text-primary mb-1">{MAX_RESUMES - resumeCount}</div>
                      <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">Slots Available</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Upload Progress</span>
                      <span className="text-sm font-bold text-primary">{Math.round(resumePercentage)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-orange-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${resumePercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <label className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform ${
                    canUpload
                      ? 'bg-gradient-to-r from-primary to-orange-600 hover:from-primary-hover hover:to-orange-700 text-white shadow-lg hover:shadow-primary/30 hover:-translate-y-1 cursor-pointer active:translate-y-0'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                  }`}>
                    <span className="material-symbols-outlined">{canUpload ? 'upload_file' : 'block'}</span>
                    <span>{canUpload ? 'Upload New Resume' : 'Limit Reached'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={!canUpload}
                      className="hidden"
                    />
                  </label>

                  {!canUpload && (
                    <div className="mt-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 flex items-start gap-3 animate-pulse">
                      <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-xl shrink-0 mt-0.5">info</span>
                      <div>
                        <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Maximum resumes reached</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Delete an existing resume to upload a new one.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1 flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 mb-6">
                    <div className={`absolute inset-0 rounded-full transition-all duration-500 ${canUpload ? 'bg-primary/20 blur-2xl' : 'bg-orange-500/20 blur-2xl'}`}></div>

                    <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={`${(resumePercentage / 100) * 282.7} 282.7`}
                        strokeLinecap="round"
                        className={`transition-all duration-500 ${canUpload ? 'text-primary' : 'text-orange-500'}`}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold text-text-main dark:text-white">{resumeCount}</p>
                      <p className="text-xs text-text-secondary dark:text-gray-400 font-semibold mt-1">of {MAX_RESUMES}</p>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-gray-400 group/item hover:text-primary transition-colors">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover/item:bg-primary/30 transition-colors">
                        <span className="material-symbols-outlined text-[10px] text-primary">check</span>
                      </div>
                      <span>PDF, DOC, DOCX</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-gray-400 group/item hover:text-primary transition-colors">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover/item:bg-primary/30 transition-colors">
                        <span className="material-symbols-outlined text-[10px] text-primary">lock</span>
                      </div>
                      <span>Secure & Private</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-gray-400 group/item hover:text-primary transition-colors">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover/item:bg-primary/30 transition-colors">
                        <span className="material-symbols-outlined text-[10px] text-primary">cloud_upload</span>
                      </div>
                      <span>Auto Stored</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border-light dark:border-border-dark flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>© 2026 SkillWise Inc.</p>
            <div className="flex gap-6">
              <a
                className="hover:text-primary transition-colors"
                href="#"
                onClick={(e) => handleComingSoon(e, 'About', 'About page is coming soon.')}
              >
                About
              </a>
              <a
                className="hover:text-primary transition-colors"
                href="#"
                onClick={(e) => handleComingSoon(e, 'Help Center', 'Help Center is coming soon.')}
              >
                Help Center
              </a>
              <a
                className="hover:text-primary transition-colors"
                href="#"
                onClick={(e) => handleComingSoon(e, 'Privacy', 'Privacy details are coming soon.')}
              >
                Privacy
              </a>
              <a
                className="hover:text-primary transition-colors"
                href="#"
                onClick={(e) => handleComingSoon(e, 'Terms', 'Terms are coming soon.')}
              >
                Terms
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default IntervieweeDashboard;