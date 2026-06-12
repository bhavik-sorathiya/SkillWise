// client/src/SettingsPage.jsx
// Settings page — change password, account info, danger zone.

import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { API_BASE_URL } from './services/api';
import MobileSidebarBackdrop from './components/MobileSidebarBackdrop';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

const SettingsPage = ({
  onNavigateToLogin, onNavigateToLanding, onNavigateToHome,
  onNavigateToResume, onNavigateToMockInterview, onNavigateToInterviews,
  onNavigateToProfile, onNavigateToSettings, onLogout
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

  const sidebarItems = [
    { key: 'home',           icon: 'home',        label: 'Home' },
    { key: 'resume',         icon: 'description', label: 'Resume' },
    { key: 'mock-interview', icon: 'smart_toy',   label: 'Mock Interview' },
    { key: 'interviews',     icon: 'videocam',    label: 'Interviews' },
    { key: 'profile',        icon: 'person',      label: 'Profile' },
    { key: 'settings',       icon: 'settings',    label: 'Settings', isActive: true },
  ];

  const handleSidebarNavigate = (key) => {
    const map = {
      home: onNavigateToHome, resume: onNavigateToResume,
      'mock-interview': onNavigateToMockInterview, interviews: onNavigateToInterviews,
      profile: onNavigateToProfile, settings: onNavigateToSettings,
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
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters'); return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match'); return;
    }

    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      setPwSuccess('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    } catch(err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const headerAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnvE6dtuVKhnW1CG7Ru8xLYWNZdR9yGwUzMbh1BuPP2rELZxbRZ5yS7AhQvk9zJeviK0mBKRSz8Rc8k8KDAT7u2AfT0060uk2OxG7XGB4uqdTIqd1lzCRRUzd2sgOQGVdXvhIUyFFBF0q_R3ESFNnd2WWgRCKQIWNsBHx69PgFWtSQ9G0C7R6HxM_6Ubjys3nsZpIq4xKgBFxoLicLN7JMLvbua5o_wOw-juJa4vCX__Zxk3qVxTKFBXnCEap7BR8WmUCWQaZyB0w';
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

  const PasswordInput = ({ id, value, onChange, placeholder, showKey, label }) => (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <div className="relative">
        <input id={id} type={pwVisible[showKey] ? 'text' : 'password'}
          value={value} onChange={onChange} placeholder={placeholder}
          className={inputCls} autoComplete={showKey === 'current' ? 'current-password' : 'new-password'} />
        <button type="button" tabIndex={-1}
          onClick={() => setPwVisible(v => ({ ...v, [showKey]: !v[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm" style={{ fontSize: 18 }}>
            {pwVisible[showKey] ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-main dark:text-white flex overflow-hidden">
      <MobileSidebarBackdrop isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Sidebar items={sidebarItems} isOpen={isSidebarOpen} onNavigate={handleSidebarNavigate} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isProfileMenuOpen={isProfileMenuOpen}
          onProfileMenuToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          onNavigateToLogin={onNavigateToLogin}
          onNavigateToLanding={onNavigateToLanding}
          onNavigateToHome={onNavigateToHome}
          onLogout={handleLogout}
          userProfile={userProfile}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => onNavigateToHome?.()}
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
                  <PasswordInput id="current_password" showKey="current" label="Current Password"
                    value={pwForm.current_password} placeholder="Enter current password"
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} />

                  <PasswordInput id="new_password" showKey="new" label="New Password"
                    value={pwForm.new_password} placeholder="Enter new password (min 6 chars)"
                    onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />

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

                  <PasswordInput id="confirm_password" showKey="confirm" label="Confirm New Password"
                    value={pwForm.confirm_password} placeholder="Re-enter new password"
                    onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} />

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
