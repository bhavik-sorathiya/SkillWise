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

const Onboarding = ({ onComplete, onNavigateToLogin }) => {
  const { user, logout } = useAuth();
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

  // ── Step 1: Preferred Roles ────────────────────────────────────────────────
  const addRole = (role) => {
    const trimmed = role.trim();
    if (!trimmed) return;
    if (form.preferred_roles.length >= 3) return;
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
        throw new Error(err.message || 'Failed to save profile');
      }

      // PATCH /api/profile/complete — mark onboarding done
      const completeRes = await fetch(`${API_BASE_URL}/profile/complete`, {
        method: 'PATCH',
        headers
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.message || 'Failed to complete onboarding');
      }

      // Update local user object to reflect profile_completed = true
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.profile_completed = true;
      localStorage.setItem('user', JSON.stringify(stored));

      onComplete();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return form.preferred_roles.length > 0;
    if (step === 2) return true; // gender optional
    if (step === 3) return !!form.experience_level;
    if (step === 4) return true; // education optional
    return true; // bio optional
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleSubmit();
  };

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">

      {/* Header */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 text-orange-400">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
            </svg>
          </div>
          <span className="text-white font-bold text-xl">SkillWise</span>
        </div>
        <button
          onClick={() => { logout(); onNavigateToLogin?.(); }}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Log out
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-8 sm:p-10">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          {/* Welcome message */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {step === 1 && `Welcome, ${user?.full_name || user?.name || 'there'}! 👋`}
              {step === 2 && 'Tell us a bit about yourself'}
              {step === 3 && "What's your experience level?"}
              {step === 4 && 'Your educational background'}
              {step === 5 && 'Almost done!'}
            </h1>
            <p className="text-slate-400">
              {step === 1 && "Which roles are you targeting? We'll tailor your experience."}
              {step === 2 && 'This helps us personalize your dashboard.'}
              {step === 3 && 'Help us understand where you are in your career.'}
              {step === 4 && 'Optional — tell us about your education.'}
              {step === 5 && 'Add a short bio to complete your profile.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
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
                  className="flex-1 bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30"
                  disabled={form.preferred_roles.length >= 3}
                />
                <button
                  type="button"
                  onClick={() => addRole(form.roleInput)}
                  disabled={!form.roleInput.trim() || form.preferred_roles.length >= 3}
                  className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
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
                      className="flex items-center gap-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {role}
                      <button onClick={() => removeRole(role)} className="text-orange-400 hover:text-white transition-colors">
                        <span className="material-icons-round text-sm">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-slate-500 text-xs">
                {3 - form.preferred_roles.length} more role{form.preferred_roles.length !== 2 ? 's' : ''} allowed
              </p>

              {/* Suggestions */}
              <div>
                <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_ROLES.filter(r => !form.preferred_roles.includes(r)).slice(0, 10).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => addRole(role)}
                      disabled={form.preferred_roles.length >= 3}
                      className="text-sm text-slate-300 bg-white/5 hover:bg-orange-500/20 hover:text-orange-300 border border-white/10 hover:border-orange-500/30 px-3 py-1.5 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="grid grid-cols-2 gap-3">
              {GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, gender: opt.value }))}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                    form.gender === opt.value
                      ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
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
                        ? 'bg-orange-500/20 border-orange-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className={`font-semibold ${form.experience_level === lvl.value ? 'text-orange-300' : 'text-white'}`}>
                      {lvl.label}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">{lvl.desc}</span>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Years of experience (optional)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.years_of_experience}
                  onChange={e => setForm(f => ({ ...f, years_of_experience: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-full bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30"
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
                className="w-full bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30"
              />
              <p className="text-slate-500 text-xs">You can skip this step if you prefer</p>
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
                className="w-full bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30 resize-none"
              />
              <p className="text-slate-500 text-xs">Optional — you can always update this later</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium"
              >
                <span className="material-icons-round text-[18px]">arrow_back</span>
                Back
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
              i + 1 === step ? 'bg-orange-400 w-6' : i + 1 < step ? 'bg-orange-400/40' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Onboarding;
