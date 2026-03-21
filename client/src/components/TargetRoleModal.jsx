// client/src/components/TargetRoleModal.jsx
// Modal to capture target job role before triggering AI resume analysis.

import React, { useState } from 'react';

// Collects a single role input used to contextualize AI resume analysis.
const TargetRoleModal = ({ isOpen, onClose, onConfirm, isLoading = false }) => {
  const [targetRole, setTargetRole] = useState('');

  // Validate and return normalized role data to parent upload flow.
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!targetRole.trim()) {
      alert('Please enter a target role');
      return;
    }

    onConfirm({
      targetRole: targetRole.trim()
    });

    // Reset form
    setTargetRole('');
  };

  // Close with local form reset so stale input is not retained.
  const handleClose = () => {
    // Reset form
    setTargetRole('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Target Job Role
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Job Role *
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Frontend Developer, Full Stack Engineer"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The job role you're targeting. AI will analyze your experience level from your resume.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
            🔍 AI will automatically detect your experience level and years from your resume for accurate analysis.
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !targetRole.trim()}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Uploading...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TargetRoleModal;