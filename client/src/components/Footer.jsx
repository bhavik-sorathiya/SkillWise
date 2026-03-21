// client/src/components/Footer.jsx
// Shared footer with support/legal links and optional custom handlers.

import React from 'react';
import { useComingSoon } from '../context/ComingSoonContext';

const Footer = ({ onAbout, onHelp, onPrivacy, onTerms }) => {
  const { openComingSoon } = useComingSoon();

  const handleComingSoon = (e, title, message) => {
    e.preventDefault();
    openComingSoon({ title, message });
  };

  return (
    <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border-light dark:border-border-dark flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 px-4 md:px-8">
      <p>© 2026 SkillWise Inc. All rights reserved.</p>
      <div className="flex gap-6">
        <a
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            onAbout ? onAbout() : handleComingSoon(e, 'About', 'About page is coming soon.');
          }}
        >
          About
        </a>
        <a
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            onHelp ? onHelp() : handleComingSoon(e, 'Help Center', 'Help Center is coming soon.');
          }}
        >
          Help Center
        </a>
        <a
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            onPrivacy ? onPrivacy() : handleComingSoon(e, 'Privacy', 'Privacy details are coming soon.');
          }}
        >
          Privacy
        </a>
        <a
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            onTerms ? onTerms() : handleComingSoon(e, 'Terms', 'Terms are coming soon.');
          }}
        >
          Terms
        </a>
      </div>
    </footer>
  );
};

export default Footer;
