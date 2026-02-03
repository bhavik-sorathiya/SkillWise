import React, { useState } from 'react';
import { authAPI } from './services/api';

const Signup = ({ onBackToHome, onNavigateToLogin, onNavigateToCompanySignup }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: 'interviewee',
    fullName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.signup(formData);
      console.log('Signup successful:', response);
      
      // Show success message
      alert('Account created successfully! Please login.');
      
      // Navigate to login
      onNavigateToLogin();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
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
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-[560px] flex flex-col gap-6">
          {/* Page Title */}
          <div className="flex flex-col gap-2 text-center sm:text-left p-2">
            <h1 className="text-text-main dark:text-white tracking-tight text-3xl sm:text-[32px] font-bold leading-tight">
              Create your account
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">
              Join the platform to practice, interview, and hire top talent.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-red-600 dark:text-red-400 text-xl">error</span>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form 
            onSubmit={handleSubmit}
            className="flex flex-col gap-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border-light dark:border-gray-700 p-6 sm:p-8"
          >
            {/* Role Selection */}
            <div className="flex flex-col gap-4">
              <span className="text-text-main dark:text-white text-base font-semibold leading-normal">
                First, tell us who you are
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Interviewee Option */}
                <label className="group cursor-pointer flex flex-col items-start gap-2 rounded-lg border border-solid border-border-light dark:border-gray-600 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 dark:has-[:checked]:bg-primary/10 has-[:checked]:shadow-sm">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary">
                      <span className="material-icons-round text-[24px]">person</span>
                    </div>
                    <input
                      checked={formData.role === 'interviewee'}
                      className="h-5 w-5 border-2 border-border-light bg-transparent text-primary checked:border-primary checked:hover:border-primary focus:outline-none focus:ring-0 focus:ring-offset-0 checked:focus:border-primary ml-auto cursor-pointer"
                      name="role"
                      type="radio"
                      value="interviewee"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex flex-col mt-2">
                    <p className="text-text-main dark:text-white text-base font-medium leading-normal">
                      Interviewee
                    </p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal mt-1">
                      I want to practice or get hired
                    </p>
                  </div>
                </label>

                {/* Interviewer Option */}
                <label className="group cursor-pointer flex flex-col items-start gap-2 rounded-lg border border-solid border-border-light dark:border-gray-600 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 dark:has-[:checked]:bg-primary/10 has-[:checked]:shadow-sm">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center size-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <span className="material-icons-round text-[24px]">work_history</span>
                    </div>
                    <input
                      checked={formData.role === 'interviewer'}
                      className="h-5 w-5 border-2 border-border-light bg-transparent text-primary checked:border-primary checked:hover:border-primary focus:outline-none focus:ring-0 focus:ring-offset-0 checked:focus:border-primary ml-auto cursor-pointer"
                      name="role"
                      type="radio"
                      value="interviewer"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex flex-col mt-2">
                    <p className="text-text-main dark:text-white text-base font-medium leading-normal">
                      Interviewer
                    </p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal mt-1">
                      I want to hire or conduct mocks
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border-light dark:bg-gray-700 w-full"></div>

            {/* Form Fields */}
            <div className="flex flex-col gap-5">
              {/* Full Name */}
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

              {/* Email Address */}
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

              {/* Password */}
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

            {/* Submit Button */}
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

            {/* Login Link */}
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

            {/* Terms */}
            <p className="text-center text-xs text-text-secondary dark:text-gray-500 mt-2">
              By creating an account, you agree to our{' '}
              <a className="underline hover:text-text-main dark:hover:text-gray-300" href="#">
                Terms of Service
              </a>{' '}
              and{' '}
              <a className="underline hover:text-text-main dark:hover:text-gray-300" href="#">
                Privacy Policy
              </a>.
            </p>

            {/* Company Signup Link */}
            <div className="mt-6 pt-6 border-t border-border-light dark:border-gray-700">
              <p className="text-center text-sm text-text-secondary dark:text-gray-400">
                Want to hire talent?{' '}
                <button 
                  className="font-bold text-primary hover:underline" 
                  onClick={onNavigateToCompanySignup}
                  type="button"
                >
                  Create a company account
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Signup;
