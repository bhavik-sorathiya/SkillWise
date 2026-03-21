// client/src/App.jsx
// App shell with lightweight page routing and global providers.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Landing from './Landing'
import Login from './Login'
import Signup from './Signup'
import CompanySignup from './CompanySignup'
import IntervieweeDashboard from './IntervieweeDashboard'
import ResumeAndSkills from './ResumeAndSkills'
import MockInterviewChat from './MockInterviewChat'
import InterviewHistory from './components/InterviewHistory'
import DashboardLayout from './components/DashboardLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { ErrorProvider } from './context/ErrorContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ComingSoonProvider, useComingSoon } from './context/ComingSoonContext'
import './App.css'

// Top-level client router/state container for page-level navigation.
const PAGE_TO_PATH = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  'company-signup': '/company-signup',
  'interviewee-dashboard': '/dashboard',
  'resume-skills': '/resume-skills',
  'mock-interview-chat': '/mock-interview',
  'interview-history': '/interview-history'
};

const PATH_TO_PAGE = {
  '/': 'landing',
  '/login': 'login',
  '/signup': 'signup',
  '/company-signup': 'company-signup',
  '/dashboard': 'interviewee-dashboard',
  '/resume-skills': 'resume-skills',
  '/mock-interview': 'mock-interview-chat',
  '/interview-history': 'interview-history'
};

const PROTECTED_PAGES = ['interviewee-dashboard', 'resume-skills', 'mock-interview-chat', 'interview-history'];

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
  const { openComingSoon } = useComingSoon();
  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const dashboardUserProfile = useMemo(() => ({
    name: user?.name || 'User',
    headerAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnvE6dtuVKhnW1CG7Ru8xLYWNZdR9yGwUzMbh1BuPP2rELZxbRZ5yS7AhQvk9zJeviK0mBKRSz8Rc8k8KDAT7u2AfT0060uk2OxG7XGB4uqdTIqd1lzCRRUzd2sgOQGVdXvhIUyFFBF0q_R3ESFNnd2WWgRCKQIWNsBHx69PgFWtSQ9G0C7R6HxM_6Ubjys3nsZpIq4xKgBFxoLicLN7JMLvbua5o_wOw-juJa4vCX__Zxk3qVxTKFBXnCEap7BR8WmUCWQaZyB0w'
  }), [user]);

  const handleComingSoon = (title, message) => {
    openComingSoon({ title, message });
  };

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
      window.history[historyMethod]({ page: targetPage }, '', targetPath);
    }
  }, [isAuthenticated]);

  const handleInterviewHistorySidebarNavigate = (key) => {
    switch (key) {
      case 'home':
        navigateToPage('interviewee-dashboard');
        break;
      case 'resume':
        navigateToPage('resume-skills');
        break;
      case 'mock-interview':
        navigateToPage('mock-interview-chat');
        break;
      case 'interviews':
      default:
        navigateToPage('interview-history');
        break;
    }
  };

  const handleInterviewHistoryLogout = () => {
    logout();
    navigateToPage('landing', { replace: true });
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
      window.history.replaceState({ page: currentPage }, '', expectedPath);
    }
  }, [currentPage, isAuthenticated, loading, navigateToPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login 
          onBackToHome={() => navigateToPage('landing')} 
          onNavigateToSignup={() => navigateToPage('signup')}
          onNavigateToCompanySignup={() => navigateToPage('company-signup')}
          onNavigateToDashboard={() => navigateToPage('interviewee-dashboard')}
        />
      case 'signup':
        return <Signup onBackToHome={() => navigateToPage('landing')} onNavigateToLogin={() => navigateToPage('login')} onNavigateToCompanySignup={() => navigateToPage('company-signup')} />
      case 'company-signup':
        return <CompanySignup onBackToHome={() => navigateToPage('landing')} onNavigateToLogin={() => navigateToPage('login')} />
      case 'interviewee-dashboard':
        return <IntervieweeDashboard 
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onLogout={() => navigateToPage('landing')}
        />
      case 'resume-skills':
        return <ResumeAndSkills 
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onLogout={() => navigateToPage('landing')}
        />
      case 'mock-interview-chat':
        return <MockInterviewChat
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToLanding={() => navigateToPage('landing')}
          onNavigateToHome={() => navigateToPage('interviewee-dashboard')}
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToMockInterview={() => navigateToPage('mock-interview-chat')}
          onNavigateToInterviews={() => navigateToPage('interview-history')}
          onLogout={() => navigateToPage('landing')}
        />
      case 'interview-history':
        return (
          <DashboardLayout
            sidebarItems={[
              { key: 'home', icon: 'home', label: 'Home' },
              { key: 'resume', icon: 'description', label: 'Resume' },
              { key: 'mock-interview', icon: 'smart_toy', label: 'Mock Interview' },
              { key: 'interviews', icon: 'videocam', label: 'Interviews', isActive: true }
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
            onLogout={handleInterviewHistoryLogout}
            userProfile={dashboardUserProfile}
          >
            <InterviewHistory />
          </DashboardLayout>
        )
      case 'landing':
      default:
        return <Landing 
          onNavigateToLogin={() => navigateToPage('login')} 
          onNavigateToDashboard={() => navigateToPage('interviewee-dashboard')} 
          onNavigateToResume={() => navigateToPage('resume-skills')}
          onNavigateToSignup={() => navigateToPage('signup')}
          onNavigateToCompanySignup={() => navigateToPage('company-signup')}
        />
    }
  }

  return renderPage()
}

function App() {
  // Global providers wrap the app so auth, error, and modal context are available everywhere.
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <ComingSoonProvider>
            <AppContent />
          </ComingSoonProvider>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  )
}

export default App
