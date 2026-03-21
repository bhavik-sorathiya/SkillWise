// client/src/context/ComingSoonContext.jsx
// Global context for triggering and rendering the shared Coming Soon modal.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ComingSoonModal from '../components/ComingSoonModal';

const ComingSoonContext = createContext({
  openComingSoon: () => {}
});

export const ComingSoonProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('Coming Soon');
  const [message, setMessage] = useState('This feature is under development.');

  const openComingSoon = useCallback((options = {}) => {
    setTitle(options.title || 'Coming Soon');
    setMessage(options.message || 'This feature is under development.');
    setIsOpen(true);
  }, []);

  const closeComingSoon = () => setIsOpen(false);

  const value = useMemo(() => ({ openComingSoon }), [openComingSoon]);

  return (
    <ComingSoonContext.Provider value={value}>
      {children}
      <ComingSoonModal
        isOpen={isOpen}
        title={title}
        message={message}
        onClose={closeComingSoon}
      />
    </ComingSoonContext.Provider>
  );
};

export const useComingSoon = () => useContext(ComingSoonContext);
