// client/src/Signup.jsx
// User registration page for interviewee/interviewer accounts.

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useComingSoon } from './context/ComingSoonContext';
import { GoogleLogin } from '@react-oauth/google';

const Signup = ({ onBackToHome, onNavigateToLogin, onNavigateToOnboarding, onNavigateToDashboard }) => {
  const { signup, login, googleLogin, isAuthenticated, user } = useAuth();
  const { openComingSoon } = useComingSoon();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: 'interviewee',
    fullName: '',
    email: '',
    password: ''
  });

  // Redirect to dashboard/onboarding if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.profile_completed === false) {
        onNavigateToOnboarding?.();
        return;
      }
      onNavigateToDashboard?.();
    }
  }, [isAuthenticated, user, onNavigateToDashboard, onNavigateToOnboarding]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (formData.fullName.trim().length < 2) {
        setError('Full name must be at least 2 characters');
        setLoading(false);
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError('Password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
        setLoading(false);
        return;
      }

      // Call signup from Auth Context
      const emailLower = formData.email.trim().toLowerCase();
      const response = await signup(formData.fullName.trim(), emailLower, formData.password);
      console.log('Signup successful:', response);

      await login(emailLower, formData.password);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main font-display antialiased overflow-x-hidden min-h-screen flex flex-col">
      <header className="w-full border-b border-solid border-border-light bg-white dark:bg-background-dark dark:border-gray-800 px-4 py-3 lg:px-10">
        <div className="flex items-center justify-between max-w-[960px] mx-auto">
          <div 
            className="flex items-center gap-4 text-text-main dark:text-white cursor-pointer"
            onClick={onBackToHome}
          >
            <div className="size-8 text-orange-500">
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"></path>
              </svg>
            </div>
            <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">SkillWise</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 flex justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-[560px] flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center sm:text-left p-2">
            <h1 className="text-text-main dark:text-white tracking-tight text-3xl sm:text-[32px] font-bold leading-tight">
              Create your account
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">
              Join the platform to practice text-based mock interviews and level up your skills.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-red-600 dark:text-red-400 text-xl">error</span>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form 
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border-light dark:border-gray-700 p-6 sm:p-8"
          >

            <div className="flex flex-col gap-5">
              <label className="flex flex-col w-full">
                <span className="text-text-main dark:text-white text-sm font-medium leading-normal pb-2">
                  Full Name
                </span>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-main dark:text-white dark:bg-gray-900 border border-border-light dark:border-gray-600 focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 placeholder:text-text-secondary p-4 text-base font-normal leading-normal transition-all"
                  placeholder="Jane Doe"
                  required
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </label>

              <label className="flex flex-col w-full">
                <span className="text-text-main dark:text-white text-sm font-medium leading-normal pb-2">
                  Email Address
                </span>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-main dark:text-white dark:bg-gray-900 border border-border-light dark:border-gray-600 focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 placeholder:text-text-secondary p-4 text-base font-normal leading-normal transition-all"
                  placeholder="jane@example.com"
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </label>

              <label className="flex flex-col w-full relative">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-text-main dark:text-white text-sm font-medium leading-normal">
                    Password
                  </span>
                </div>
                <div className="relative">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-main dark:text-white dark:bg-gray-900 border border-border-light dark:border-gray-600 focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 placeholder:text-text-secondary p-4 text-base font-normal leading-normal transition-all pr-12"
                    placeholder="Min 8 characters"
                    required
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-icons-round text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>
            </div>

            <button
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-orange-500 text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-orange-600 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <span className="truncate">Create Account</span>
              )}
            </button>

            <div className="mt-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E7E5E4] dark:border-[#44403C]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-400">
                    Or sign up with
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError('Google login failed');
                  }}
                  useOneTap
                  theme="filled_blue"
                  shape="pill"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-2">
              <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">
                Already have an account?
              </p>
              <button
                type="button"
                className="text-primary text-sm font-medium leading-normal hover:underline hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                onClick={onNavigateToLogin}
              >
                Log in
              </button>
            </div>

            <p className="text-center text-xs text-text-secondary dark:text-gray-500 mt-2">
              By creating an account, you agree to our{' '}
              <a
                className="underline hover:text-text-main dark:hover:text-gray-300"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openComingSoon({ title: 'Terms of Service', message: 'Terms of Service are coming soon.' });
                }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                className="underline hover:text-text-main dark:hover:text-gray-300"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openComingSoon({ title: 'Privacy Policy', message: 'Privacy Policy is coming soon.' });
                }}
              >
                Privacy Policy
              </a>.
            </p>

          </form>
        </div>
      </main>
    </div>
  );
};

export default Signup;