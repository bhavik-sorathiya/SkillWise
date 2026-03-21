// client/src/components/ResumeImprovements.jsx
// Priority-grouped list of actionable resume improvement suggestions.

import React from 'react';

/**
 * ResumeImprovements
 * Displays grouped improvement suggestions by priority buckets (high/medium/low).
 * @param {Object} props
 * @param {{high?:Array, medium?:Array, low?:Array}|null} props.improvementsData
 */
const ResumeImprovements = ({ improvementsData }) => {
  // Handle null/undefined data
  if (!improvementsData) {
    return null;
  }

  const priorityLevels = [
    {
      key: 'high',
      label: 'High Priority',
      icon: 'priority_high',
      labelColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      badgeBg: 'bg-red-100 dark:bg-red-900/40',
      badgeText: 'text-red-700 dark:text-red-400'
    },
    {
      key: 'medium',
      label: 'Medium Priority',
      icon: 'info',
      labelColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
      badgeText: 'text-amber-700 dark:text-amber-400'
    },
    {
      key: 'low',
      label: 'Low Priority',
      icon: 'check_circle',
      labelColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
      badgeText: 'text-blue-700 dark:text-blue-400'
    }
  ];

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Resume Improvements</h2>
      <div className="space-y-6">
        {priorityLevels.map((priority) => {
          const items = improvementsData[priority.key] || [];
          if (!Array.isArray(items) || items.length === 0) return null;

          return (
            <div key={priority.key}>
              <h3 className={`text-sm font-semibold ${priority.labelColor} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                <span className="material-symbols-outlined text-[18px]">{priority.icon}</span>
                {priority.label}
              </h3>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className={`${priority.bgColor} border ${priority.borderColor} p-4 rounded-lg`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {item.suggestion || item.area || 'Suggestion'}
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {item.reason || item.suggestion}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${priority.badgeText} px-2 py-1 ${priority.badgeBg} rounded whitespace-nowrap`}>
                        {item.estimated_impact || item.impact || 'Check it'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ResumeImprovements;
