// client/src/components/InterviewHistory.jsx
// Interview history workspace with sortable sessions, detail modal, and full analysis drill-down.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import InterviewAnalysisPage from './InterviewAnalysisPage';

/**
 * Interview History Component
 * Displays list of past interview sessions for the current user
 * Allows viewing detailed results for each interview
 */
export default function InterviewHistory() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const { addError } = useError();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewingAnalysis, setViewingAnalysis] = useState(false);

  // Only fetch when auth is ready and token is available
  useEffect(() => {
    if (!authLoading && token && isAuthenticated) {
      fetchInterviews();
    } else if (!authLoading && (!token || !isAuthenticated)) {
      setLoading(false);
      setError('Not authenticated');
    }
  }, [sortBy, sortOrder, token, isAuthenticated, authLoading]);

  // Loads paginated interview sessions for the authenticated user.
  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: 10,
        offset: 0,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      const response = await fetch(
        `http://localhost:3000/api/interviews?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch interviews: ${response.statusText}`);
      }

      const data = await response.json();
      setInterviews(data.data || []);
    } catch (err) {
      console.error('[Interview History] Fetch error:', err);
      const errorMessage = err.message || 'Failed to load interview history';
      setError(errorMessage);
      addError(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Loads a single session with question-level evaluation and stored AI analysis JSON.
  const fetchSessionDetail = async (sessionId) => {
    try {
      setDetailLoading(true);
      setDetailData(null);

      const response = await fetch(
        `http://localhost:3000/api/interviews/session/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch interview detail: ${response.statusText}`);
      }

      const data = await response.json();
      setDetailData(data.data);
    } catch (err) {
      console.error('[Interview History] Detail fetch error:', err);
      const errorMessage = err.message || 'Failed to load interview details';
      setError(errorMessage);
      addError(errorMessage, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Opens the summary modal and triggers detail fetch for the clicked session.
  const handleViewDetail = (sessionId) => {
    setSelectedSession(sessionId);
    fetchSessionDetail(sessionId);
  };

  const handleCloseDetail = () => {
    setSelectedSession(null);
    setDetailData(null);
  };

  const getVerdictColor = (verdict) => {
    if (!verdict) return 'gray';
    if (verdict.includes('YES')) return 'green';
    if (verdict.includes('MAYBE') || verdict.includes('LEANING')) return 'yellow';
    return 'red';
  };

  // Detail Modal
  if (selectedSession && detailData) {
    // If viewing full analysis, show the dedicated page
    if (viewingAnalysis && detailData?.analysis) {
      return (
        <InterviewAnalysisPage
          analysis={detailData.analysis}
          interview={{
            role: detailData.role,
            date: detailData.date,
            stats: detailData.stats,
            score: detailData.score,
            verdict: detailData.verdict,
            questions: detailData.questions,
            confidence_series: detailData.confidence_series
          }}
          onBack={() => setViewingAnalysis(false)}
        />
      );
    }

    // Otherwise show summary modal
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-light dark:border-border-dark">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-700 text-white p-6 flex justify-between items-center rounded-t-3xl">
            <div>
              <h2 className="text-2xl font-bold">{detailData.role}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {new Date(detailData.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={handleCloseDetail}
              className="text-3xl font-bold hover:bg-white/20 p-2 rounded-xl transition"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Overall Score and Verdict */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 p-6 rounded-2xl border border-blue-200 dark:border-blue-700">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Overall Score</p>
                <p className="text-4xl font-bold text-primary mt-3">{detailData.score}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">/100</p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/40 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-700">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Verdict</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
                  {detailData.verdict?.replace(/_/g, ' ') || 'N/A'}
                </p>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-background-light dark:bg-background-dark p-6 rounded-2xl border border-border-light dark:border-border-dark">
              <h3 className="font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">assessment</span>
                Performance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Questions</p>
                  <p className="text-2xl font-bold text-primary">{detailData.stats?.total_questions || 0}</p>
                </div>
                <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Good</p>
                  <p className="text-2xl font-bold text-emerald-600">{detailData.stats?.good_answers || 0}</p>
                </div>
                <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Average</p>
                  <p className="text-2xl font-bold text-amber-600">{detailData.stats?.average_answers || 0}</p>
                </div>
                <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Weak</p>
                  <p className="text-2xl font-bold text-red-600">{detailData.stats?.weak_answers || 0}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCloseDetail}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition"
              >
                Close
              </button>
              {detailData.analysis && (
                <button
                  onClick={() => setViewingAnalysis(true)}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">analytics</span>
                  View Full Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white">
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">history</span>
            <h1 className="text-3xl md:text-4xl font-bold">Interview History</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Review your past mock interviews and performance results</p>
        </div>

        {/* Sort Controls */}
        <div className="mb-6 bg-surface-light dark:bg-surface-dark p-4 md:p-6 rounded-2xl border border-border-light dark:border-border-dark flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-main dark:text-white"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-main dark:text-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-400 font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              Error
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-color-600 dark:text-gray-400">Loading interview history...</p>
          </div>
        ) : interviews.length === 0 ? (
          /* Empty State */
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-12 text-center border border-border-light dark:border-border-dark">
            <span className="material-symbols-outlined text-5xl text-gray-400 mx-auto block mb-4">videocam</span>
            <p className="text-text-main dark:text-white text-lg font-semibold">No interviews yet</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Start a new mock interview to see your history here</p>
          </div>
        ) : (
          /* Interviews List */
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview.session_id}
                onClick={() => handleViewDetail(interview.session_id)}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm hover:shadow-lg hover:border-primary/50 transition-all p-6 cursor-pointer border border-border-light dark:border-border-dark group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-text-main dark:text-white group-hover:text-primary transition">{interview.role}</h3>
                      <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition">arrow_forward</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {new Date(interview.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <span className="material-symbols-outlined text-sm">help</span>
                        {interview.questions_asked} questions
                      </div>
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined text-sm">close</span>
                        {interview.weak_answers} weak
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4 min-w-fit">
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Score</p>
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="27" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
                          <circle
                            cx="30"
                            cy="30"
                            r="27"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-primary transition-all"
                            strokeDasharray={`${(interview.score / 100) * 169.6} 169.6`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-lg font-bold text-primary">{interview.score}</span>
                      </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                      interview.verdict?.includes('YES') 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : interview.verdict?.includes('LEANING') || interview.verdict?.includes('MAYBE')
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {interview.verdict?.replace(/_/g, ' ') || 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
