// client/src/SettingsPage.jsx
// Settings page — change password, account info, danger zone.

import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { API_BASE_URL } from './services/api';
import MobileSidebarBackdrop from './components/MobileSidebarBackdrop';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { getUserAvatar } from './utils/avatar';

const SettingsPage = ({
  onNavigateToLogin, onNavigateToLanding, onNavigateToHome,
  onNavigateToResume, onNavigateToMockInterview, onNavigateToInterviews,
  onNavigateToProfile, onNavigateToSettings, onLogout, onNavigateToHelp,
  onBack
}) => {
  const { token, isAuthenticated, logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwVisible, setPwVisible] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState(null);
  const [apiSaving, setApiSaving] = useState(false);
  const [apiSuccess, setApiSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  React.useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profile/api-key`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setApiKeyStatus(data.data);
          if (data.data.hasApiKey && data.data.maskedKey) {
            setApiKey(data.data.maskedKey);
          }
        }
      } catch (err) {
        console.error('Failed to fetch API key status', err);
      }
    };
    if (token) fetchApiKey();
  }, [token]);

  const sidebarItems = [
    { key: 'home',           icon: 'home',        label: 'Home' },
    { key: 'resume',         icon: 'description', label: 'Resume' },
    { key: 'mock-interview', icon: 'smart_toy',   label: 'Mock Interview' },
    { key: 'interviews',     icon: 'videocam',    label: 'Interviews' },
  ];

  const handleSidebarNavigate = (key) => {
    const map = {
      home: onNavigateToHome, resume: onNavigateToResume,
      'mock-interview': onNavigateToMockInterview, interviews: onNavigateToInterviews,
    };
    map[key]?.();
  };

  const handleLogout = async () => {
    try {
      if (token) await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch(e) {} finally { logout(); onLogout?.(); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');

    if (!pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password) {
      setPwError('All fields are required'); return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!passwordRegex.test(pwForm.new_password)) {
      setPwError('New password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match'); return;
    }
    if (pwForm.current_password === pwForm.new_password) {
      setPwError('New password must be different from current password'); return;
    }

    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to change password');
      setPwSuccess('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    } catch(err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setApiError(''); setApiSuccess('');
    
    if (!apiKey || apiKey.startsWith('...')) {
      setApiError('Please enter a valid API key'); return;
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
      setApiSuccess('API key verified and saved successfully!');
      
      setApiKeyStatus({ hasApiKey: true, isValid: true, maskedKey: `...${apiKey.slice(-4)}` });
      setApiKey(`...${apiKey.slice(-4)}`);
      setTimeout(() => setApiSuccess(''), 4000);
    } catch(err) {
      setApiError(err.message);
    } finally {
      setApiSaving(false);
    }
  };

  const headerAvatar = getUserAvatar(user?.gender);
  const displayName = user?.full_name || user?.name || 'User';
  const userProfile = { name: displayName, headerAvatar };

  const inputCls = 'w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm pr-12';
  const labelCls = 'block text-sm font-semibold text-text-main dark:text-white mb-2';

  // Password strength meter
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { level: 3, label: 'Fair', color: 'bg-yellow-500' };
    return { level: 5, label: 'Strong', color: 'bg-green-500' };
  };
  const strength = getPasswordStrength(pwForm.new_password);

  // Removed nested PasswordInput component definition

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white flex overflow-hidden">
      <MobileSidebarBackdrop isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Sidebar
        items={sidebarItems}
        isOpen={isSidebarOpen}
        onNavigate={handleSidebarNavigate}
        onNavigateToSettings={onNavigateToSettings}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isProfileMenuOpen={isProfileMenuOpen}
          onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          onNavigateToLogin={onNavigateToLogin}
          onNavigateToLanding={onNavigateToLanding}
          onNavigateToHome={onNavigateToHome}
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToSettings={onNavigateToSettings}
          onLogout={handleLogout}
          onNavigateToHelp={onNavigateToHelp}
          userProfile={userProfile}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => onBack ? onBack() : onNavigateToHome?.()}
                className="p-2 rounded-xl border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-main dark:text-white">Settings</h1>
                <p className="text-sm text-text-secondary dark:text-gray-400">Manage your account settings</p>
              </div>
            </div>

            <div className="space-y-6">

              {/* Account Info */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6">
                <h3 className="text-base font-bold text-text-main dark:text-white mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_circle</span>
                  Account Information
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Name',      value: displayName },
                    { label: 'Email',     value: user?.email || '—' },
                    { label: 'Account',   value: 'Free Plan' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-border-light dark:border-border-dark last:border-0">
                      <span className="text-sm text-text-secondary dark:text-gray-400">{label}</span>
                      <span className="text-sm font-semibold text-text-main dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => onNavigateToProfile?.()}
                  className="mt-4 flex items-center gap-2 px-4 py-2 border border-border-light dark:border-border-dark rounded-xl text-sm font-medium hover:bg-background-light dark:hover:bg-background-dark hover:border-primary/30 hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Profile
                </button>
              </div>

              {/* API Key Settings */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6">
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-base font-bold text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">key</span>
                    Custom Gemini API Key
                  </h3>
                  {apiKeyStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      apiKeyStatus.isValid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {apiKeyStatus.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-5">
                  Provide your own Gemini API key to bypass the daily limit of 1 free resume analysis and 1 free interview per day.
                </p>

                {apiSuccess && (
                  <div className="mb-5 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{apiSuccess}</p>
                  </div>
                )}
                {apiError && (
                  <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{apiError}</p>
                  </div>
                )}

                <form onSubmit={handleSaveApiKey} className="space-y-4">
                  <div>
                    <label htmlFor="api_key" className={labelCls}>Gemini API Key</label>
                    <div className="relative flex gap-3">
                      <input id="api_key" type="text"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className={inputCls} />
                      <button type="submit" disabled={apiSaving || apiKey.startsWith('...')}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-50 flex items-center gap-2">
                        {apiSaving ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : 'Save'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Change Password */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6">
                <h3 className="text-base font-bold text-text-main dark:text-white mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">lock</span>
                  Change Password
                </h3>

                {pwSuccess && (
                  <div className="mb-5 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{pwSuccess}</p>
                  </div>
                )}
                {pwError && (
                  <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{pwError}</p>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label htmlFor="current_password" className={labelCls}>Current Password</label>
                    <div className="relative">
                      <input id="current_password" type={pwVisible.current ? 'text' : 'password'}
                        value={pwForm.current_password}
                        onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                        placeholder="Enter current password"
                        className={inputCls} autoComplete="current-password" />
                      <button type="button" tabIndex={-1}
                        onClick={() => setPwVisible(v => ({ ...v, current: !v.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm" style={{ fontSize: 18 }}>
                          {pwVisible.current ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new_password" className={labelCls}>New Password</label>
                    <div className="relative">
                      <input id="new_password" type={pwVisible.new ? 'text' : 'password'}
                        value={pwForm.new_password}
                        onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                        placeholder="Enter new password (min 6 chars)"
                        className={inputCls} autoComplete="new-password" />
                      <button type="button" tabIndex={-1}
                        onClick={() => setPwVisible(v => ({ ...v, new: !v.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm" style={{ fontSize: 18 }}>
                          {pwVisible.new ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Strength meter */}
                  {pwForm.new_password && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${i <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        strength.level <= 1 ? 'text-red-500' : strength.level <= 3 ? 'text-yellow-500' : 'text-green-500'
                      }`}>Password strength: {strength.label}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="confirm_password" className={labelCls}>Confirm New Password</label>
                    <div className="relative">
                      <input id="confirm_password" type={pwVisible.confirm ? 'text' : 'password'}
                        value={pwForm.confirm_password}
                        onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                        placeholder="Re-enter new password"
                        className={inputCls} autoComplete="new-password" />
                      <button type="button" tabIndex={-1}
                        onClick={() => setPwVisible(v => ({ ...v, confirm: !v.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm" style={{ fontSize: 18 }}>
                          {pwVisible.confirm ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Match indicator */}
                  {pwForm.confirm_password && (
                    <p className={`text-xs font-medium flex items-center gap-1.5 ${
                      pwForm.new_password === pwForm.confirm_password ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {pwForm.new_password === pwForm.confirm_password ? 'check_circle' : 'cancel'}
                      </span>
                      {pwForm.new_password === pwForm.confirm_password ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}

                  <button type="submit" disabled={pwSaving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-2">
                    {pwSaving
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Changing…</>
                      : <><span className="material-symbols-outlined text-base">lock_reset</span>Change Password</>
                    }
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-red-500/20 p-6">
                <h3 className="text-base font-bold text-red-500 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span>
                  Danger Zone
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => alert('Account deletion is not yet available. Please contact support.')}
                  className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-500/10 transition-all">
                  <span className="material-symbols-outlined text-base">delete_forever</span>
                  Delete Account
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
