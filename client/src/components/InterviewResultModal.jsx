// client/src/components/InterviewResultModal.jsx
// Displays detailed interview analysis with confidence graph and dimension scores

import React, { useState } from 'react';

const InterviewResultModal = ({ result, onClose, onViewResume }) => {
  const [expandedSection, setExpandedSection] = useState('overview');

  if (!result) return null;

  const {
    verdict,
    overall_score,
    dimension_scores = {},
    confidence_trend = [],
    strengths = [],
    weaknesses = [],
    key_observations = [],
    improvement_suggestions = [],
    is_fallback = false
  } = result;

  // Get verdict color and message
  const getVerdictColor = (v) => {
    switch (v) {
      case 'STRONG_YES':
        return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-500' };
      case 'LEANING_YES':
        return { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', badge: 'bg-emerald-500' };
      case 'MAYBE':
        return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-500' };
      case 'LEANING_NO':
        return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-500' };
      case 'STRONG_NO':
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', badge: 'bg-gray-500' };
    }
  };

  const colors = getVerdictColor(verdict);

  // Normalize dimension scores (convert to 0-100 if needed)
  const normalizedDimensions = Object.entries(dimension_scores).map(([key, value]) => ({
    name: key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value: Math.min(100, Math.max(0, value || 0)),
    key
  }));

  // Simple confidence graph using CSS bars
  const maxConfidence = Math.max(...confidence_trend, 1);
  const scaledTrend = confidence_trend.map(v => (v / maxConfidence) * 100);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className={`${colors.bg} ${colors.border} border-b-4 rounded-t-2xl p-8`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
            {is_fallback && (
              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full">
                Partial Evaluation
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <p className={`text-sm font-semibold ${colors.text} mb-2`}>FINAL VERDICT</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {verdict ? verdict.replace(/_/g, ' ') : 'UNKNOWN'}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">OVERALL SCORE</p>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={`var(--color-${verdict?.toLowerCase()})`}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(overall_score / 100) * 283} 283`}
                    strokeLinecap="round"
                    style={{
                      '--color-strong_yes': '#10b981',
                      '--color-leaning_yes': '#059669',
                      '--color-maybe': '#f59e0b',
                      '--color-leaning_no': '#f97316',
                      '--color-strong_no': '#ef4444'
                    }}
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-gray-800">{overall_score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-96 overflow-y-auto">
          {/* Dimension Scores */}
          <div className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => toggleSection('dimensions')}
              className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">📊</span> Dimension Scores
              </span>
              <span className="text-gray-400 text-xl">
                {expandedSection === 'dimensions' ? '−' : '+'}
              </span>
            </button>
            
            {expandedSection === 'dimensions' && (
              <div className="mt-4 space-y-4">
                {normalizedDimensions.map((dimension) => (
                  <div key={dimension.key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{dimension.name}</span>
                      <span className="text-sm font-bold text-gray-900">{dimension.value.toFixed(0)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          dimension.value >= 75
                            ? 'bg-green-500'
                            : dimension.value >= 50
                            ? 'bg-yellow-500'
                            : dimension.value >= 25
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${dimension.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confidence Trend */}
          {confidence_trend.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <button
                onClick={() => toggleSection('confidence')}
                className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">📈</span> Confidence Trend
                </span>
                <span className="text-gray-400 text-xl">
                  {expandedSection === 'confidence' ? '−' : '+'}
                </span>
              </button>
              
              {expandedSection === 'confidence' && (
                <div className="mt-4">
                  <div className="flex items-flex-end gap-1 h-32 bg-gray-50 p-4 rounded">
                    {scaledTrend.map((height, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`Question ${idx + 1}: ${(confidence_trend[idx] * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {confidence_trend.length} evaluations across your interview
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <button
                onClick={() => toggleSection('strengths')}
                className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">✅</span> Strengths ({strengths.length})
                </span>
                <span className="text-gray-400 text-xl">
                  {expandedSection === 'strengths' ? '−' : '+'}
                </span>
              </button>
              
              {expandedSection === 'strengths' && (
                <ul className="mt-4 space-y-2">
                  {strengths.map((strength, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700">
                      <span className="text-green-600 font-bold">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <button
                onClick={() => toggleSection('weaknesses')}
                className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span> Areas for Improvement ({weaknesses.length})
                </span>
                <span className="text-gray-400 text-xl">
                  {expandedSection === 'weaknesses' ? '−' : '+'}
                </span>
              </button>
              
              {expandedSection === 'weaknesses' && (
                <ul className="mt-4 space-y-2">
                  {weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700">
                      <span className="text-orange-600 font-bold">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Key Observations */}
          {key_observations.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <button
                onClick={() => toggleSection('observations')}
                className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">🔍</span> Key Observations ({key_observations.length})
                </span>
                <span className="text-gray-400 text-xl">
                  {expandedSection === 'observations' ? '−' : '+'}
                </span>
              </button>
              
              {expandedSection === 'observations' && (
                <ul className="mt-4 space-y-2">
                  {key_observations.map((obs, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Improvement Suggestions */}
          {improvement_suggestions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <button
                onClick={() => toggleSection('suggestions')}
                className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">💡</span> Improvement Suggestions ({improvement_suggestions.length})
                </span>
                <span className="text-gray-400 text-xl">
                  {expandedSection === 'suggestions' ? '−' : '+'}
                </span>
              </button>
              
              {expandedSection === 'suggestions' && (
                <ul className="mt-4 space-y-2">
                  {improvement_suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-4 justify-center md:justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold transition"
          >
            Back to Home
          </button>
          {onViewResume && (
            <button
              onClick={onViewResume}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              View My Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewResultModal;
