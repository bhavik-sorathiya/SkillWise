// client/src/components/ProfileCompletionModal.jsx
// Blocking modal shown when the user must finish onboarding/profile setup.

import React from 'react';

const ProfileCompletionModal = ({ isOpen, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 md:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-2xl">person_search</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-text-main dark:text-white">Complete your profile first</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Finish the required profile details before using the dashboard, resume, interview, or settings pages.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border-light dark:border-border-dark bg-background-light/60 dark:bg-background-dark/60 p-4">
          <p className="text-sm font-semibold text-text-main dark:text-white">Required fields</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Preferred roles</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Gender</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Experience level</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            Complete profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;