// client/src/components/AddSkillModal.jsx
// Modal form for creating new skills and syncing them with backend data.

import React, { useState } from 'react';
import { skillsAPI } from '../services/api';

/**
 * Add Skill Modal Component
 * Modal for adding a new skill to user's profile
 */
const AddSkillModal = ({ isOpen, onClose, onSkillAdded, resumeId }) => {
  const [skillName, setSkillName] = useState('');
  const [proficiency, setProficiency] = useState('intermediate');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!skillName.trim()) {
      setError('Skill name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await skillsAPI.addSkill(
        skillName,
        proficiency,
        parseInt(yearsOfExperience) || 0,
        resumeId
      );

      if (response.success) {
        // Reset form
        setSkillName('');
        setProficiency('intermediate');
        setYearsOfExperience(0);

        // Notify parent component
        if (onSkillAdded) {
          onSkillAdded(response.skill);
        }

        // Close modal
        onClose();
      } else {
        setError(response.message || 'Failed to add skill');
      }
    } catch (err) {
      console.error('Error adding skill:', err);
      setError(err.message || 'Failed to add skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            Add Skill
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-main dark:text-gray-200 mb-2">
              Skill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g., React, Python, Project Management"
              className="w-full px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main dark:text-gray-200 mb-2">
              Proficiency Level
            </label>
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              disabled={loading}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main dark:text-gray-200 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              min="0"
              max="100"
              className="w-full px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg text-text-main dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">loading</span>
                  Adding...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add</span>
                  Add Skill
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSkillModal;