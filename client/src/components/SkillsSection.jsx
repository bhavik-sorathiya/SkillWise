// client/src/components/SkillsSection.jsx
// Horizontal skills listing with add and remove actions.

import React from 'react';

/**
 * Skills Section Component
 * Displays user's skills and provides option to add new skills
 * @param {Array} skills - Array of skill objects
 * @param {Function} onAddSkillClick - Callback when "Add Skill" button is clicked
 * @param {Function} onDeleteSkill - Callback when skill delete button is clicked
 */
const SkillsSection = ({ skills = [], onAddSkillClick = () => {}, onDeleteSkill = () => {} }) => {
  // Handle null/undefined skills
  const skillsList = Array.isArray(skills) ? skills : [];

  if (skillsList.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Skills</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">No skills added yet. Start by adding your first skill!</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Skills</h3>
      </div>
      <div className="relative group/scroll">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none"></div>
        <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar items-center px-1">
          {skillsList.map((skill) => (
            <div
              key={skill.id}
              className="group px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-500 bg-primary/10 text-primary border border-primary/20 flex items-center gap-2 cursor-default hover:bg-primary/20"
            >
              <span>{skill.skill_name || skill.name}</span>
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {skill.proficiency_level || skill.proficiency}
              </span>
              {onDeleteSkill && (
                <button
                  onClick={() => onDeleteSkill(skill.skill_name || skill.name)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-950 rounded text-gray-400 hover:text-red-500"
                  type="button"
                  aria-label="Delete skill"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          ))}
          <button
            className="px-4 py-2 border-dashed border border-gray-300 dark:border-gray-600 text-gray-400 rounded-full text-sm font-medium whitespace-nowrap hover:text-primary hover:border-primary cursor-pointer transition-colors flex items-center gap-1 shrink-0"
            onClick={onAddSkillClick}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> Add Skill
          </button>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
