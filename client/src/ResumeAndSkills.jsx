// client/src/ResumeAndSkills.jsx
// Dedicated resume analysis workspace with upload, results, and skill actions.

import React, { useState, useEffect } from 'react';
import MobileSidebarBackdrop from './components/MobileSidebarBackdrop';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ResumeUploadSection from './components/ResumeUploadSection';
import SkillsSection from './components/SkillsSection';
import AnalysisCards from './components/AnalysisCards';
import SWOTAnalysis from './components/SWOTAnalysis';
import ResumeImprovements from './components/ResumeImprovements';
import AddSkillModal from './components/AddSkillModal';
import TargetRoleModal from './components/TargetRoleModal';
import { useAuth } from './context/AuthContext';
import { useComingSoon } from './context/ComingSoonContext';
import { resumeAPI, skillsAPI, logout as logoutAPI } from './services/api';
import { DataSyncService } from './utils/cacheSync';
import './ResumeAndSkills.css';

// Primary interviewee workspace for resume upload, AI analysis, and skill updates.
const ResumeAndSkills = ({ onNavigateToLogin, onNavigateToLanding, onNavigateToHome, onNavigateToResume, onNavigateToMockInterview, onNavigateToInterviews, onLogout }) => {
  const { token, isAuthenticated, logout, user } = useAuth();
  const { openComingSoon } = useComingSoon();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isTargetRoleModalOpen, setIsTargetRoleModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  
  const [resumesList, setResumesList] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  const [analysisCache, setAnalysisCache] = useState({});
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  const [skills, setSkills] = useState([]);

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Initial load: fetch user's uploaded resumes and auto-select the latest/first.
  useEffect(() => {
    const fetchResumesList = async () => {
      try {
        setLoadingResumes(true);

        // Check if user is authenticated
        if (!isAuthenticated || !token) {
          setError('Authentication required');
          onNavigateToLogin();
          return;
        }

        const result = await resumeAPI.getResumesList();
        
        if (result.success && result.data.resumes.length > 0) {
          setResumesList(result.data.resumes);
          // Select first resume by default
          setSelectedResumeId(result.data.resumes[0].id);
        } else {
          throw new Error('No resumes found');
        }
      } catch (err) {
        console.error('Error fetching resumes list:', err);
        // Handle session expired errors
        if (err.message.includes('Session expired')) {
          onNavigateToLogin();
        }
        setError(err.message);
      } finally {
        setLoadingResumes(false);
      }
    };

    if (isAuthenticated && token) {
      fetchResumesList();
    }
  }, [token, isAuthenticated, onNavigateToLogin]);

  // Selection-driven fetch: load analysis for active resume (cache first if available).
  useEffect(() => {
    if (!selectedResumeId) return;

    const fetchAnalysis = async () => {
      try {
        setLoadingAnalysis(true);

        // Check if analysis is already cached
        if (analysisCache[selectedResumeId]) {
          setCurrentAnalysis(analysisCache[selectedResumeId]);
          updateSkillsFromAnalysis(analysisCache[selectedResumeId]);
          setLoadingAnalysis(false);
          return;
        }

        // Check authentication
        if (!token) {
          setError('Authentication required');
          onNavigateToLogin();
          return;
        }

        // Fetch from API if not cached
        const result = await resumeAPI.getResumeAnalysis(selectedResumeId);
        
        if (result.success) {
          const analysisData = result.data;
          
          // Cache the analysis
          setAnalysisCache(prev => ({
            ...prev,
            [selectedResumeId]: analysisData
          }));
          
          setCurrentAnalysis(analysisData);
          updateSkillsFromAnalysis(analysisData);
        } else {
          throw new Error(result.message || 'Failed to load analysis');
        }
      } catch (err) {
        console.error('Error fetching analysis:', err);
        // Handle session expired errors
        if (err.message.includes('Session expired')) {
          onNavigateToLogin();
        }
        setError(err.message);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [selectedResumeId, analysisCache, onNavigateToLogin, token]);

  // Derive skills section data from analysis payload shape.
  const updateSkillsFromAnalysis = (analysis) => {
    if (analysis?.skills_analysis && Array.isArray(analysis.skills_analysis)) {
      setSkills(analysis.skills_analysis);
    } else {
      setSkills([]);
    }
  };

  // Stage upload by validating file and collecting role context via modal.
  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);

      // Check authentication
      if (!token) {
        setUploadError('Authentication required. Please login first.');
        onNavigateToLogin();
        return;
      }

      // Validate file type on client
      const allowedMimes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedMimes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.type}. Only DOCX (Word) files are allowed.`);
        event.target.value = '';
        return;
      }

      // Validate file size on client (3MB max)
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 3MB limit. Please use a smaller Word file.`);
        event.target.value = '';
        return;
      }

      // Store file and open target role modal
      setPendingFile(file);
      setIsTargetRoleModalOpen(true);
      
      // Reset file input after storing
      event.target.value = '';
    } catch (err) {
      console.error('Error in handleResumeUpload:', err);
      setUploadError(`Upload failed: ${err.message}`);
    }
  };

  // Submit upload request with target role, then refresh local resume/analysis state.
  const handleTargetRoleSubmit = async (roleData) => {
    if (!pendingFile) return;

    try {
      setLoadingUpload(true);
      setUploadError(null);
      setIsTargetRoleModalOpen(false);

      console.log('Uploading file with target role:', {
        file: pendingFile.name,
        ...roleData
      });

      // Use resumeAPI to upload - pass ONLY targetRole
      const result = await resumeAPI.uploadResume(pendingFile, {
        targetRole: roleData.targetRole
      });

      console.log('Upload response:', result);

      if (result.success && result.data) {
        // Add new resume to list and select it
        setResumesList(prev => [...prev, result.data]);
        setSelectedResumeId(result.data.id);
        setError(null);
        console.log('Resume uploaded and saved successfully:', result.data);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      
      // Handle token expiry errors
      if (err.message.includes('Session expired') || err.message.includes('Unauthorized')) {
        setUploadError('Session expired. Please login again.');
        onNavigateToLogin();
      } else {
        setUploadError(`Upload failed: ${err.message}`);
      }
    } finally {
      setLoadingUpload(false);
      setPendingFile(null);
    }
  };

  const handleDeleteResume = (id) => {
    // Remove from list and cache
    setResumesList(prev => prev.filter(r => r.id !== id));
    setAnalysisCache(prev => {
      const newCache = { ...prev };
      delete newCache[id];
      return newCache;
    });

    // If deleted resume was selected, select first available
    if (selectedResumeId === id) {
      const remainingResumes = resumesList.filter(r => r.id !== id);
      setSelectedResumeId(remainingResumes[0]?.id || null);
    }
  };

  const sidebarItems = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'resume', icon: 'description', label: 'Resume', isActive: true },
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

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      if (token) {
        await logoutAPI(token);
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

  const userProfile = {
    name: user?.name || 'User',
    headerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnvE6dtuVKhnW1CG7Ru8xLYWNZdR9yGwUzMbh1BuPP2rELZxbRZ5yS7AhQvk9zJeviK0mBKRSz8Rc8k8KDAT7u2AfT0060uk2OxG7XGB4uqdTIqd1lzCRRUzd2sgOQGVdXvhIUyFFBF0q_R3ESFNnd2WWgRCKQIWNsBHx69PgFWtSQ9G0C7R6HxM_6Ubjys3nsZpIq4xKgBFxoLicLN7JMLvbua5o_wOw-juJa4vCX__Zxk3qVxTKFBXnCEap7BR8WmUCWQaZyB0w',
  };

  const handleComingSoon = (event, title, message) => {
    event.preventDefault();
    openComingSoon({ title, message });
  };

  const handleAddSkill = async (newSkill) => {
    // Add new skill to local state
    setSkills([...skills, newSkill]);
    // Invalidate cache so next fetch gets updated data
    DataSyncService.invalidateCache('user_skills');
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
  if (loadingResumes) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-text-main dark:text-white font-medium">Loading resumes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentAnalysis) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">Failed to Load</h2>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-6 pb-20">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 md:gap-10">
            <ResumeUploadSection 
              uploadedResumes={resumesList}
              MAX_RESUMES={3}
              onResumeUpload={handleResumeUpload}
              onDeleteResume={handleDeleteResume}
              onSelectResume={setSelectedResumeId}
              selectedResumeId={selectedResumeId}
            />

            <SkillsSection skills={skills} onAddSkillClick={() => setIsAddSkillModalOpen(true)} onDeleteSkill={handleDeleteSkill} />

            <AddSkillModal
              isOpen={isAddSkillModalOpen}
              onClose={() => setIsAddSkillModalOpen(false)}
              onSkillAdded={handleAddSkill}
            />

            <TargetRoleModal
              isOpen={isTargetRoleModalOpen}
              onClose={() => {
                setIsTargetRoleModalOpen(false);
                setPendingFile(null);
              }}
              onConfirm={handleTargetRoleSubmit}
              isLoading={loadingUpload}
            />

            {currentAnalysis && (
              <>
                <AnalysisCards 
                  atsAnalysis={currentAnalysis.ats_analysis}
                  experienceAnalysis={currentAnalysis.experience_analysis}
                  education={currentAnalysis.education_analysis?.educations || []}
                />

                <SWOTAnalysis swotData={currentAnalysis.swot_analysis} />

                <ResumeImprovements improvementsData={currentAnalysis.resume_improvements} />
              </>
            )}

            {loadingAnalysis && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading analysis...</p>
              </div>
            )}
          </div>

          <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-border-light dark:border-border-dark flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
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

export default ResumeAndSkills;