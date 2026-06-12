// client/src/components/TopBar.jsx
// Shared dashboard top navigation with profile actions and quick links.

import React from 'react';
import { useComingSoon } from '../context/ComingSoonContext';

const TopBar = ({
  onMenuClick,
  isProfileMenuOpen,
  onProfileMenuToggle,
  onNavigateToLogin,
  onNavigateToLanding,
  onNavigateToHome,
  onLogout,
  userProfile,
}) => {
  const { openComingSoon } = useComingSoon();
  const handleNavigateToLanding = onNavigateToLanding || onNavigateToHome;
  // Centralize logout behavior for both explicit handler and fallback navigation.
  const handleLogout = () => {
    // Close profile menu
    onProfileMenuToggle?.();
    
    // Call logout handler if provided
    if (onLogout) {
      onLogout();
    } else {
      // Fallback if onLogout not provided
      onNavigateToLogin?.();
    }
  };

  return (
    <header className="h-16 md:h-20 border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <button
          onClick={handleNavigateToLanding}
          className="flex items-center hover:opacity-80 transition-opacity"
          type="button"
        >
          <span className="material-icons-round text-primary text-3xl md:text-4xl mr-2 transform -rotate-12">school</span>
          <span className="font-display font-bold text-xl md:text-2xl tracking-tight text-text-main dark:text-white">SkillWise</span>
        </button>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          onClick={() => openComingSoon({ title: 'Notifications', message: 'Notifications are coming soon.' })}
        >
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-surface-light dark:border-surface-dark"></span>
        </button>

        <div className="relative">
          <button
            onClick={onProfileMenuToggle}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <div
              className="size-9 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
              style={{ backgroundImage: `url('${userProfile?.headerAvatar || ''}')` }}
            />
            <span className="material-symbols-outlined text-gray-400 hidden sm:block">expand_more</span>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg py-2 z-50">
              <button
                type="button"
                onClick={() => openComingSoon({ title: 'View Profile', message: 'Profile page is coming soon.' })}
                className="w-full px-4 py-3 border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-left"
              >
                <p className="text-sm font-semibold text-text-main dark:text-white">{userProfile?.name || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hover:text-primary transition-colors">View Profile</p>
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark transition-colors flex items-center gap-3"
                onClick={() => openComingSoon({ title: 'Settings', message: 'Settings are coming soon.' })}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Settings
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark transition-colors flex items-center gap-3"
                onClick={() => openComingSoon({ title: 'Help Center', message: 'Help Center is coming soon.' })}
              >
                <span className="material-symbols-outlined text-[20px]">help</span>
                Help Center
              </button>
              <div className="border-t border-border-light dark:border-border-dark my-2"></div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
