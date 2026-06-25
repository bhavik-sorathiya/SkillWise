// client/src/App.jsx
// App shell with lightweight page routing and global providers.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Landing from './Landing'
import Login from './Login'
import Signup from './Signup'
import Onboarding from './Onboarding'
import IntervieweeDashboard from './IntervieweeDashboard'
import ResumeAndSkills from './ResumeAndSkills'
import MockInterviewChat from './MockInterviewChat'
import InterviewHistory from './components/InterviewHistory'
import ProfilePage from './ProfilePage'
import SettingsPage from './SettingsPage'
import DashboardLayout from './components/DashboardLayout'
import KnowDeveloperPage from './components/KnowDeveloperPage'
import HelpCenterPage from './components/HelpCenterPage'
import TermsPolicyPage from './components/TermsPolicyPage'
import PricingPage from './components/PricingPage'
import AdminPortal from './components/AdminPortal'
import ProfileCompletionModal from './components/ProfileCompletionModal'
import ErrorBoundary from './components/ErrorBoundary'
import { ErrorProvider } from './context/ErrorContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ComingSoonProvider } from './context/ComingSoonContext'
import { ApiKeyProvider } from './context/ApiKeyContext'
import { getUserAvatar } from './utils/avatar'
import './App.css'

// Top-level client router/state container for page-level navigation.
const PAGE_TO_PATH = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
  'interviewee-dashboard': '/dashboard',
  'resume-skills': '/resume-skills',
  'mock-interview-chat': '/mock-interview',
  'interview-history': '/interview-history',
  'profile': '/profile',
  'settings': '/settings',
  'know-developer': '/know-developer',
  'help-center': '/help-center',
  'terms-policy': '/terms-policy',
  'pricing': '/pricing',
  'admin-portal': '/admin-portal',
};

const PATH_TO_PAGE = {
  '/': 'landing',
  '/login': 'login',
  '/signup': 'signup',
  '/onboarding': 'onboarding',
  '/dashboard': 'interviewee-dashboard',
  '/resume-skills': 'resume-skills',
  '/mock-interview': 'mock-interview-chat',
  '/interview-history': 'interview-history',
  '/profile': 'profile',
  '/settings': 'settings',
  '/know-developer': 'know-developer',
  '/help-center': 'help-center',
  '/terms-policy': 'terms-policy',
  '/pricing': 'pricing',
  '/admin-portal': 'admin-portal',
};

const PROTECTED_PAGES = ['onboarding', 'interviewee-dashboard', 'resume-skills', 'mock-interview-chat', 'interview-history', 'profile', 'settings', 'admin-portal'];
const COMPLETION_GATED_PAGES = ['interviewee-dashboard', 'resume-skills', 'mock-interview-chat', 'interview-history', 'settings'];

