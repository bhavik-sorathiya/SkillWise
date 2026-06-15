// client/src/MockInterviewChat.jsx
// Chat-based mock interview workspace with real-time socket.io integration.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useError } from './context/ErrorContext';
import { useApiKey } from './context/ApiKeyContext';
import { logout as logoutAPI, API_BASE_URL } from './services/api';
import socketService from './services/socketService';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import MobileSidebarBackdrop from './components/MobileSidebarBackdrop';
import { getUserAvatar } from './utils/avatar';

const MockInterviewChat = ({
  onNavigateToLogin,
  onNavigateToLanding,
  onNavigateToHome,
  onNavigateToResume,
  onNavigateToMockInterview,
  onNavigateToInterviews,
  onNavigateToProfile,
  onNavigateToSettings,
  onLogout,
  onNavigateToDeveloper,
  onNavigateToHelp,
  onNavigateToTerms
}) => {
  const { token, isAuthenticated, logout, user } = useAuth();
  const { addError } = useError();
  const { showApiKeyModal } = useApiKey();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [checkingLimits, setCheckingLimits] = useState(true);

  // Interview initialization state
  const [showResumeModal, setShowResumeModal] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [modalLoading, setModalLoading] = useState(true);
  const [interviewActive, setInterviewActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isFinalizingInterview, setIsFinalizingInterview] = useState(false);
  const [finalizingMessage, setFinalizingMessage] = useState('Analyzing the interview...');
  const finalizingTimerRef = useRef(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingNavigationRef = useRef(null);

  const userProfile = useMemo(
    () => ({
      name: user?.full_name || user?.name || 'User',
      headerAvatar: getUserAvatar(user?.gender)
    }),
    [user]
  );

  const sidebarItems = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'resume', icon: 'description', label: 'Resume' },
    { key: 'mock-interview', icon: 'smart_toy', label: 'Mock Interview', isActive: true },
    { key: 'interviews', icon: 'videocam', label: 'Interviews' },
  ];

  const clearFinalizingTimer = useCallback(() => {
    if (finalizingTimerRef.current) {
      window.clearTimeout(finalizingTimerRef.current);
      finalizingTimerRef.current = null;
    }
  }, []);

  const navigateByKey = useCallback((key) => {
    switch (key) {
      case 'home': onNavigateToHome?.(); break;
      case 'resume': onNavigateToResume?.(); break;
      case 'mock-interview': onNavigateToMockInterview?.(); break;
      case 'interviews': onNavigateToInterviews?.(); break;
      case 'landing': onNavigateToLanding?.(); break;
      case 'login':
        onNavigateToLogin?.();
        break;
      default:
        break;
    }
  }, [onNavigateToHome, onNavigateToInterviews, onNavigateToLanding, onNavigateToLogin, onNavigateToMockInterview, onNavigateToResume]);

  const queueNavigation = useCallback((navigateFn) => {
    if (interviewActive && !isFinalizingInterview) {
      setPendingNavigation(() => navigateFn);
      pendingNavigationRef.current = navigateFn;
      setShowLeaveWarning(true);
      return;
    }

    navigateFn?.();
  }, [interviewActive, isFinalizingInterview]);

  const beginFinalizingInterview = useCallback((message = 'Analyzing the interview...') => {
    clearFinalizingTimer();
    setIsFinalizingInterview(true);
    setFinalizingMessage(message);
  }, [clearFinalizingTimer]);

  const endInterviewAndNavigate = useCallback((navigateFn) => {
    beginFinalizingInterview('Analyzing the interview...');
    pendingNavigationRef.current = navigateFn;

    if (!sessionId) {
      finalizingTimerRef.current = window.setTimeout(() => {
        setIsFinalizingInterview(false);
        navigateFn?.();
      }, 500);
      return;
    }

    try {
      socketService.endInterview(sessionId);
      // Set a long safety fallback timeout (e.g., 6 seconds) in case the server doesn't respond.
      // Under normal circumstances, the 'interview_result' event will arrive first and clear this timeout.
      finalizingTimerRef.current = window.setTimeout(() => {
        console.warn('[Mock Interview] End session fallback timeout triggered');
        setIsFinalizingInterview(false);
        navigateFn?.();
      }, 6000);
    } catch (error) {
      console.error('[Mock Interview] Error ending session:', error);
      setIsFinalizingInterview(false);
      setLoadingMessage('');
      addError('Failed to end the interview session.', 'error');
    }
  }, [addError, beginFinalizingInterview, sessionId]);

  const confirmLeaveInterview = useCallback(() => {
    const nextNavigation = pendingNavigation;
    setShowLeaveWarning(false);
    setPendingNavigation(null);
    endInterviewAndNavigate(nextNavigation);
  }, [endInterviewAndNavigate, pendingNavigation]);

  const cancelLeaveInterview = useCallback(() => {
    setShowLeaveWarning(false);
    setPendingNavigation(null);
  }, []);

  // Fetch limits and resumes on mount
  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated || !token) {
      onNavigateToLogin?.();
      return;
    }

    const fetchResumes = async () => {
      try {
        setModalLoading(true);
        const response = await fetch(`${API_BASE_URL}/resumes/list`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch resumes');
        }

        const data = await response.json();
        if (!isMounted) return;

        if (data.success && data.data.resumes) {
          setResumes(data.data.resumes);
        } else {
          setResumes([]);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[Mock Interview] Error fetching resumes:', error);
        addError(
          error.message || 'Failed to load resumes. Please try again.',
          'error'
        );
      } finally {
        if (isMounted) {
          setModalLoading(false);
        }
      }
    };

    const verifyLimitsAndFetch = async () => {
      try {
        setCheckingLimits(true);
        const limitRes = await fetch(`${API_BASE_URL}/profile/check-limits?type=interview`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const limitData = await limitRes.json();

        if (!isMounted) return;

        if (limitData.success && !limitData.allowed) {
          // Blocked by daily limit
          showApiKeyModal(
            () => {
              if (!isMounted) return;
              setCheckingLimits(false);
              fetchResumes();
            },
            () => {
              if (!isMounted) return;
              addError('Daily free mock interview limit reached. Please add your own API key to continue.', 'warning');
              onNavigateToHome?.();
            }
          );
          return;
        }

        // Allowed to proceed, fetch resumes now
        setCheckingLimits(false);
        fetchResumes();
      } catch (err) {
        if (!isMounted) return;
        console.error('[Mock Interview] Error verifying limits:', err);
        // Fallback: let them proceed if backend limit check itself fails
        setCheckingLimits(false);
        fetchResumes();
      }
    };

    verifyLimitsAndFetch();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated]);

  // Auto-resize textarea based on user input content height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 140);
    textarea.style.height = `${newHeight}px`;
  }, [inputValue]);

  // Scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // Setup socket listeners early so first ai_message is not missed.
  useEffect(() => {
    if (!token) return;

    const offAiMessage = socketService.on('ai_message', (data) => {
      console.log('[Socket] Received AI message:', data);
      if (data?.sessionId) {
        setSessionId(data.sessionId);
      }
      setInterviewActive(true);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.question || 'Understanding your answer...',
        type: 'question'
      }]);
      setIsAiTyping(false);
      setLoadingMessage('');
    });

    // Listen for interview result
    const offInterviewResult = socketService.on('interview_result', (data) => {
      console.log('[Socket] Interview ended:', data);
      setInterviewActive(false);
      setIsAiTyping(false);
      setLoadingMessage('');
      clearFinalizingTimer();
      setIsFinalizingInterview(false);
      addError('Interview complete! View your detailed analysis in the interview history.', 'success', 4000);

      const nextNavigation = pendingNavigationRef.current || (() => onNavigateToInterviews?.());
      pendingNavigationRef.current = null;
      setPendingNavigation(null);

      setTimeout(() => {
        nextNavigation?.();
      }, 1200);
    });

    // Listen for loading events
    const offLoading = socketService.on('loading', (data) => {
      console.log('[Socket] Loading:', data.message);
      setLoadingMessage(data.message);
    });

    const offEndTriggered = socketService.on('end_interview_triggered', () => {
      // Legacy event retained for backward compatibility.
    });

    const offInterviewClosing = socketService.on('interview_closing', (data) => {
      console.log('[Socket] Interview closing:', data);
      const sid = data?.sessionId || sessionId;
      const evaluatingDelay = Number(data?.evaluatingInMs) || 3500;

      addError('Interview complete. We are analyzing your final result...', 'info', 4000);
      beginFinalizingInterview('Analyzing the interview...');

      finalizingTimerRef.current = window.setTimeout(() => {
        if (sid) {
          socketService.endInterview(sid);
        }
      }, evaluatingDelay);
    });

    // Listen for errors
    const offError = socketService.on('error', (data) => {
      console.error('[Socket] Error:', data);
      if (data.code === 'RATE_LIMIT_EXCEEDED' || data.code === 'QUOTA_EXCEEDED' || data.code === 'INVALID_CUSTOM_API_KEY' || data.message?.toLowerCase().includes('limit')) {
        setInterviewActive(false);
        setShowResumeModal(false); // Hide the resume modal if it's still open
        showApiKeyModal(() => {
          addError('API key saved. You can now start the interview again.', 'success');
        });
      } else {
        addError(data.message || 'An error occurred during the interview.', 'error');
      }
      setIsAiTyping(false);
      setLoadingMessage('');
    });

    return () => {
      offAiMessage();
      offInterviewResult();
      offLoading();
      offEndTriggered();
      offInterviewClosing();
      offError();
    };
  }, [beginFinalizingInterview, clearFinalizingTimer, onNavigateToInterviews, pendingNavigation, token, addError, sessionId]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!interviewActive) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [interviewActive]);

  // Validates setup inputs, connects socket, then emits interview start event.
  const handleStartInterview = async () => {
    if (!selectedResume) {
      addError('Please select a resume to continue.', 'warning');
      return;
    }

    if (!targetRole.trim()) {
      addError('Please enter the target job role.', 'warning');
      return;
    }

    try {
      setShowResumeModal(false);
      setIsAiTyping(true);
      setLoadingMessage('Starting interview...');

      // Connect to socket and start interview with server-expected payload shape.
      await socketService.connect(token, user?.id);
      setInterviewActive(true);
      socketService.startInterview(selectedResume.id, targetRole.trim());

    } catch (error) {
      console.error('[Mock Interview] Error starting interview:', error);
      setShowResumeModal(true);
      setInterviewActive(false);
      addError(
        error.message || 'Failed to start interview. Please try again.',
        'error'
      );
    }
  };

  // Sends a candidate answer to server and switches UI into evaluation/loading state.
  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isAiTyping || !interviewActive) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      type: 'answer'
    }]);
    setInputValue('');
    setIsAiTyping(true);
    setLoadingMessage('AI is evaluating your answer...');

    try {
      // Send message via socket
      socketService.sendMessage(sessionId, text);
    } catch (error) {
      console.error('[Mock Interview] Error sending message:', error);
      setIsAiTyping(false);
      setLoadingMessage('');
    }
  };

  // Enter submits answer while Shift+Enter keeps multi-line behavior.
  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !isAiTyping) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Ends the active session explicitly and navigates user back to dashboard.
  const handleEndSession = async () => {
    endInterviewAndNavigate(() => onNavigateToInterviews?.());
  };

  // Performs backend logout best-effort, then clears local auth state regardless of API outcome.
  const handleLogout = async () => {
    try {
      if (token) {
        await logoutAPI(token);
      }
    } catch (error) {
      console.error('Backend logout error:', error);
    } finally {
      logout();
      onLogout?.();
    }
  };

  // Centralized sidebar key router to keep navigation mapping in one place.
  const handleSidebarNavigate = (key) => {
    queueNavigation(() => navigateByKey(key));
  };

  const handleNavigateToLanding = () => queueNavigation(() => onNavigateToLanding?.());
  const handleNavigateToHome = () => queueNavigation(() => onNavigateToHome?.());

  // Limits check loading screen
  if (checkingLimits) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 animate-duration-1000" />
          <p className="text-text-main dark:text-white font-medium">Verifying daily usage limits…</p>
        </div>
      </div>
    );
  }

  // Resume Selection Modal
  if (showResumeModal) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  onNavigateToHome?.();
                }
              }}
              className="size-10 rounded-full border border-border-light dark:border-border-dark text-text-main dark:text-white hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <h1 className="text-3xl font-bold text-text-main dark:text-white">Start Text-Based Mock Interview</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Select your resume and target role to begin your interactive text-based chat simulation.</p>

          {modalLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 dark:text-yellow-300 font-semibold">No resumes found</p>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">Please upload a resume first</p>
              <button
                onClick={() => onNavigateToResume?.()}
                className="mt-4 px-4 py-2 bg-yellow-600 dark:bg-yellow-600 hover:bg-yellow-700 dark:hover:bg-yellow-700 text-white rounded-lg transition"
              >
                Upload Resume
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-main dark:text-white mb-3">
                  Select Resume
                </label>
                <div className="space-y-2">
                  {resumes.map(resume => (
                    <div
                      key={resume.id}
                      onClick={() => {
                        setSelectedResume(resume);
                        // Pre-fill targetRole from the selected resume
                        if (resume.target_role && !targetRole) {
                          setTargetRole(resume.target_role);
                        }
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${selectedResume?.id === resume.id
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'border-border-light dark:border-border-dark hover:border-primary/50 dark:hover:border-primary/50'
                        }`}
                    >
                      <p className="font-semibold text-text-main dark:text-white">
                        {resume.title || resume.name}
                      </p>
                      {resume.target_role && (
                        <p className="text-xs text-primary/80 dark:text-primary/60 font-medium mt-0.5">
                          → {resume.target_role}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Uploaded {
                          resume.uploadedDate ||
                          (resume.uploadedAt || resume.uploaded_at
                            ? new Date(resume.uploadedAt || resume.uploaded_at).toLocaleDateString()
                            : 'Date unavailable')
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-main dark:text-white mb-3">
                  Target Job Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior Frontend Developer"
                  className="w-full px-4 py-3 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleStartInterview()}
                />
              </div>

              <button
                onClick={handleStartInterview}
                disabled={!selectedResume || !targetRole.trim()}
                className="w-full px-6 py-3 bg-primary hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                Start Text Interview
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main Interview Chat View
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white transition-colors duration-300 flex overflow-hidden">
      <MobileSidebarBackdrop isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
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
          onNavigateToLanding={handleNavigateToLanding}
          onNavigateToHome={handleNavigateToHome}
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToSettings={onNavigateToSettings}
          onLogout={handleLogout}
          onNavigateToHelp={onNavigateToHelp}
          userProfile={userProfile}
        />

        <main className="flex-1 overflow-hidden flex flex-col p-3 md:p-6 pt-3 md:pt-4 relative">
          <div className="max-w-6xl mx-auto w-full flex-1 min-h-0 flex flex-col gap-3 md:gap-4">
            <section className="sticky top-0 z-20 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 md:p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-main dark:text-white">
                    <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                    Interview Info
                  </div>
                  <div className="hidden md:block h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-background-light dark:bg-background-dark px-3 border border-border-light dark:border-border-dark">
                    <span className="material-symbols-outlined text-gray-400 text-[16px]">code</span>
                    <p className="text-xs font-medium">Role: {targetRole || 'Loading...'}</p>
                  </div>
                  <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-primary/10 px-3 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-[16px]">chat</span>
                    <p className="text-primary text-xs font-medium">Mode: Text Chat</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEndSession}
                  className="text-xs font-medium text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:text-red-500 transition-colors">power_settings_new</span>
                  End Session
                </button>
              </div>
            </section>

            <section className="flex-1 min-h-0 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 md:px-6 py-3 border-b border-border-light dark:border-border-dark text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">AI Text-Based Interview - Real Time</span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5">
                {messages.map((message) => {
                  const isUser = message.sender === 'user';
                  return (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                        </div>
                      )}

                      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                          {isUser ? 'You' : 'AI Interviewer'}
                        </p>
                        <div
                          className={`text-[15px] leading-relaxed rounded-2xl px-4 py-3 border ${isUser
                            ? 'bg-primary text-white border-primary rounded-tr-sm'
                            : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark rounded-tl-sm'
                            }`}
                        >
                          {message.text}
                        </div>
                      </div>

                      {isUser && (
                        <div
                          className="size-9 rounded-full bg-cover bg-center border border-border-light dark:border-border-dark shrink-0"
                          style={{ backgroundImage: `url('${userProfile.headerAvatar}')` }}
                        />
                      )}
                    </div>
                  );
                })}

                {loadingMessage && (
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{loadingMessage}</p>
                    </div>
                  </div>
                )}

                {isAiTyping && !loadingMessage && (
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-gray-400 animate-bounce"></span>
                        <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]"></span>
                        <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]"></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-border-light dark:border-border-dark p-4 md:p-5">
                <div className="flex items-end gap-2 bg-background-light dark:bg-background-dark rounded-2xl border border-border-light dark:border-border-dark px-3 py-2 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows={1}
                    placeholder="Type your answer here..."
                    disabled={isAiTyping}
                    className="flex-1 bg-transparent border-none p-2 text-[15px] leading-relaxed text-text-main dark:text-white placeholder:text-gray-400 disabled:opacity-50 focus:ring-0 resize-none min-h-[44px] max-h-[140px]"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isAiTyping}
                    className="h-10 w-10 flex items-center justify-center bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl shadow-sm transition-all active:scale-95"
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

        </main>
      </div>

      {showLeaveWarning && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-xl font-bold text-text-main dark:text-white">Leave interview?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By moving to another page, this interview will be terminated automatically.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={cancelLeaveInterview}
                className="flex-1 rounded-xl border border-border-light dark:border-border-dark px-4 py-3 text-sm font-semibold text-text-main dark:text-white hover:border-primary hover:text-primary transition-colors"
              >
                Stay in the interview
              </button>
              <button
                type="button"
                onClick={confirmLeaveInterview}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {isFinalizingInterview && (
        <div className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-2xl p-6 md:p-8 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white">Processing interview</h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{finalizingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewChat;
