// client/src/ProfilePage.jsx
// Full profile edit page — updates user_profiles (all fields) and users.full_name via separate API.

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { API_BASE_URL } from './services/api';
import MobileSidebarBackdrop from './components/MobileSidebarBackdrop';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

const EXPERIENCE_LEVELS = [
  { value: 'Fresher',    label: 'Fresher',    desc: '0–1 year' },
  { value: 'Junior',     label: 'Junior',     desc: '1–3 years' },
  { value: 'Mid-Level',  label: 'Mid-Level',  desc: '3–5 years' },
  { value: 'Senior',     label: 'Senior',     desc: '5–10 years' },
  { value: 'Lead',       label: 'Lead / Principal', desc: '10+ years' },
];

const GENDER_OPTIONS = [
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'non_binary',        label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const ProfilePage = ({
  onNavigateToLogin, onNavigateToLanding, onNavigateToHome,
  onNavigateToResume, onNavigateToMockInterview, onNavigateToInterviews,
  onNavigateToProfile, onNavigateToSettings, onLogout
}) => {
  const { token, isAuthenticated, logout, user, updateUserInContext } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [roleInput, setRoleInput] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    gender: '',
    preferred_roles: [],
    experience_level: '',
    years_of_experience: '',
    education: '',
  });

  const sidebarItems = [
    { key: 'home',         icon: 'home',        label: 'Home' },
    { key: 'resume',       icon: 'description', label: 'Resume' },
    { key: 'mock-interview', icon: 'smart_toy', label: 'Mock Interview' },
    { key: 'interviews',   icon: 'videocam',    label: 'Interviews' },
    { key: 'profile',      icon: 'person',      label: 'Profile', isActive: true },
    { key: 'settings',     icon: 'settings',    label: 'Settings' },
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

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!isAuthenticated || !token) { onNavigateToLogin(); return; }
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) { onNavigateToLogin(); return; }
        const data = await res.json();
        if (data.success) {
          const { user: u, profile: p } = data.data;
          setForm({
            full_name: u?.full_name || user?.full_name || '',
            bio: p?.bio || '',
            gender: p?.gender || '',
            preferred_roles: Array.isArray(p?.preferred_roles) ? p.preferred_roles : [],
            experience_level: p?.experience_level || '',
            years_of_experience: p?.years_of_experience != null ? String(p.years_of_experience) : '',
            education: p?.education || '',
          });
        }
      } catch(e) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token, isAuthenticated]);

  const addRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed) return;
    if (form.preferred_roles.length >= 3) { setError('Maximum 3 preferred roles'); return; }
    if (form.preferred_roles.includes(trimmed)) return;
    setForm(f => ({ ...f, preferred_roles: [...f.preferred_roles, trimmed] }));
    setRoleInput('');
  };

  const removeRole = (role) => setForm(f => ({ ...f, preferred_roles: f.preferred_roles.filter(r => r !== role) }));

  const handleSave = async () => {
    setError(''); setSuccess(''); setSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      // 1. Update full_name if changed
      const currentName = user?.full_name || user?.name || '';
      if (form.full_name.trim() && form.full_name.trim() !== currentName) {
        const nameRes = await fetch(`${API_BASE_URL}/auth/update-name`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ full_name: form.full_name.trim() })
        });
        const nameData = await nameRes.json();
        if (!nameRes.ok) throw new Error(nameData.message || 'Failed to update name');
        // Optionally update context if the method exists
        updateUserInContext?.({ full_name: form.full_name.trim(), name: form.full_name.trim() });
      }

      // 2. Update profile fields
      const profileRes = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT', headers,
        body: JSON.stringify({
          bio: form.bio || null,
          gender: form.gender || null,
          preferred_roles: form.preferred_roles,
          experience_level: form.experience_level || null,
          years_of_experience: form.years_of_experience !== '' ? Number(form.years_of_experience) : 0,
          education: form.education || null,
        })
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || 'Failed to update profile');

      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3500);
    } catch(e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const headerAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnvE6dtuVKhnW1CG7Ru8xLYWNZdR9yGwUzMbh1BuPP2rELZxbRZ5yS7AhQvk9zJeviK0mBKRSz8Rc8k8KDAT7u2AfT0060uk2OxG7XGB4uqdTIqd1lzCRRUzd2sgOQGVdXvhIUyFFBF0q_R3ESFNnd2WWgRCKQIWNsBHx69PgFWtSQ9G0C7R6HxM_6Ubjys3nsZpIq4xKgBFxoLicLN7JMLvbua5o_wOw-juJa4vCX__Zxk3qVxTKFBXnCEap7BR8WmUCWQaZyB0w';
  const displayName = user?.full_name || user?.name || 'User';
  const userProfile = { name: displayName, headerAvatar };

  const inputCls = 'w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm';
  const labelCls = 'block text-sm font-semibold text-text-main dark:text-white mb-2';

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-text-main dark:text-white">Edit Profile</h1>
                <p className="text-sm text-text-secondary dark:text-gray-400">Manage your personal information</p>
              </div>
            </div>

            {/* Success / Error */}
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">

              {/* Basic Info */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6">
                <h3 className="text-base font-bold text-text-main dark:text-white mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Your full name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Bio <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="Tell us a bit about yourself..." rows={3}
                      className={`${inputCls} resize-none`} maxLength={500} />
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDER_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, gender: f.gender === opt.value ? '' : opt.value }))}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            form.gender === opt.value
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-main dark:text-white hover:border-primary/50'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Info */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6">
                <h3 className="text-base font-bold text-text-main dark:text-white mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">work</span>
                  Career Information
                </h3>
                <div className="space-y-4">
                  {/* Preferred Roles */}
                  <div>
                    <label className={labelCls}>Preferred Roles <span className="text-gray-400 font-normal">(max 3)</span></label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={roleInput} onChange={e => setRoleInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRole(); }}}
                        placeholder="e.g. Frontend Developer" className={`${inputCls} flex-1`}
                        disabled={form.preferred_roles.length >= 3} />
                      <button type="button" onClick={addRole} disabled={form.preferred_roles.length >= 3}
                        className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Add
                      </button>
                    </div>
                    {form.preferred_roles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.preferred_roles.map(role => (
                          <span key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                            {role}
                            <button type="button" onClick={() => removeRole(role)}
                              className="text-primary/60 hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-xs" style={{ fontSize: 14 }}>close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className={labelCls}>Experience Level</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {EXPERIENCE_LEVELS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, experience_level: f.experience_level === opt.value ? '' : opt.value }))}
                          className={`px-3 py-2.5 rounded-xl border text-sm transition-all text-left ${
                            form.experience_level === opt.value
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark hover:border-primary/50'
                          }`}>
                          <p className="font-semibold">{opt.label}</p>
                          <p className={`text-xs mt-0.5 ${form.experience_level === opt.value ? 'text-white/70' : 'text-gray-400'}`}>{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className={labelCls}>Years of Experience</label>
                    <input type="number" min="0" max="60" value={form.years_of_experience}
                      onChange={e => setForm(f => ({ ...f, years_of_experience: e.target.value }))}
                      placeholder="e.g. 3" className={inputCls} />
                  </div>

                  {/* Education */}
                  <div>
                    <label className={labelCls}>Education</label>
                    <input type="text" value={form.education}
                      onChange={e => setForm(f => ({ ...f, education: e.target.value }))}
                      placeholder="e.g. B.Tech Computer Science" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                  : <><span className="material-symbols-outlined text-base">save</span>Save Changes</>
                }
              </button>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
