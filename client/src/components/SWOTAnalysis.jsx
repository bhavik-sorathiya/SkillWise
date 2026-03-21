// client/src/components/SWOTAnalysis.jsx
// Displays strengths, weaknesses, opportunities, and threats from analysis data.

import React from 'react';

const SWOTAnalysis = ({ swotData }) => {
  // Handle null/undefined swotData
  if (!swotData) {
    return null;
  }

  const swotCategories = [
    { key: 'strengths', label: 'Strengths', icon: 'trending_up', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { key: 'weaknesses', label: 'Weaknesses', icon: 'trending_down', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
    { key: 'opportunities', label: 'Opportunities', icon: 'lightbulb', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
    { key: 'threats', label: 'Threats', icon: 'warning', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">SWOT Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {swotCategories.map((category) => {
          const items = swotData[category.key] || [];
          return (
            <div key={category.key} className={`${category.bgColor} p-4 rounded-xl border border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`material-symbols-outlined text-[20px] ${category.color}`}>{category.icon}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{category.label}</h3>
              </div>
              <ul className="space-y-2">
                {Array.isArray(items) && items.map((item, index) => (
                  <li key={index} className="text-xs text-gray-700 dark:text-gray-300 flex gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SWOTAnalysis;
