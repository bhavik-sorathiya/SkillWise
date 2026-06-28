// client/src/Onboarding.jsx
// Multi-step onboarding flow for new users after registration.
// Collects: preferred_roles, gender, experience, education, bio
// Calls PUT /api/profile then PATCH /api/profile/complete

import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { API_BASE_URL } from './services/api';

const EXPERIENCE_LEVELS = [
  { value: 'Fresher', label: 'Fresher', desc: '0–1 year, just starting out' },
  { value: 'Junior', label: 'Junior', desc: '1–3 years of experience' },
  { value: 'Mid-level', label: 'Mid-level', desc: '3–6 years of experience' },
  { value: 'Senior', label: 'Senior', desc: '6–10 years of experience' },
  { value: 'Lead', label: 'Lead / Principal', desc: '10+ years, leadership roles' },
  { value: 'Executive', label: 'Executive', desc: 'Director / VP / C-Suite' }
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: 'man' },
  { value: 'female', label: 'Female', icon: 'woman' },
  { value: 'non_binary', label: 'Non-binary', icon: 'person' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: 'privacy_tip' }
];

const SUGGESTED_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Engineer',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Product Manager',
  'UX Designer', 'Software Architect', 'Android Developer',
  'iOS Developer', 'Cloud Engineer', 'QA Engineer', 'Data Analyst'
];

const TOTAL_STEPS = 5;
const MAX_ROLES = 3;

const DEMO_PROFILE = {
  preferred_roles: ['Frontend Developer', 'UI Engineer'],
  gender: 'non_binary',
  experience_level: 'Junior',
  years_of_experience: '2',
  education: 'Bachelor of Engineering in Computer Science',
  bio: 'I like building polished user experiences and learning from real interview feedback.',
};

