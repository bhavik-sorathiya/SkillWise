import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

const ApiKeyModal = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [apiSaving, setApiSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  if (!isOpen) return null;

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!apiKey || apiKey.startsWith('...')) {
      setApiError('Please enter a valid API key');
      return;
    }
    
    setApiSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profile/api-key`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to save API key');
      
      // Success
      setApiKey('');
      if (onSuccess) onSuccess();
      onClose();
    } catch(err) {
      setApiError(err.message);
    } finally {
      setApiSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-light dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border-light dark:border-border-dark">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-red-500/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
            <div>
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Action Required</h2>
              <p className="text-sm text-red-700 dark:text-red-300">Free daily limits reached or service busy</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-black/5 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-main dark:text-white mb-4">
            You've reached our generous free tier limit of 1 resume analysis and 1 interview per day, or our servers are currently too busy.
          </p>
          <p className="text-text-main dark:text-white mb-6 font-semibold">
            Good news! You can continue using SkillWise for free without limits by providing your own Gemini API Key from Google.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">help</span>
              How to get a free API Key
            </h4>
            <ol className="list-decimal list-inside text-sm text-text-secondary dark:text-gray-300 space-y-1.5">
              <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.</li>
              <li>Sign in with your Google account.</li>
              <li>Click <strong>"Create API Key"</strong>.</li>
              <li>Copy the generated key (it starts with <code className="bg-black/10 px-1 py-0.5 rounded">AIza...</code>).</li>
            </ol>
          </div>

          {apiError && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5">error</span>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSaveApiKey} className="space-y-4">
            <div>
              <label htmlFor="modal_api_key" className="block text-sm font-semibold text-text-main dark:text-white mb-2">
                Your Gemini API Key
              </label>
              <input 
                id="modal_api_key" 
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm" 
              />
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5 leading-relaxed">
              <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">lock</span>
              Disclaimer: Your API key is securely encrypted, never shared, and only used to fulfill your own requests on SkillWise.
            </p>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={apiSaving || apiKey.startsWith('...')}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {apiSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Verifying & Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
