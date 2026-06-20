// client/src/Landing.jsx
// Public marketing page with entry navigation for auth and demos.

import React from 'react';
import { useComingSoon } from './context/ComingSoonContext';
import './Landing.css';

const Landing = ({
  onNavigateToLogin, onNavigateToDashboard, onNavigateToResume, onNavigateToSignup,
  onNavigateToDeveloper, onNavigateToHelp, onNavigateToTerms, onNavigateToPricing
}) => {
  const { openComingSoon } = useComingSoon();

  const handleComingSoon = (event, title, message) => {
    event.preventDefault();
    openComingSoon({ title, message });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-body transition-colors duration-300 overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center cursor-pointer" onClick={() => window.location.href = '/'}>
              <span className="material-icons-round text-primary text-4xl mr-2 transform -rotate-12">school</span>
              <span className="font-display font-bold text-2xl tracking-tight text-gray-900 dark:text-white">SkillWise</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={onNavigateToDeveloper}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
              >
                Know Developer
              </button>
              <button
                onClick={onNavigateToHelp}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
              >
                Help Center
              </button>
              <button
                onClick={onNavigateToTerms}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
              >
                Terms & Policy
              </button>
              <button
                onClick={onNavigateToPricing}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
              >
                Pricing
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={onNavigateToLogin} className="hidden md:block text-sm font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">Sign in</button>
              <button 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onNavigateToLogin();
                  } else {
                    onNavigateToSignup();
                  }
                }} 
                className="bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/30"
              >
                <span className="md:hidden">Login</span>
                <span className="hidden md:inline">Get started</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="hidden lg:block absolute top-20 left-10 xl:left-32 w-48 h-32 bg-[#FFD700] rounded-xl shadow-soft transform -rotate-12 z-0 border-4 border-white dark:border-gray-800">
            <div className="p-4 h-full flex flex-col justify-between">
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-white">description</span>
              </div>
              <div className="h-2 w-24 bg-white/30 rounded"></div>
            </div>
          </div>

          <div className="hidden lg:block absolute top-60 left-20 xl:left-48 w-40 h-40 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl transform rotate-6 z-20 border border-gray-100 dark:border-gray-700">
            <div className="p-4 flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full mb-3 overflow-hidden">
                <span className="material-icons-round text-gray-400 text-5xl">smart_toy</span>
              </div>
              <div className="h-2 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          <div className="hidden lg:block absolute top-24 right-10 xl:right-32 w-56 h-24 bg-surface-light dark:bg-surface-dark rounded-full shadow-soft transform rotate-6 z-10 border border-gray-100 dark:border-gray-700 flex items-center px-4 justify-between">
            <div className="w-12 h-12 bg-green-500 rounded-full shadow-inner border-4 border-white dark:border-gray-700 flex items-center justify-center text-white font-bold">95%</div>
            <div className="flex-1 ml-4 text-left">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Match Rating</div>
              <div className="font-bold text-sm text-gray-800 dark:text-white">Excellent Fit</div>
            </div>
          </div>

          <div className="hidden lg:block absolute top-64 right-24 xl:right-56 w-32 h-32 bg-primary rounded-2xl shadow-lg transform -rotate-6 z-20 flex items-center justify-center border-4 border-white dark:border-gray-800">
            <span className="material-icons-round text-white text-5xl">auto_awesome</span>
          </div>

          <h1 className="font-display font-black text-6xl md:text-7xl lg:text-8xl tracking-tighter leading-[1.1] mb-8 relative z-30">
            Interview & <br className="hidden md:block" />
            Resume Intelligence <br className="hidden md:block" />
            <span className="text-primary inline-block transform hover:scale-105 transition-transform duration-300">powered by AI</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed relative z-30">
            Analyze your resume, identify skill gaps, and practice with real-time text-based AI mock interviews to land your dream role.
          </p>

          <div className="mt-10 relative z-30 inline-block group">
            <button onClick={onNavigateToSignup} className="relative bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-5 rounded-xl font-bold text-lg shadow-2xl transition-transform transform group-hover:-translate-y-1 overflow-hidden w-64">
              <span className="relative z-10">Get started</span>
              <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-primary rotate-45 transform group-hover:scale-150 transition-transform duration-500"></div>
            </button>
          </div>

          <div className="mt-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 relative z-30">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-6">Built for professional growth</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              <span className="font-display font-bold text-xl text-gray-400 dark:text-gray-500">RESUME ANALYSIS</span>
              <span className="font-display font-bold text-xl text-gray-400 dark:text-gray-500">TEXT CHAT INTERVIEWS</span>
              <span className="font-display font-bold text-xl text-gray-400 dark:text-gray-500">SKILL MAPPING</span>
              <span className="font-display font-bold text-xl text-gray-400 dark:text-gray-500">SWOT METRICS</span>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-surface-light dark:bg-surface-dark py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="material-icons-round mr-2 text-primary">build</span>
              Quick Navigation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Jump directly to dashboard services:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigateToDashboard?.()}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all group"
              >
                <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">home</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Workspace Dashboard</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Home dashboard</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateToResume?.()}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all group"
              >
                <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">description</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Resume & Skills</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SWOT & Analysis</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTo?.()}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all group"
              >
                <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">login</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Login</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sign in page</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-surface-dark transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">Supercharge your career prep</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">AI-powered tools built to give you deep insights and preparation confidence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-background-light dark:bg-background-dark hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-2xl h-full flex flex-col">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-blue-600 dark:text-blue-400 text-3xl">analytics</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">AI Resume SWOT</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Extract structural SWOT insights, identify skill gaps, and get optimization advice matching your target role.</p>
            </div>

            <div className="p-8 rounded-3xl bg-background-light dark:bg-background-dark hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-2xl h-full flex flex-col">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-primary text-3xl">forum</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">Text-Based Interview Simulator</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Simulate real-world technical and behavioral mock interviews via interactive text-based chat, generated and adapted on the fly.</p>
            </div>

            <div className="p-8 rounded-3xl bg-background-light dark:bg-background-dark hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-2xl h-full flex flex-col">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-purple-600 dark:text-purple-400 text-3xl">auto_awesome</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">Detailed Performance Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Access granular question-by-question evaluations, detailed scores, and actionable feedback metrics.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background-light dark:bg-background-dark overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">Workflow</span>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-6">Level up your confidence in three steps.</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                Our platform removes the friction of mock practice. Upload, configure, and review your performance instantly.
              </p>

              <div className="space-y-6">
                {[
                  { num: 1, title: "Upload & Select Target Role", desc: "Define target job profiles to align and customize SWOT resume grading." },
                  { num: 2, title: "Start Text-Based Session", desc: "Answer questions curated by our intelligent AI interviewer via interactive real-time text chat." },
                  { num: 3, title: "Analyze Performance Insights", desc: "View detailed question-wise metrics and correct weak areas." }
                ].map((step) => (
                  <div key={step.num} className="flex items-start">
                    <div className={`flex-shrink-0 w-8 h-8 ${step.num === 1 ? 'bg-white dark:bg-gray-700 border-2 border-primary text-primary' : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-500'} rounded-full flex items-center justify-center font-bold mr-4`}>
                      {step.num}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{step.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2 relative">
              <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 transform md:rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs font-mono text-gray-400">mock_interview_eval.js</div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3 space-y-3">
                    <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                  <div className="w-2/3 bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400">
                    <p>&gt; Evaluating answer feedback...</p>
                    <p>&gt; Grading structural layout.</p>
                    <p className="text-white mt-2">{'stats: {'}</p>
                    <p className="text-white ml-4">{'  score: 92,'}</p>
                    <p className="text-white ml-4">{'  confidence: "High"'}</p>
                    <p className="text-white">{'}'}</p>
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-white px-4 py-2 rounded-lg shadow-lg flex items-center animate-bounce">
                <span className="material-icons-round text-sm mr-2">check_circle</span>
                <span className="font-bold text-sm">Rating: 92%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-4xl text-gray-900 dark:text-white">Tailored intelligence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative overflow-hidden group rounded-3xl bg-gray-50 dark:bg-gray-800 p-8 md:p-12 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8"></div>
              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wide mb-6">For Resume SWOT</span>
              <h3 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Optimize your resume</h3>
              <ul className="space-y-4">
                {["Target role mapping alignment", "Personalized improvement checklist", "Skills parsing analytics"].map((benefit, idx) => (
                  <li key={idx} className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="material-icons-round text-blue-500 mr-3">done</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden group rounded-3xl bg-gray-50 dark:bg-gray-800 p-8 md:p-12 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8"></div>
              <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900 text-primary dark:text-orange-300 rounded-full text-xs font-bold uppercase tracking-wide mb-6">For Interview Confidence</span>
              <h3 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Succeed under pressure</h3>
              <ul className="space-y-4">
                {["Real-time interactive Q&A simulator", "Coaching metrics per response", "Actionable evaluation history"].map((benefit, idx) => (
                  <li key={idx} className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="material-icons-round text-primary mr-3">done</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 dark:bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600 blur-3xl rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-10 md:mb-0 md:w-1/2">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/10">
              <span className="material-icons-round text-green-400 text-sm">lock</span>
              <span className="text-sm font-medium">Privacy First Protection</span>
            </div>
            <h2 className="font-display font-bold text-4xl mb-4">Your data stays private.</h2>
            <p className="text-gray-400 text-lg max-w-md">Your resume uploads, analysis metrics, and interview transcripts are encrypted, private, and secured.</p>
          </div>

          <div className="md:w-1/2 flex justify-end">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="material-icons-round text-4xl text-primary mb-2">encrypted</span>
                <span className="font-bold">100% Encrypted</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="material-icons-round text-4xl text-blue-400 mb-2">security</span>
                <span className="font-bold">Safe & Private</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center col-span-2">
                <span className="text-3xl font-black tracking-tight mb-1">Zero Bias</span>
                <span className="text-sm text-gray-400">Objectively graded by AI models</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-background-light dark:bg-background-dark pt-16 pb-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2 lg:col-span-2">
              <div className="flex items-center mb-4">
                <span className="material-icons-round text-primary text-3xl mr-2 transform -rotate-12">school</span>
                <span className="font-display font-bold text-xl text-gray-900 dark:text-white">SkillWise</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                Optimize your professional profile, analyze skill alignment, and practice interviews with AI-based feedback.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/bhavik-sorathiya/skillwise"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors"
                  title="GitHub"
                >
                  <span className="font-bold text-xs">Git</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/bhaviksorathiya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors"
                  title="LinkedIn"
                >
                  <span className="font-bold text-xs">In</span>
                </a>
                <a
                  href="https://wa.me/917041933330?text=Hi%20Bhavik,%20I%20have%20some%20feedback%20regarding%20SkillWise!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors"
                  title="WhatsApp"
                >
                  <span className="font-bold text-xs">Wa</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">More about me & app</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                    onClick={(e) => { e.preventDefault(); onNavigateToDeveloper?.(); }}
                  >
                    Know Developer
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                    onClick={(e) => { e.preventDefault(); onNavigateToHelp?.(); }}
                  >
                    Help Center (FAQ)
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                    onClick={(e) => { e.preventDefault(); onNavigateToTerms?.(); }}
                  >
                    Terms & Policy
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Contact & Feedback</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <li className="flex items-center gap-2">
                  <span className="material-icons-round text-sm text-primary">mail</span>
                  <a
                    href="mailto:bhavik.sorathiya.dev@gmail.com?subject=Inquiry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    bhavik.sorathiya.dev@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons-round text-sm text-primary">chat</span>
                  <a
                    href="https://wa.me/917041933330?text=Hi%20Bhavik,%20I'd%20like%20to%20connect%20with%20you%20regarding%20SkillWise."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    +91 70419 33330
                  </a>
                </li>
              </ul>
              <a
                href="mailto:bhavik.sorathiya.dev@gmail.com?subject=SkillWise%20App%20Feedback&body=Hi%20Bhavik,%250D%250AI%2520wanted%2520to%2520share%2520some%2520feedback%2520about%2520SkillWise:%250D%250A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/10"
              >
                <span className="material-icons-round text-xs">rate_review</span>
                Send Feedback
              </a>
            </div>

          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-500">© 2026 SkillWise Inc. All rights reserved.</p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;