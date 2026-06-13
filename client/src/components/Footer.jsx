// client/src/components/Footer.jsx
// Shared footer with support/legal links and optional custom handlers.

import React from 'react';
import { useComingSoon } from '../context/ComingSoonContext';

const Footer = ({ onAbout, onHelp, onPrivacy, onTerms, onPricing }) => {
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
          className="hover:text-primary transition-colors cursor-pointer font-medium"
          onClick={(e) => {
            e.preventDefault();
            onAbout ? onAbout() : handleComingSoon(e, 'Know Developer', 'Know Developer page is coming soon.');
          }}
        >
          Know Developer
        </a>
        <a
          className="hover:text-primary transition-colors cursor-pointer font-medium"
          onClick={(e) => {
            e.preventDefault();
            onHelp ? onHelp() : handleComingSoon(e, 'Help Center', 'Help Center is coming soon.');
          }}
        >
          Help Center
        </a>
        <a
          className="hover:text-primary transition-colors cursor-pointer font-medium"
          onClick={(e) => {
            e.preventDefault();
            onTerms ? onTerms() : (onPrivacy ? onPrivacy() : handleComingSoon(e, 'Terms & Policy', 'Terms page is coming soon.'));
          }}
        >
          Terms & Policy
        </a>
        <a
          className="hover:text-primary transition-colors cursor-pointer font-medium"
          onClick={(e) => {
            e.preventDefault();
            onPricing ? onPricing() : handleComingSoon(e, 'Pricing', 'Pricing page is coming soon.');
          }}
        >
          Pricing
        </a>
      </div>
    </footer>
  );
};

export default Footer;
