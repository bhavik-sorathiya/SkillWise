// client/src/components/InterviewAnalysisPage.jsx
// Dedicated interview analysis page with fixed-grid UX and confidence line chart

import React from 'react';

const InterviewAnalysisPage = ({ analysis, interview, onBack }) => {
  if (!analysis) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400">No analysis data available</p>
          <button
            onClick={onBack}
            className="mt-4 px-5 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg transition"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const {
    verdict,
    overall_score = 0,
    dimension_scores = {},
    strengths = [],
    weaknesses = [],
    key_observations = [],
    improvement_suggestions = [],
    confidence_trend = [],
    is_fallback = false
  } = analysis;

  const stats = interview?.stats || {};
  const questions = Array.isArray(interview?.questions) ? interview.questions : [];
  const serverConfidenceSeries = Array.isArray(interview?.confidence_series)
    ? interview.confidence_series
    : [];
  const fallbackQuestionCount = questions.length;
  const totalQuestions = stats.total_questions || fallbackQuestionCount || 0;

  // Normalizes confidence values that may arrive in either 0-1 or 0-100 scale.
  const normalizeConfidence = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric <= 1) return Math.max(0, Math.min(100, numeric * 100));
    return Math.max(0, Math.min(100, numeric));
  };

  // Always build confidence series for all questions in the session.
  const confidenceSeries = (() => {
    const trend = Array.isArray(confidence_trend) ? confidence_trend : [];
    const count = totalQuestions || Math.max(trend.length, questions.length);
    if (!count) return [];

    return Array.from({ length: count }, (_, index) => {
      const serverValue = normalizeConfidence(serverConfidenceSeries[index]);
      const questionValue = normalizeConfidence(questions[index]?.confidence);
      const trendValue = normalizeConfidence(trend[index]);
      if (serverConfidenceSeries[index] !== undefined && serverConfidenceSeries[index] !== null) {
        return serverValue;
      }
      if (questions[index]?.confidence !== undefined && questions[index]?.confidence !== null) {
        return questionValue;
      }
      if (trend[index] !== undefined && trend[index] !== null) {
        return trendValue;
      }
      return 0;
    });
  })();

  // Maps backend verdict enums to badge/text palettes used across summary cards.
  const getVerdictStyles = (v) => {
    switch (v) {
      case 'STRONG_YES':
        return { badge: 'bg-green-500 text-white', text: 'text-green-700 dark:text-green-300' };
      case 'LEANING_YES':
        return { badge: 'bg-emerald-500 text-white', text: 'text-emerald-700 dark:text-emerald-300' };
      case 'MAYBE':
        return { badge: 'bg-yellow-500 text-white', text: 'text-yellow-700 dark:text-yellow-300' };
      case 'LEANING_NO':
        return { badge: 'bg-orange-500 text-white', text: 'text-orange-700 dark:text-orange-300' };
      case 'STRONG_NO':
        return { badge: 'bg-red-500 text-white', text: 'text-red-700 dark:text-red-300' };
      default:
        return { badge: 'bg-gray-500 text-white', text: 'text-gray-700 dark:text-gray-300' };
    }
  };

  const verdictStyles = getVerdictStyles(verdict);

  const normalizedDimensions = Object.entries(dimension_scores)
    .filter(([key]) => key.toLowerCase() !== 'confidence') // Exclude confidence dimension
    .map(([key, value]) => {
      // Extract score value, ignoring any confidence data
      const scoreValue = typeof value === 'object' && value !== null && 'score' in value 
        ? value.score 
        : value;
      
      return {
        key,
        label: key
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: Math.max(0, Math.min(100, Number(scoreValue) || 0))
      };
    });

  const chartWidth = 460;
  const chartHeight = 190;
  const chartPadding = { top: 24, right: 24, bottom: 42, left: 44 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Converts index into X-axis coordinate, keeping single-point data centered.
  const pointToX = (index, count) => {
    if (count <= 1) return chartPadding.left + plotWidth / 2;
    return chartPadding.left + (index / (count - 1)) * plotWidth;
  };

  // Converts a 0-100 value into SVG Y coordinate (inverted axis).
  const pointToY = (value) => chartPadding.top + ((100 - value) / 100) * plotHeight;

  const chartPoints = confidenceSeries.map((value, index) => ({
    x: pointToX(index, confidenceSeries.length),
    y: pointToY(value),
    value
  }));

  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const yTicks = [0, 20, 40, 60, 80, 100];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="mb-8 rounded-2xl border border-border-light dark:border-border-dark bg-gradient-to-r from-primary/5 via-blue-500/5 to-indigo-500/10 dark:from-primary/10 dark:via-blue-500/10 dark:to-indigo-500/20 p-5 md:p-7">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            <div className="xl:col-span-4 bg-surface-light/80 dark:bg-surface-dark/70 border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-7">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back to History
            </button>

            <p className="mt-6 text-xs tracking-wide uppercase text-gray-500 dark:text-gray-400">Target Role</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold text-text-main dark:text-white leading-tight">
              {interview?.role || 'Interview Analysis'}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {interview?.date
                ? new Date(interview.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Date not available'}
            </p>

              {is_fallback && (
                <span className="inline-block mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                  Partial Evaluation
                </span>
              )}
            </div>

            <div className="xl:col-span-4 bg-surface-light/80 dark:bg-surface-dark/70 border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-7">
              <p className="text-xs tracking-wide uppercase text-gray-500 dark:text-gray-400 mb-4">Question And Score Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
                  <p className="text-2xl font-bold text-primary mt-1">{totalQuestions}</p>
                </div>
                <div className="rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Overall Score</p>
                  <p className="text-2xl font-bold text-primary mt-1">{Math.round(overall_score)}</p>
                </div>
                <div className="rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Good</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.good_answers || 0}</p>
                </div>
                <div className="rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Weak</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.weak_answers || 0}</p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 bg-surface-light/80 dark:bg-surface-dark/70 border border-border-light dark:border-border-dark rounded-2xl p-6 md:p-7 flex flex-col justify-between">
              <div>
                <p className="text-xs tracking-wide uppercase text-gray-500 dark:text-gray-400">Final Verdict</p>
                <div className={`inline-flex mt-3 px-4 py-2 rounded-xl text-sm font-bold ${verdictStyles.badge}`}>
                  {(verdict || 'UNKNOWN').replace(/_/g, ' ')}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs tracking-wide uppercase text-gray-500 dark:text-gray-400">Overall Score</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-5xl font-black text-text-main dark:text-white leading-none">{Math.round(overall_score)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 pb-1">/100</p>
                </div>
                <p className={`text-sm font-semibold mt-2 ${verdictStyles.text}`}>Interview readiness snapshot</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-12 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold">Confidence Trend</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">X: Asked Question (dynamic) | Y: Confidence Score</span>
                </div>

                {confidenceSeries.length > 1 ? (
                  <div className="w-full">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                      {yTicks.map((tick) => {
                        const y = pointToY(tick);
                        return (
                          <g key={`tick-${tick}`}>
                            <line
                              x1={chartPadding.left}
                              y1={y}
                              x2={chartWidth - chartPadding.right}
                              y2={y}
                              stroke="currentColor"
                              strokeOpacity="0.12"
                            />
                            <text x={10} y={y + 4} fontSize="11" fill="currentColor" opacity="0.6">
                              {tick}
                            </text>
                          </g>
                        );
                      })}

                      <line
                        x1={chartPadding.left}
                        y1={chartPadding.top}
                        x2={chartPadding.left}
                        y2={chartHeight - chartPadding.bottom}
                        stroke="currentColor"
                        strokeOpacity="0.35"
                      />
                      <line
                        x1={chartPadding.left}
                        y1={chartHeight - chartPadding.bottom}
                        x2={chartWidth - chartPadding.right}
                        y2={chartHeight - chartPadding.bottom}
                        stroke="currentColor"
                        strokeOpacity="0.35"
                      />

                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={polylinePoints}
                      />

                      {chartPoints.map((p, idx) => (
                        <g key={`point-${idx}`}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#2563eb" />
                          <text x={p.x} y={chartHeight - 12} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">
                            Q{idx + 1}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                ) : (
                  <div className="h-[160px] rounded-xl border border-dashed border-border-light dark:border-border-dark flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    Confidence points are not sufficient to draw a line chart yet.
                  </div>
                )}
              </div>

              <div className="lg:col-span-5">
                <h2 className="text-lg md:text-xl font-bold mb-4">Dimension Scores</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {normalizedDimensions.map((dimension) => (
                    <div key={dimension.key} className="rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-4">
                      <p className="text-sm font-semibold mb-2">{dimension.label}</p>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${dimension.value}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm font-bold text-primary">{dimension.value.toFixed(0)}/100</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-green-800 dark:text-green-300 mb-4">Strengths</h2>
            <div className="grid grid-cols-1 gap-3">
              {(strengths.length > 0 ? strengths : ['No strengths recorded']).map((item, idx) => (
                <div key={`strength-${idx}`} className="rounded-xl bg-white/80 dark:bg-black/20 border border-green-100 dark:border-green-800 p-4 flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-sm md:text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-2xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-orange-800 dark:text-orange-300 mb-4">Areas For Improvement</h2>
            <div className="grid grid-cols-1 gap-3">
              {(weaknesses.length > 0 ? weaknesses : ['No weaknesses recorded']).map((item, idx) => (
                <div key={`weakness-${idx}`} className="rounded-xl bg-white/80 dark:bg-black/20 border border-orange-100 dark:border-orange-800 p-4 flex gap-3">
                  <span className="text-orange-600 font-bold">•</span>
                  <p className="text-sm md:text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">Key Observations</h2>
            <div className="grid grid-cols-1 gap-3">
              {(key_observations.length > 0 ? key_observations : ['No observations recorded']).map((item, idx) => (
                <div key={`observation-${idx}`} className="rounded-xl bg-white/80 dark:bg-black/20 border border-blue-100 dark:border-blue-800 p-4">
                  <p className="text-sm md:text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-2xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-violet-800 dark:text-violet-300 mb-4">Improvement Suggestions</h2>
            <div className="grid grid-cols-1 gap-3">
              {(improvement_suggestions.length > 0 ? improvement_suggestions : ['No suggestions recorded']).map((item, idx) => (
                <div key={`suggestion-${idx}`} className="rounded-xl bg-white/80 dark:bg-black/20 border border-violet-100 dark:border-violet-800 p-4">
                  <p className="text-sm md:text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewAnalysisPage;
