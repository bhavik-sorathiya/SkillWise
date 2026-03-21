// client/src/components/MobileSidebarBackdrop.jsx
// Overlay backdrop that closes sidebar on mobile when clicked.

import React from 'react';

const MobileSidebarBackdrop = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
      onClick={onClose}
    />
  );
};

export default MobileSidebarBackdrop;
