// client/src/ResumeAndSkills.jsx
// Dedicated resume analysis workspace with upload, results, and skill actions.

import React, { useState, useEffect, useRef } from 'react';
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
import { useError } from './context/ErrorContext';
import { useApiKey } from './context/ApiKeyContext';
import { resumeAPI, logout as logoutAPI } from './services/api';
import { getUserAvatar } from './utils/avatar';
import { DataSyncService } from './utils/cacheSync';
import Footer from './components/Footer';
import './ResumeAndSkills.css';

// Primary interviewee workspace for resume upload, AI analysis, and skill updates.
const ResumeAndSkills = ({ 
  onNavigateToLogin, onNavigateToLanding, onNavigateToHome, 
  onNavigateToResume, onNavigateToMockInterview, onNavigateToInterviews, 
  onNavigateToProfile, onNavigateToSettings, onLogout,
  onNavigateToDeveloper, onNavigateToHelp, onNavigateToTerms
}) => {
  const { token, isAuthenticated, logout, user } = useAuth();
  const { openComingSoon } = useComingSoon();
  const { addError } = useError();
  const { showApiKeyModal } = useApiKey();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isTargetRoleModalOpen, setIsTargetRoleModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const uploadMessageTimerRef = useRef(null);
  
  const [resumesList, setResumesList] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  const [analysisCache, setAnalysisCache] = useState({});
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  const [skills, setSkills] = useState([]);

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
  const [error, setError] = useState(null);

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

        if (result.success) {
          const resumes = result.data?.resumes || [];
          setResumesList(resumes);
          // Auto-select the first resume if available
          if (resumes.length > 0) {
            setSelectedResumeId(resumes[0].id);
          }
        } else {
          throw new Error(result.message || 'Failed to load resumes');
        }
      } catch (err) {
        console.error('Error fetching resumes list:', err);
        // Handle session expired errors
        if (err.message.includes('Session expired')) {
          onNavigateToLogin();
        }
        // Only treat as error if it's NOT just "no resumes"
        if (!err.message.includes('No resumes')) {
          setError(err.message);
        }
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
        addError(err.message, 'error');
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

    // Reset file input early so same file can be selected again if needed
    event.target.value = '';

    try {
      // Check authentication
      if (!token) {
        onNavigateToLogin();
        addError('Authentication required. Please login first.', 'warning');
        return;
      }

      // Validate file type on client
      const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ];
      if (!allowedMimes.includes(file.type)) {
        addError(`Invalid file type: ${file.type}. Only DOCX (Word) and PDF files are allowed.`, 'warning');
        return;
      }

      // Validate file size on client (3MB max)
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        addError(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 3MB limit. Please use a smaller Word or PDF file.`, 'warning');
        return;
      }

      // Check daily limit before proceeding to the target role modal
      setLoadingUpload(true);
      setUploadStatusMessage('Checking daily usage limits...');

      const limitRes = await fetch(`${API_BASE_URL}/profile/check-limits?type=resume`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const limitData = await limitRes.json();
      setLoadingUpload(false);

      if (limitData.success && !limitData.allowed) {
        showApiKeyModal(
          () => {
            // On API key saved successfully: proceed
            setPendingFile(file);
            setIsTargetRoleModalOpen(true);
            addError('API key saved. You can now proceed with your upload.', 'success');
          },
          () => {
            // On API key modal close without key: notify
            setPendingFile(null);
            addError('Daily free resume analysis limit reached. Please add your own API key to continue.', 'warning');
          }
        );
        return;
      }

      // Allowed, open target role modal
      setPendingFile(file);
      setIsTargetRoleModalOpen(true);
    } catch (err) {
      console.error('Error in handleResumeUpload limit check:', err);
      // Fallback: proceed to open target role modal
      setLoadingUpload(false);
      setPendingFile(file);
      setIsTargetRoleModalOpen(true);
    }
  };

  // Submit upload request with target role, then refresh local resume/analysis state.
  const handleTargetRoleSubmit = async (roleData) => {
    if (!pendingFile) return;

    try {
      setLoadingUpload(true);
      setUploadStatusMessage('Uploading your resume...');
      setIsTargetRoleModalOpen(false);

      if (uploadMessageTimerRef.current) {
        window.clearTimeout(uploadMessageTimerRef.current);
      }
      uploadMessageTimerRef.current = window.setTimeout(() => {
        setUploadStatusMessage('Processing and analyzing your resume...');
      }, 1600);

      console.log('Uploading file with target role:', {
        file: pendingFile.name,
        ...roleData
      });

      // Use resumeAPI to upload - pass title + targetRole (both required by new schema)
      const result = await resumeAPI.uploadResume(pendingFile, {
        title: roleData.title,
        targetRole: roleData.targetRole
      });

      console.log('Upload response:', result);

      if (result.success && result.data) {
        // Add new resume to list and select it
        setResumesList(prev => [...prev, result.data]);
        if (result.data.analysisMetadata?.success) {
          setSelectedResumeId(result.data.id);
        }
        setError(null);
        console.log('Resume uploaded and saved successfully:', result.data);

        if (result.data.analysisMetadata?.success) {
          addError('Resume analyzed successfully.', 'success');
        } else if (result.data.analysisMetadata?.attempted) {
          if (result.data.analysisMetadata?.code === 'RATE_LIMIT_EXCEEDED' || result.data.analysisMetadata?.code === 'QUOTA_EXCEEDED' || result.data.analysisMetadata?.code === 'INVALID_CUSTOM_API_KEY') {
            showApiKeyModal(() => {
              addError('API key saved. You can try analyzing this resume again later.', 'success');
            });
          } else {
            addError('Resume uploaded, but analysis failed. Please try again later.', 'warning');
          }
        } else {
          addError('Resume uploaded successfully.', 'success');
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      
      // Handle token expiry errors
      if (err.message.includes('Session expired') || err.message.includes('Unauthorized')) {
        addError('Session expired. Please login again.', 'warning');
        onNavigateToLogin();
      } else if (err.code === 'RATE_LIMIT_EXCEEDED' || err.code === 'QUOTA_EXCEEDED' || err.code === 'INVALID_CUSTOM_API_KEY' || err.message.toLowerCase().includes('limit')) {
        showApiKeyModal(() => {
          // Retry logic could go here if needed
          addError('API key saved. Please try uploading again.', 'success');
        });
      } else {
        addError(`Upload failed: ${err.message}`, 'error');
      }
    } finally {
      if (uploadMessageTimerRef.current) {
        window.clearTimeout(uploadMessageTimerRef.current);
        uploadMessageTimerRef.current = null;
      }
      setLoadingUpload(false);
      setPendingFile(null);
      setUploadStatusMessage('');
    }
  };

  const handleDeleteResume = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this resume? This action cannot be undone.");
    if (!isConfirmed) return;

    try {
      const result = await resumeAPI.deleteResume(id);
      
      if (result.success) {
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
          if (remainingResumes.length > 0) {
            setSelectedResumeId(remainingResumes[0].id);
          } else {
            setSelectedResumeId(null);
            setCurrentAnalysis(null);
            setSkills([]);
          }
        }
        
        addError('Resume deleted successfully.', 'success');
      } else {
        addError(result.message || 'Failed to delete resume', 'error');
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      addError(err.message || 'Failed to delete resume', 'error');
    }
  };

  const sidebarItems = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'resume', icon: 'description', label: 'Resume', isActive: true },
    { key: 'mock-interview', icon: 'smart_toy', label: 'Mock Interview' },
    { key: 'interviews', icon: 'videocam', label: 'Interviews' },
  ];

  const handleSidebarNavigate = (key) => {
    const map = {
      home: onNavigateToHome, resume: onNavigateToResume,
      'mock-interview': onNavigateToMockInterview, interviews: onNavigateToInterviews,
    };
    map[key]?.();
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
    name: user?.full_name || user?.name || 'User',
    headerAvatar: getUserAvatar(user?.gender),
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
    if (selectedResumeId) {
      DataSyncService.invalidateCache(`analysis_resume_${selectedResumeId}`);
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

      <Sidebar
        items={sidebarItems}
        isOpen={isSidebarOpen}
        onNavigate={handleSidebarNavigate}
        onNavigateToSettings={onNavigateToSettings}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
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
          <div className="max-w-6xl mx-auto flex flex-col gap-8 md:gap-10">
            <ResumeUploadSection 
              uploadedResumes={resumesList}
              MAX_RESUMES={3}
              onResumeUpload={handleResumeUpload}
              onDeleteResume={handleDeleteResume}
              onSelectResume={setSelectedResumeId}
              selectedResumeId={selectedResumeId}
            />

            <SkillsSection skills={skills} onAddSkillClick={() => setIsAddSkillModalOpen(true)} />

            <AddSkillModal
              isOpen={isAddSkillModalOpen}
              onClose={() => setIsAddSkillModalOpen(false)}
              onSkillAdded={handleAddSkill}
              resumeId={selectedResumeId}
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

            {loadingUpload && (
              <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-2xl p-6 md:p-8 text-center">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl animate-pulse">cloud_sync</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-main dark:text-white">Processing resume</h3>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {uploadStatusMessage || 'Uploading and analyzing your resume...'}
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce"></span>
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]"></span>
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                </div>
              </div>
            )}

            {currentAnalysis && (
              <>
                <AnalysisCards 
                  atsAnalysis={currentAnalysis.ats_analysis}
                  experienceAnalysis={currentAnalysis.experience_analysis}
                  education={currentAnalysis.education_analysis?.educations || []}
                  completenessScore={currentAnalysis.completeness_score}
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

          <Footer
            onAbout={onNavigateToDeveloper}
            onHelp={onNavigateToHelp}
            onTerms={onNavigateToTerms}
            onPrivacy={onNavigateToTerms}
          />
        </main>
      </div>
    </div>
  );
};

export default ResumeAndSkills;