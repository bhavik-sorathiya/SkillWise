// client/src/components/AnalysisCards.jsx
// Visual summary cards for ATS, experience, and education analysis output.

import React from 'react';
import { useComingSoon } from '../context/ComingSoonContext';
import EducationCard from './EducationCard';

/**
 * AnalysisCards
 * Summarizes ATS score, inferred experience, and education details from analysis payload.
 * @param {Object} props
 * @param {{score?:number, verdict?:string}} props.atsAnalysis
 * @param {{years_of_experience?:number, level?:string, progression?:Array<{position?:string,duration?:string}>}} props.experienceAnalysis
 * @param {Object|Array|null} props.education
 */
const AnalysisCards = ({ atsAnalysis, experienceAnalysis, education }) => {
  const { openComingSoon } = useComingSoon();

  // Handle null/undefined data with safe defaults
  const atsScore = atsAnalysis?.score || 0;
  const atsVerdict = atsAnalysis?.verdict || 'Good';
  const experienceYears = experienceAnalysis?.years_of_experience || 0;
  const experienceLevel = experienceAnalysis?.level || 'Entry';
  const experienceProgression = experienceAnalysis?.progression || [];

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile & Resume Analysis</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="relative size-32 mb-4">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100 dark:text-gray-800"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="85, 100"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">85%</span>
            </div>
          </div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completeness</h4>
          <button
            type="button"
            className="text-xs text-primary mt-2 font-medium hover:underline"
            onClick={() => openComingSoon({ title: 'Profile Details', message: 'Detailed insights are coming soon.' })}
          >
            View Details +
          </button>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">ATS Alignment</h4>
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-md font-bold">
              {atsVerdict.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{atsScore}</span>
            <span className="text-sm text-gray-400 mb-1.5">/ 100</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${atsScore}%` }}
            ></div>
          </div>
          <div className="mt-auto space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
              <span>Standard formatting</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="material-symbols-outlined text-[16px] text-yellow-500">warning</span>
              <span>Keyword density low</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Experience</h4>
          <div className="space-y-2">
            <div className="text-sm text-gray-900 dark:text-white font-medium">{experienceYears} Years</div>
            <div className="text-xs text-gray-500 mb-3">{experienceLevel} Level</div>
            <div className="space-y-2">
              {experienceProgression.map((job, index) => (
                <div key={`${job.position}-${index}`} className="text-xs">
                  <div className="text-gray-700 dark:text-gray-300 font-medium truncate">{job.position}</div>
                  <div className="text-gray-500">{job.duration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col relative">
          <EducationCard education={education} />
        </div>
      </div>
    </section>
  );
};

export default AnalysisCards;