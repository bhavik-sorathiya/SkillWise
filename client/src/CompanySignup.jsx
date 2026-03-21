// client/src/CompanySignup.jsx
// Company onboarding form for recruiter/manager account creation.

import React, { useState } from 'react';
import { authAPI } from './services/api';
import { useComingSoon } from './context/ComingSoonContext';

const CompanySignup = ({ onBackToHome, onNavigateToLogin }) => {
  const { openComingSoon } = useComingSoon();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    managerName: '',
    managerEmail: '',
    managerRole: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Note: You'll need to create a company signup endpoint on backend
      // For now, this will use the regular signup with manager's details
      const response = await authAPI.signup({
        fullName: formData.managerName,
        email: formData.managerEmail,
        password: formData.password,
        role: 'company',
        companyData: formData
      });
      
      console.log('Company signup successful:', response);
      alert('Company account created successfully! Please login.');
      onNavigateToLogin();
    } catch (err) {
      setError(err.message || 'Company signup failed. Please try again.');
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
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col transition-colors duration-200">
      <header className="w-full bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={onBackToHome}
            >
              <div className="size-8 text-primary">
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"></path>
                </svg>
              </div>
              <span className="text-text-main dark:text-white text-xl font-bold tracking-tight">SkillWise</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-sm text-text-secondary dark:text-gray-400">Already have an account?</span>
              <button 
                onClick={onNavigateToLogin}
                className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-4xl flex flex-col gap-8">
          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-text-main dark:text-white text-3xl sm:text-4xl font-black tracking-tight">
              Create your Company Profile
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-lg">
              Start hiring the best talent today. Setup your admin account.
            </p>
          </div>

          <form 
            onSubmit={handleSubmit}
            className="bg-surface-light dark:bg-surface-dark shadow-sm border border-border-light dark:border-border-dark rounded-xl p-6 sm:p-10 space-y-10"
          >
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <span className="material-icons-round text-xl">error</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border-light dark:border-border-dark pb-4">
                <span className="material-icons-round text-primary text-3xl">domain</span>
                <h2 className="text-text-main dark:text-white text-2xl font-bold">Company Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Company Name</span>
                  <input
                    autoFocus
                    className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                    placeholder="e.g. Acme Corp"
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Industry / Domain</span>
                  <div className="relative">
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none text-text-main dark:text-gray-200"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Industry</option>
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Retail</option>
                    </select>
                    <span className="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-xl">expand_more</span>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Company Size</span>
                  <div className="relative">
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none text-text-main dark:text-gray-200"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Size</option>
                      <option>1-10 employees</option>
                      <option>11-50 employees</option>
                      <option>51-200 employees</option>
                      <option>201-500 employees</option>
                      <option>500+ employees</option>
                    </select>
                    <span className="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-xl">expand_more</span>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Official Website</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary material-icons-round text-lg">language</span>
                    <input
                      className="w-full h-12 pl-11 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                      placeholder="www.acme.com"
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                </label>
              </div>

              <div className="pt-4 space-y-4">
                <h3 className="text-text-main dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-icons-round text-text-secondary text-xl">location_on</span>
                  Registered Address
                </h3>
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-text-main dark:text-gray-200 font-medium text-sm">Address Line 1</span>
                    <input
                      className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                      placeholder="Street address, P.O. box"
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-text-main dark:text-gray-200 font-medium text-sm">
                      Address Line 2 <span className="text-text-secondary font-normal">(Optional)</span>
                    </span>
                    <input
                      className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                    />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block space-y-2">
                      <span className="text-text-main dark:text-gray-200 font-medium text-sm">City</span>
                      <input
                        className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                        placeholder="City"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-text-main dark:text-gray-200 font-medium text-sm">State / Region</span>
                      <input
                        className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                        placeholder="State/Province/Region"
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block space-y-2">
                      <span className="text-text-main dark:text-gray-200 font-medium text-sm">Country</span>
                      <div className="relative">
                        <select
                          className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none text-text-main dark:text-gray-200"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Country</option>
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Canada</option>
                          <option>Germany</option>
                          <option>India</option>
                          <option>Australia</option>
                        </select>
                        <span className="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-xl">expand_more</span>
                      </div>
                    </label>
                    <label className="block space-y-2">
                      <span className="text-text-main dark:text-gray-200 font-medium text-sm">Postal / ZIP Code</span>
                      <input
                        className="w-full h-12 px-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                        placeholder="ZIP or Postal Code"
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-3 border-b border-border-light dark:border-border-dark pb-4">
                <span className="material-icons-round text-primary text-3xl">badge</span>
                <h2 className="text-text-main dark:text-white text-2xl font-bold">Primary Manager Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Full Name</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary material-icons-round text-lg">person</span>
                    <input
                      className="w-full h-12 pl-11 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                      placeholder="John Doe"
                      type="text"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleInputChange}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Work Email</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary material-icons-round text-lg">mail</span>
                    <input
                      className="w-full h-12 pl-11 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                      placeholder="john@company.com"
                      type="email"
                      name="managerEmail"
                      value={formData.managerEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Role / Designation</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary material-icons-round text-lg">work</span>
                    <input
                      className="w-full h-12 pl-11 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                      placeholder="e.g. HR Manager, Hiring Lead"
                      type="text"
                      name="managerRole"
                      value={formData.managerRole}
                      onChange={handleInputChange}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-text-main dark:text-gray-200 font-medium">Password</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary material-icons-round text-lg">lock</span>
                    <input
                      className="w-full h-12 pl-11 pr-12 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-secondary text-text-main dark:text-gray-200"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-icons-round text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <button
                  className="w-full md:w-auto md:min-w-[320px] h-14 bg-primary hover:bg-primary-hover text-surface-light text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      Create Company Account
                      <span className="material-icons-round">arrow_forward</span>
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 text-text-secondary bg-primary/5 px-4 py-2 rounded-full">
                  <span className="material-icons-round text-lg">group_add</span>
                  <p className="text-sm font-medium">You can add more managers later from your dashboard.</p>
                </div>
              </div>
              <p className="text-center text-xs text-text-secondary max-w-lg mx-auto leading-relaxed">
                By clicking "Create Company Account", you agree to our{' '}
                <a
                  className="underline hover:text-primary"
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
                  className="underline hover:text-primary"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openComingSoon({ title: 'Privacy Policy', message: 'Privacy Policy is coming soon.' });
                  }}
                >
                  Privacy Policy
                </a>.
                We may send you account related emails.
              </p>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-text-secondary">security</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-text-secondary">verified_user</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-text-secondary">lock</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">TLS Encryption</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanySignup;