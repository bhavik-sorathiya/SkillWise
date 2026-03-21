// client/src/components/EducationCard.jsx
// Collapsible card for rendering structured education details.

import React, { useState } from 'react';

const EducationCard = ({ education }) => {
  const [expandedId, setExpandedId] = useState(null);

  // Handle null/undefined education
  if (!education || !Array.isArray(education) || education.length === 0) {
    return (
      <div>
        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Education</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">No education data available</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const normalized = String(status || '').toLowerCase();
    return normalized === 'pursuing'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  };

  const getStatusIcon = (status) => {
    const normalized = String(status || '').toLowerCase();
    return normalized === 'pursuing' ? 'school' : 'check_circle';
  };

  return (
    <div>
      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Education</h4>
      <div className="space-y-2">
        {education.map((edu, idx) => {
          const eduId = edu.id || idx;
          const degree = edu.degree || 'Degree';
          const institution = edu.institution || 'University';
          const fieldOfStudy = edu.field_of_study || 'Field of Study';
          const graduationYear = edu.graduation_year || edu.end_year || 'TBD';
          const gpa = edu.gpa || 'N/A';
          const additionalInfo = edu.additional_info || '';

          return (
            <div key={eduId}>
              <button
                onClick={() => setExpandedId(expandedId === eduId ? null : eduId)}
                className="w-full bg-surface-light dark:bg-surface-dark p-3 rounded-lg border border-border-light dark:border-border-dark hover:shadow-md transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex-1 text-left min-w-0">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">{degree}</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{graduationYear}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 flex-shrink-0 ${getStatusColor(edu.status)}`}>
                  <span className="material-symbols-outlined text-[14px]">{getStatusIcon(edu.status)}</span>
                </span>
                <span className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform flex-shrink-0 ${expandedId === eduId ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {expandedId === eduId && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg p-4 z-20 max-w-md mx-auto md:mx-0 md:min-w-[320px]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Degree</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">{degree}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Field of Study</p>
                      <p className="text-sm text-gray-900 dark:text-white">{fieldOfStudy}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Institute</p>
                      <p className="text-sm text-gray-900 dark:text-white">{institution}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-light dark:border-border-dark">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Graduation</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{graduationYear}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End Year</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{edu.end_year}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border-light dark:border-border-dark">
                    <span className={`text-xs px-3 py-1.5 rounded-md font-medium inline-flex items-center gap-1.5 ${getStatusColor(edu.status)}`}>
                      <span className="material-symbols-outlined text-[14px]">{getStatusIcon(edu.status)}</span>
                      {String(edu.status || '').toLowerCase() === 'pursuing' ? 'Currently Pursuing' : edu.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EducationCard;