const Onboarding = ({ onComplete, onNavigateToLogin }) => {
  const { user, logout, updateUserInContext } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    preferred_roles: [],
    roleInput: '',
    gender: '',
    experience_level: '',
    years_of_experience: '',
    education: '',
    bio: ''
  });

  const applyDemoProfile = () => {
    setError('');
    setForm(prev => ({
      ...prev,
      ...DEMO_PROFILE,
      roleInput: '',
    }));
  };

  // ── Step 1: Preferred Roles ────────────────────────────────────────────────
  const addRole = (role) => {
    const trimmed = role.trim();
    if (!trimmed) return;
    if (form.preferred_roles.length >= MAX_ROLES) return;
    if (form.preferred_roles.includes(trimmed)) return;
    setForm(f => ({ ...f, preferred_roles: [...f.preferred_roles, trimmed], roleInput: '' }));
  };

  const removeRole = (role) => {
    setForm(f => ({ ...f, preferred_roles: f.preferred_roles.filter(r => r !== role) }));
  };

  // ── Submit all data ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (form.preferred_roles.length === 0) {
      setError('Please choose at least one preferred role');
      setLoading(false);
      return;
    }

    if (!form.gender) {
      setError('Please select a gender option');
      setLoading(false);
      return;
    }

    if (!form.experience_level) {
      setError('Please select your experience level');
      setLoading(false);
      return;
    }

    if (form.years_of_experience && (Number.isNaN(Number(form.years_of_experience)) || Number(form.years_of_experience) < 0 || Number(form.years_of_experience) > 60)) {
      setError('Years of experience must be between 0 and 60');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      // PUT /api/profile — save all profile fields
      const profileRes = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          preferred_roles: form.preferred_roles,
          gender: form.gender || undefined,
          experience_level: form.experience_level || undefined,
          years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : undefined,
          education: form.education || undefined,
          bio: form.bio || undefined
        })
      });

      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err.error || err.message || 'Failed to save profile');
      }

      // PATCH /api/profile/complete — mark onboarding done
      const completeRes = await fetch(`${API_BASE_URL}/profile/complete`, {
        method: 'PATCH',
        headers
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || err.message || 'Failed to complete onboarding');
      }

      // Update local user object to reflect profile_completed = true and gender
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.profile_completed = true;
      stored.gender = form.gender;
      localStorage.setItem('user', JSON.stringify(stored));
      updateUserInContext?.({ profile_completed: true, gender: form.gender });

      onComplete();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return form.preferred_roles.length > 0;
    if (step === 2) return !!form.gender;
    if (step === 3) return !!form.experience_level;
    if (step === 4) return true; // education optional
    return true; // bio optional
  };

  const handleNext = () => {
    setError('');

    if (step === 1 && form.preferred_roles.length === 0) {
      setError('Pick at least one role to continue');
      return;
    }

    if (step === 2 && !form.gender) {
      setError('Please choose one option to continue');
      return;
    }

    if (step === 3) {
      if (!form.experience_level) {
        setError('Please select an experience level');
        return;
      }

      if (form.years_of_experience && (Number.isNaN(Number(form.years_of_experience)) || Number(form.years_of_experience) < 0 || Number(form.years_of_experience) > 60)) {
        setError('Years of experience must be between 0 and 60');
        return;
      }
    }

    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleSubmit();
  };

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-white flex flex-col items-center justify-center p-4 transition-colors duration-300">
      {loading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-3xl animate-pulse">cloud_sync</span>
            </div>
            <h2 className="text-lg font-bold text-text-main dark:text-white">Saving your profile</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please wait while we store your onboarding details and prepare your dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-2xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
            </svg>
          </div>
          <span className="font-bold text-xl text-text-main dark:text-white">SkillWise</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={applyDemoProfile}
            className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-2 text-sm font-medium text-text-main dark:text-white hover:border-primary/40 hover:text-primary transition-colors"
          >
            Use demo details
          </button>
          <button
            onClick={() => { logout(); onNavigateToLogin?.(); }}
            className="text-sm text-gray-500 hover:text-text-main dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl overflow-hidden shadow-2xl">

        {/* Progress bar */}
        <div className="h-1 bg-border-light dark:bg-border-dark">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-5 sm:p-10">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          {/* Welcome message */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main dark:text-white mb-2">
              {step === 1 && `Welcome, ${user?.full_name || user?.name || 'there'}! 👋`}
              {step === 2 && 'Tell us a bit about yourself'}
              {step === 3 && "What's your experience level?"}
              {step === 4 && 'Your educational background'}
              {step === 5 && 'Almost done!'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {step === 1 && "Which roles are you targeting? We'll tailor your experience."}
              {step === 2 && 'This helps us personalize your dashboard.'}
              {step === 3 && 'Help us understand where you are in your career.'}
              {step === 4 && 'Optional — tell us about your education.'}
              {step === 5 && 'Add a short bio to complete your profile.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 1: Preferred Roles ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.roleInput}
                  onChange={e => setForm(f => ({ ...f, roleInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRole(form.roleInput); } }}
                  placeholder="Type a role and press Enter..."
                  className="flex-1 bg-background-light dark:bg-background-dark text-text-main dark:text-white placeholder-gray-400 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={form.preferred_roles.length >= MAX_ROLES}
                />
                <button
                  type="button"
                  onClick={() => addRole(form.roleInput)}
                  disabled={!form.roleInput.trim() || form.preferred_roles.length >= MAX_ROLES}
                  className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Add
                </button>
              </div>

              {/* Selected roles */}
              {form.preferred_roles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.preferred_roles.map(role => (
                    <span
                      key={role}
                      className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {role}
                      <button onClick={() => removeRole(role)} className="text-primary hover:text-primary-hover transition-colors">
                        <span className="material-icons-round text-sm">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {MAX_ROLES - form.preferred_roles.length} more role{form.preferred_roles.length !== MAX_ROLES - 1 ? 's' : ''} allowed
              </p>

              {/* Suggestions */}
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 uppercase tracking-wider">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_ROLES.filter(r => !form.preferred_roles.includes(r)).slice(0, 10).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => addRole(role)}
                      disabled={form.preferred_roles.length >= MAX_ROLES}
                      className="text-sm text-text-secondary dark:text-gray-300 bg-background-light dark:bg-background-dark hover:bg-primary/10 hover:text-primary border border-border-light dark:border-border-dark hover:border-primary/30 px-3 py-1.5 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Gender ── */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, gender: opt.value }))}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    form.gender === opt.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-main dark:text-white hover:border-primary/30'
                  }`}
                >
                  <span className="material-icons-round text-[22px]">{opt.icon}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── STEP 3: Experience ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, experience_level: lvl.value }))}
                    className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
                      form.experience_level === lvl.value
                        ? 'bg-primary/10 border-primary'
                        : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark hover:border-primary/30'
                    }`}
                  >
                    <span className={`font-semibold ${form.experience_level === lvl.value ? 'text-primary' : 'text-text-main dark:text-white'}`}>
                      {lvl.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lvl.desc}</span>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-main dark:text-white">Years of experience <span className="text-gray-500 dark:text-gray-400">(optional)</span></label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.years_of_experience}
                  onChange={e => setForm(f => ({ ...f, years_of_experience: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-full bg-background-light dark:bg-background-dark text-text-main dark:text-white placeholder-gray-400 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {/* ── STEP 4: Education ── */}
          {step === 4 && (
            <div className="space-y-4">
              <input
                type="text"
                value={form.education}
                onChange={e => setForm(f => ({ ...f, education: e.target.value }))}
                placeholder="e.g. Bachelor of Engineering in Computer Science"
                className="w-full bg-background-light dark:bg-background-dark text-text-main dark:text-white placeholder-gray-400 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-gray-500 dark:text-gray-400 text-xs">You can skip this step if you prefer</p>
            </div>
          )}

          {/* ── STEP 5: Bio ── */}
          {step === 5 && (
            <div className="space-y-4">
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us a little about yourself, your goals, or what you're looking for..."
                rows={5}
                className="w-full bg-background-light dark:bg-background-dark text-text-main dark:text-white placeholder-gray-400 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <p className="text-gray-500 dark:text-gray-400 text-xs">Optional — you can always update this later</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-8 gap-4 sm:gap-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-text-main dark:text-gray-400 dark:hover:text-white transition-colors font-medium w-full sm:w-auto p-2"
              >
                <span className="material-icons-round text-[18px]">arrow_back</span>
                Back
              </button>
            ) : <div className="hidden sm:block" />}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : step === TOTAL_STEPS ? (
                <>Complete Setup<span className="material-icons-round text-[18px]">check</span></>
              ) : (
                <>Continue<span className="material-icons-round text-[18px]">arrow_forward</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-2 mt-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i + 1 === step ? 'bg-primary w-6' : i + 1 < step ? 'bg-primary/40' : 'bg-border-light dark:bg-border-dark'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Onboarding;
