// client/src/components/DashboardLayout.jsx
// Reusable dashboard frame composing sidebar, topbar, content, and footer.

import React from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MobileSidebarBackdrop from './MobileSidebarBackdrop';
import Footer from './Footer';

/**
 * Layout wrapper component for dashboard pages
 * Includes TopBar, Sidebar, Footer and mobile backdrop
 */
const DashboardLayout = ({
  children,
  sidebarItems = [],
  isSidebarOpen = false,
  onSidebarToggle = () => {},
  onSidebarNavigate = () => {},
  isProfileMenuOpen = false,
  onProfileMenuToggle = () => {},
  onMenuClick = () => {},
  onNavigateToLogin = () => {},
  onNavigateToLanding = () => {},
  onNavigateToHome = () => {},
  onNavigateToProfile = () => {},
  onNavigateToSettings = () => {},
  onLogout = () => {},
  userProfile = {},
  footerLinks = {},
}) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white transition-colors duration-300 flex overflow-hidden">
      <MobileSidebarBackdrop
        isOpen={isSidebarOpen}
        onClose={onSidebarToggle}
      />

      {sidebarItems.length > 0 && (
        <Sidebar
          items={sidebarItems}
          isOpen={isSidebarOpen}
          onNavigate={onSidebarNavigate}
          onNavigateToSettings={onNavigateToSettings}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <TopBar
          onMenuClick={onMenuClick}
          isProfileMenuOpen={isProfileMenuOpen}
          onProfileMenuToggle={onProfileMenuToggle}
          onNavigateToLogin={onNavigateToLogin}
          onNavigateToLanding={onNavigateToLanding}
          onNavigateToHome={onNavigateToHome}
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToSettings={onNavigateToSettings}
          onLogout={onLogout}
          onNavigateToHelp={footerLinks?.onHelp}
          userProfile={userProfile}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-6 pb-20 scroll-smooth">
          {children}

          <Footer
            onAbout={footerLinks.onAbout}
            onHelp={footerLinks.onHelp}
            onPrivacy={footerLinks.onPrivacy}
            onTerms={footerLinks.onTerms}
            onPricing={footerLinks.onPricing}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;