const normalizePath = (pathname = '/') => {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const getPageFromPath = (pathname) => {
  const normalized = normalizePath(pathname);
  return PATH_TO_PAGE[normalized] || 'landing';
};

function AppContent() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const needsProfileCompletion = isAuthenticated && user?.profile_completed !== true;

  const dashboardUserProfile = useMemo(() => ({
    name: user?.full_name || user?.name || 'User',
    headerAvatar: getUserAvatar(user?.gender)
  }), [user]);

  /**
   * Navigate to page - with auth protection
   * Protected pages: interviewee-dashboard, resume-skills, mock-interview-chat
   */
  const navigateToPage = useCallback((page, options = {}) => {
    const { replace = false } = options;
    const requiresAuth = PROTECTED_PAGES.includes(page);
    const targetPage = requiresAuth && !isAuthenticated ? 'landing' : page;
    const targetPath = PAGE_TO_PATH[targetPage] || '/';

    setCurrentPage(targetPage);

    const currentPath = normalizePath(window.location.pathname);
    if (currentPath !== targetPath) {
      const historyMethod = replace ? 'replaceState' : 'pushState';
      const currentIdx = window.history.state?.idx || 0;
      const nextIdx = replace ? currentIdx : currentIdx + 1;
      window.history[historyMethod]({ page: targetPage, idx: nextIdx }, '', targetPath);
    }
  }, [isAuthenticated]);

  const handleBack = useCallback(() => {
    const currentIdx = window.history.state?.idx || 0;
    if (currentIdx > 0) {
      window.history.back();
    } else {
      navigateToPage(isAuthenticated ? 'interviewee-dashboard' : 'landing', { replace: true });
    }
  }, [isAuthenticated, navigateToPage]);

  const handleInterviewHistorySidebarNavigate = (key) => {
    switch (key) {
      case 'home': navigateToPage('interviewee-dashboard'); break;
      case 'resume': navigateToPage('resume-skills'); break;
      case 'mock-interview': navigateToPage('mock-interview-chat'); break;
      case 'profile': navigateToPage('profile'); break;
      case 'settings': navigateToPage('settings'); break;
      case 'interviews':
      default: navigateToPage('interview-history'); break;
    }
  };

  const handleInterviewHistoryLogout = () => {
    logout();
    navigateToPage('landing', { replace: true });
  };

  const openOnboarding = () => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
    navigateToPage('onboarding');
  };

  useEffect(() => {
    const handlePopState = () => {
      const pageFromUrl = getPageFromPath(window.location.pathname);
      if (!loading && PROTECTED_PAGES.includes(pageFromUrl) && !isAuthenticated) {
        navigateToPage('landing', { replace: true });
        return;
      }
      setCurrentPage(pageFromUrl);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, loading, navigateToPage]);

  useEffect(() => {
    if (loading) return;

    if (PROTECTED_PAGES.includes(currentPage) && !isAuthenticated) {
      navigateToPage('landing', { replace: true });
      return;
    }

    const expectedPath = PAGE_TO_PATH[currentPage] || '/';
    const currentPath = normalizePath(window.location.pathname);
    if (currentPath !== expectedPath) {
      window.history.replaceState({ page: currentPage, idx: window.history.state?.idx || 0 }, '', expectedPath);
    } else if (!window.history.state || window.history.state.idx === undefined) {
      window.history.replaceState({ page: currentPage, idx: 0 }, '', expectedPath);
    }
  }, [currentPage, isAuthenticated, loading, navigateToPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'admin-portal':
        return <AdminPortal 
          onBack={() => navigateToPage('interviewee-dashboard')} 
          onLogout={() => { logout(); navigateToPage('landing', { replace: true }); }}
        />
      case 'login':
        return <Login 
          onBackToHome={handleBack} 
          onNavigateToSignup={() => navigateToPage('signup')}
          onNavigateToDashboard={() => navigateToPage('interviewee-dashboard')}
          onNavigateToOnboarding={() => navigateToPage('onboarding')}
        />
      case 'signup':
        return <Signup 
          onBackToHome={handleBack} 
          onNavigateToLogin={() => navigateToPage('login')} 
          onNavigateToOnboarding={() => navigateToPage('onboarding')}
          onNavigateToDashboard={() => navigateToPage('interviewee-dashboard')}
        />
      case 'onboarding':
        return <Onboarding
          onComplete={() => navigateToPage('interviewee-dashboard')}
          onNavigateToLogin={() => navigateToPage('login')}
        />
      case 'interviewee-dashboard':
        return <IntervieweeDashboard 
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onNavigateToProfile={() => navigateToPage('profile')}
          onNavigateToSettings={() => navigateToPage('settings')}
          onLogout={() => navigateToPage('landing')}
          onNavigateToDeveloper={() => navigateToPage('know-developer')}
          onNavigateToHelp={() => navigateToPage('help-center')}
          onNavigateToTerms={() => navigateToPage('terms-policy')}
          onNavigateToPricing={() => navigateToPage('pricing')}
        />
      case 'resume-skills':
        return <ResumeAndSkills 
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onNavigateToProfile={() => navigateToPage('profile')}
          onNavigateToSettings={() => navigateToPage('settings')}
          onLogout={() => navigateToPage('landing')}
          onNavigateToDeveloper={() => navigateToPage('know-developer')}
          onNavigateToHelp={() => navigateToPage('help-center')}
          onNavigateToTerms={() => navigateToPage('terms-policy')}
          onNavigateToPricing={() => navigateToPage('pricing')}
        />
      case 'mock-interview-chat':
        return <MockInterviewChat
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onNavigateToProfile={() => navigateToPage('profile')}
          onNavigateToSettings={() => navigateToPage('settings')}
          onLogout={() => navigateToPage('landing')}
          onNavigateToDeveloper={() => navigateToPage('know-developer')}
          onNavigateToHelp={() => navigateToPage('help-center')}
          onNavigateToTerms={() => navigateToPage('terms-policy')}
          onNavigateToPricing={() => navigateToPage('pricing')}
          onBack={handleBack}
        />
      case 'profile':
        return <ProfilePage
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onNavigateToProfile={() => navigateToPage('profile')}
          onNavigateToSettings={() => navigateToPage('settings')}
          onLogout={() => navigateToPage('landing')}
          onNavigateToDeveloper={() => navigateToPage('know-developer')}
          onNavigateToHelp={() => navigateToPage('help-center')}
          onNavigateToTerms={() => navigateToPage('terms-policy')}
          onNavigateToPricing={() => navigateToPage('pricing')}
          onBack={handleBack}
        />
      case 'settings':
        return <SettingsPage
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onNavigateToProfile={() => navigateToPage('profile')}
          onNavigateToSettings={() => navigateToPage('settings')}
          onLogout={() => navigateToPage('landing')}
          onNavigateToDeveloper={() => navigateToPage('know-developer')}
          onNavigateToHelp={() => navigateToPage('help-center')}
          onNavigateToTerms={() => navigateToPage('terms-policy')}
          onNavigateToPricing={() => navigateToPage('pricing')}
          onBack={handleBack}
        />
      case 'interview-history':
        return (
          <DashboardLayout
            sidebarItems={[
              { key: 'home', icon: 'home', label: 'Home' },
              { key: 'resume', icon: 'description', label: 'Resume' },
              { key: 'mock-interview', icon: 'smart_toy', label: 'Mock Interview' },
              { key: 'interviews', icon: 'videocam', label: 'Interviews', isActive: true },
            ]}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onSidebarNavigate={handleInterviewHistorySidebarNavigate}
            isProfileMenuOpen={isProfileMenuOpen}
            onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            onNavigateToLogin={() => navigateToPage('login')}
            onNavigateToLanding={() => navigateToPage('landing')}
            onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
            onNavigateToProfile={() => navigateToPage('profile')}
            onNavigateToSettings={() => navigateToPage('settings')}
            onLogout={handleInterviewHistoryLogout}
            userProfile={dashboardUserProfile}
            footerLinks={{
              onAbout: () => navigateToPage('know-developer'),
              onHelp: () => navigateToPage('help-center'),
              onPrivacy: () => navigateToPage('terms-policy'),
              onTerms: () => navigateToPage('terms-policy'),
              onPricing: () => navigateToPage('pricing'),
            }}
          >
            <InterviewHistory />
          </DashboardLayout>
        )
      case 'know-developer':
        return <KnowDeveloperPage onBack={handleBack} />
      case 'help-center':
        return <HelpCenterPage onBack={handleBack} />
      case 'terms-policy':
        return <TermsPolicyPage onBack={handleBack} />
      case 'pricing':
        return <PricingPage onBack={handleBack} onGetStarted={() => navigateToPage('signup')} />
      case 'landing':
      default:
        return <Landing 
          onNavigateToLogin={() => navigateToPage('login')} 
          onNavigateToDashboard={() => navigateToPage('interviewee-dashboard')} 
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToSignup={() => navigateToPage('signup')}
          onNavigateToDeveloper={() => navigateToPage('know-developer')}
          onNavigateToHelp={() => navigateToPage('help-center')}
          onNavigateToTerms={() => navigateToPage('terms-policy')}
          onNavigateToPricing={() => navigateToPage('pricing')}
        />
    }
  }

  const renderedPage = renderPage();
  const showProfileCompletionGate = needsProfileCompletion && COMPLETION_GATED_PAGES.includes(currentPage);

  return (
    <>
      {renderedPage}
      <ProfileCompletionModal isOpen={showProfileCompletionGate} onContinue={openOnboarding} />
    </>
  )
}

function App() {
  // Global providers wrap the app so auth, error, and modal context are available everywhere.
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <ComingSoonProvider>
            <ApiKeyProvider>
              <AppContent />
            </ApiKeyProvider>
          </ComingSoonProvider>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  )
}

export default App
