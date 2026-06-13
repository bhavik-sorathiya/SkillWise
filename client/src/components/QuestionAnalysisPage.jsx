// client/src/components/QuestionAnalysisPage.jsx
// Detailed question-by-question analysis page with smooth accordion toggles.

import React, { useState } from 'react';

const QuestionAnalysisPage = ({ interview, onBack }) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  if (!interview) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400">No interview data available</p>
          <button
            onClick={onBack}
            className="mt-4 px-5 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const { role, date, stats = {}, questions = [] } = interview;

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const getRatingBadge = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'good':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40';
      case 'average':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40';
      case 'weak':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800/40';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors mb-3"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Summary
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white tracking-tight">
              Question Wise Analysis
            </h1>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              Role: <span className="font-semibold text-text-main dark:text-white">{role || 'General'}</span>
              {date && ` • ${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex gap-2">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 py-2.5 rounded-2xl text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Qs</p>
              <p className="text-lg font-bold text-primary">{questions.length}</p>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 py-2.5 rounded-2xl text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Good</p>
              <p className="text-lg font-bold text-green-600">{stats.good_answers || 0}</p>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 py-2.5 rounded-2xl text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Weak</p>
              <p className="text-lg font-bold text-red-500">{stats.weak_answers || 0}</p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">quiz</span>
            <p className="text-text-secondary dark:text-gray-400">No question-wise evaluations found for this session.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestion === idx;
              const ratingClass = getRatingBadge(q.rating);
              
              return (
                <div
                  key={idx}
                  className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:border-primary/40"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleQuestion(idx)}
                    className="w-full flex items-start md:items-center justify-between p-5 text-left gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors focus:outline-none"
                  >
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        Q{q.number || idx + 1}
                      </div>
                      <p className="font-semibold text-text-main dark:text-white text-[15px] leading-snug pr-2">
                        {q.question}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {q.rating && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${ratingClass}`}>
                          {q.rating}
                        </span>
                      )}
                      {q.score !== undefined && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {q.score}/100
                        </span>
                      )}
                      <span
                        className={`material-symbols-outlined text-gray-400 transition-transform duration-300 text-[20px] ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                  </button>

                  {/* Accordion Body */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[800px] border-t border-border-light dark:border-border-dark' : 'max-h-0 overflow-hidden'
                    }`}
                  >
                    <div className="p-5 md:p-6 space-y-5 bg-background-light/40 dark:bg-background-dark/20 text-sm">
                      
                      {/* Your Answer */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-text-main dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-500">
                          <span className="material-symbols-outlined text-sm">forum</span>
                          Your Answer
                        </h4>
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark leading-relaxed text-gray-700 dark:text-gray-300">
                          {q.answer || <span className="italic text-gray-400">No answer recorded.</span>}
                        </div>
                      </div>

                      {/* AI Evaluation */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-text-main dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-500">
                          <span className="material-symbols-outlined text-sm">psychology</span>
                          AI Feedback & Analysis
                        </h4>
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 leading-relaxed text-text-main dark:text-text-main">
                          {q.feedback || <span className="italic text-gray-400">No feedback generated.</span>}
                        </div>
                      </div>

                      {/* Extras Row (Score, Confidence) */}
                      <div className="flex flex-wrap gap-4 pt-1">
                        {q.confidence !== undefined && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark">
                            <span className="material-symbols-outlined text-xs text-blue-500">thumb_up</span>
                            Confidence Score: <span className="text-text-main dark:text-white font-bold">{Math.round(q.confidence)}%</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default QuestionAnalysisPage;
