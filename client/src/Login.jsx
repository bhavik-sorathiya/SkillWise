// client/src/Login.jsx
// Login page for user authentication and session start.

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useComingSoon } from './context/ComingSoonContext';

const Login = ({ onBackToHome, onNavigateToSignup, onNavigateToDashboard, onNavigateToOnboarding }) => {
  const { login, isAuthenticated, user } = useAuth();
  const { openComingSoon } = useComingSoon();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already authenticated
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
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Call login from Auth Context
      const response = await login(email, password);
      
      console.log('Login successful:', response);
      
      // Check if user needs to complete onboarding
      const profileCompleted = response?.user?.profile_completed;

    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-light dark:border-border-dark px-6 lg:px-10 py-4 bg-surface-light dark:bg-surface-dark">
        <div 
          className="flex items-center gap-4 text-text-main dark:text-white cursor-pointer"
          onClick={onBackToHome}
        >
          <div className="size-8 text-primary flex items-center justify-center">
            <span className="material-icons-round text-[32px]">school</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">SkillWise</h2>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[480px]">
          <div className="bg-surface-light dark:bg-surface-dark shadow-xl rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
            <div className="px-6 py-8 sm:p-10">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-text-main dark:text-white">
                  Welcome back
                </h1>
                <p className="mt-2 text-base font-normal leading-normal text-text-secondary dark:text-gray-400">
                  Please enter your details to sign in.
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label 
                    className="block text-base font-medium leading-normal text-text-main dark:text-white" 
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-gray-400">
                      <span className="material-icons-round text-[20px]">mail</span>
                    </div>
                    <input
                      autoComplete="email"
                      className="block w-full pl-10 pr-3 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-main dark:text-white placeholder-text-secondary dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-base transition-colors h-12"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label 
                    className="block text-base font-medium leading-normal text-text-main dark:text-white" 
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-gray-400">
                      <span className="material-icons-round text-[20px]">lock</span>
                    </div>
                    <input
                      autoComplete="current-password"
                      className="block w-full pl-10 pr-10 py-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-main dark:text-white placeholder-text-secondary dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-base transition-colors h-12"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary dark:text-gray-400 hover:text-primary transition-colors cursor-pointer"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-icons-round text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary focus:ring-primary bg-background-light dark:bg-background-dark cursor-pointer"
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label 
                      className="ml-2 block text-sm text-text-secondary dark:text-gray-400 cursor-pointer" 
                      htmlFor="remember-me"
                    >
                      Remember me
                    </label>
                  </div>
                  <div className="text-sm">
                    <button
                      type="button"
                      className="font-medium text-primary hover:text-primary/80 transition-colors"
                      onClick={() => openComingSoon({ title: 'Password Reset', message: 'Password recovery is coming soon.' })}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary h-12 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E7E5E4] dark:border-[#44403C]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-surface-light dark:bg-surface-dark text-text-secondary dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                      className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-border-light dark:border-border-dark rounded-lg shadow-sm bg-surface-light dark:bg-surface-dark text-sm font-medium text-text-secondary dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                    type="button"
                    onClick={() => openComingSoon({ title: 'Google Sign-In', message: 'Google login is coming soon.' })}
                  >
                    <svg 
                      aria-hidden="true" 
                      className="h-5 w-5 mr-2" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path>
                    </svg>
                    Google
                  </button>
                  <button
                      className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-border-light dark:border-border-dark rounded-lg shadow-sm bg-surface-light dark:bg-surface-dark text-sm font-medium text-text-secondary dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                    type="button"
                    onClick={() => openComingSoon({ title: 'LinkedIn Sign-In', message: 'LinkedIn login is coming soon.' })}
                  >
                    <svg 
                      aria-hidden="true" 
                      className="h-5 w-5 mr-2" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        clipRule="evenodd" 
                        d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" 
                        fillRule="evenodd"
                      />
                    </svg>
                    LinkedIn
                  </button>
                </div>

                <div className="mt-8 text-center">
                    <span className="text-sm text-text-secondary dark:text-gray-400">
                    Don't have an account?
                  </span>
                  <button 
                    className="text-sm font-bold text-primary hover:underline ml-1" 
                    onClick={onNavigateToSignup}
                    type="button"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </div>

              <div className="px-6 py-4 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark flex flex-col items-center justify-center gap-2">
              <div className="flex items-center text-xs text-text-secondary dark:text-gray-400 gap-1">
                <span className="material-icons-round text-[14px]">lock</span>
                <span>Secure login • Privacy protected</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;