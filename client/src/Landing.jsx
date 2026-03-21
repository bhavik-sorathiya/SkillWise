// client/src/Landing.jsx
// Public marketing page with entry navigation for auth and demos.

import React from 'react';
import { useComingSoon } from './context/ComingSoonContext';
import './Landing.css';

const Landing = ({ onNavigateToLogin, onNavigateToDashboard, onNavigateToResume, onNavigateToSignup, onNavigateToCompanySignup }) => {
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
              <a
                href="#"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors flex items-center"
                onClick={(e) => handleComingSoon(e, 'Solutions', 'Solution details are coming soon.')}
              >
                Solutions <span className="material-icons-round text-sm ml-1">expand_more</span>
              </a>
              <a
                href="#"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors flex items-center"
                onClick={(e) => handleComingSoon(e, 'Product', 'Product details are coming soon.')}
              >
                Product <span className="material-icons-round text-sm ml-1">expand_more</span>
              </a>
              <a
                href="#"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                onClick={(e) => handleComingSoon(e, 'Resources', 'Resources are coming soon.')}
              >
                Resources
              </a>
              <a
                href="#"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                onClick={(e) => handleComingSoon(e, 'Pricing', 'Pricing details are coming soon.')}
              >
                Pricing
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={onNavigateToLogin} className="hidden md:block text-sm font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">Sign in</button>
              <button onClick={onNavigateToSignup} className="bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/30">
                Get started
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
                <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQaUq7T2Hfptt2-CywaXBdkeJqA3Sc4AS4VoV1-Cnqg_60rfWSrLct9G-moQuGqkLEiIFdYsa31jf_LFLSktZTn-DZrPOzbCKtllVK4YhUy37NgcHaElMsgIZIXeYXw0Tx0CSicLIuKtMFe87h6XM7En3xjsZEhk7sguuVLElyVsI0EctyM8hOSMkrv70hJtVFG1ZzXmUW-Zj9k0DAZ1Ti0_p1mtVCelo-rzBSD8HKiTX2ayaCx8KAnifu16eSF-N6SBUpydEFXsU" />
              </div>
              <div className="h-2 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          <div className="hidden lg:block absolute top-24 right-10 xl:right-32 w-56 h-24 bg-surface-light dark:bg-surface-dark rounded-full shadow-soft transform rotate-6 z-10 border border-gray-100 dark:border-gray-700 flex items-center px-4 justify-between">
            <div className="w-16 h-16 bg-green-500 rounded-full shadow-inner border-4 border-white dark:border-gray-700"></div>
            <div className="flex-1 ml-4">
              <div className="text-xs font-bold text-gray-400 uppercase">Status</div>
              <div className="font-bold text-gray-800 dark:text-white">Hired</div>
            </div>
          </div>

          <div className="hidden lg:block absolute top-64 right-24 xl:right-56 w-32 h-32 bg-[#3B82F6] rounded-2xl shadow-lg transform -rotate-6 z-20 flex items-center justify-center border-4 border-white dark:border-gray-800">
            <span className="material-icons-round text-white text-5xl">verified_user</span>
          </div>

          <h1 className="font-display font-black text-6xl md:text-7xl lg:text-8xl tracking-tighter leading-[1.1] mb-8 relative z-30">
            Interviews <br className="hidden md:block" />
            that feel <br className="hidden md:block" />
            <span className="text-primary inline-block transform hover:scale-105 transition-transform duration-300">effortless</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed relative z-30">
            Designed for modern hiring experiences that feel seamless from the first screening to the final offer letter.
          </p>

          <div className="mt-10 relative z-30 inline-block group">
            <button onClick={onNavigateToCompanySignup} className="relative bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-5 rounded-xl font-bold text-lg shadow-2xl transition-transform transform group-hover:-translate-y-1 overflow-hidden w-64">
              <span className="relative z-10">Start interviewing</span>
              <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-primary rotate-45 transform group-hover:scale-150 transition-transform duration-500"></div>
            </button>
          </div>

          <div className="mt-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 relative z-30">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-6">Trusted by modern teams</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              <span className="font-display font-bold text-2xl text-gray-400 dark:text-gray-500">ACME<span className="text-primary">.corp</span></span>
              <span className="font-display font-black text-2xl italic text-gray-400 dark:text-gray-500">Globex</span>
              <span className="font-display font-semibold text-2xl text-gray-400 dark:text-gray-500 tracking-tighter">Soylent</span>
              <span className="font-display font-bold text-2xl text-gray-400 dark:text-gray-500 flex items-center"><span className="w-4 h-4 rounded-full bg-gray-400 mr-1"></span> Umbrellla</span>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-surface-light dark:bg-surface-dark py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="material-icons-round mr-2 text-primary">build</span>
              Testing Pages
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Click below to test different pages and features:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigateToDashboard?.()}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all group"
              >
                <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">home</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Interviewee Dashboard</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Home page</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateToResume?.()}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all group"
              >
                <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">description</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Resume & Skills</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Upload & analyze</p>
                </div>
              </button>

              <button
                onClick={() => onNavigateToLogin?.()}
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
            <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">Everything you need to hire</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">Platform tools designed to simplify the chaotic interview process.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-background-light dark:bg-background-dark hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-2xl h-full flex flex-col">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-blue-600 dark:text-blue-400 text-3xl">videocam</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">HD Video Interviews</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Crystal clear video calls with built-in recording and transcription so you never miss a detail.</p>
            </div>

            <div className="p-8 rounded-3xl bg-background-light dark:bg-background-dark hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-2xl h-full flex flex-col">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-primary text-3xl">code</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">Live Coding Sandbox</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Collaborative coding environment supporting 40+ languages with real-time execution.</p>
            </div>

            <div className="p-8 rounded-3xl bg-background-light dark:bg-background-dark hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-2xl h-full flex flex-col">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-purple-600 dark:text-purple-400 text-3xl">auto_awesome</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">AI Summaries</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">Let AI take notes for you. Get concise candidate scorecards immediately after the call.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background-light dark:bg-background-dark overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">Workflow</span>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-6">From applicant to employee in record time.</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                Our platform removes the friction. Automate scheduling, centralize feedback, and make decisions faster.
              </p>

              <div className="space-y-6">
                {[
                  { num: 1, title: "Create a role", desc: "Define skills and import from your ATS." },
                  { num: 2, title: "Invite candidates", desc: "Send magic links for scheduling." },
                  { num: 3, title: "Interview & Score", desc: "Collaborative hiring with zero bias." }
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
                  <div className="text-xs font-mono text-gray-400">interview_session.js</div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3 space-y-3">
                    <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                  <div className="w-2/3 bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400">
                    <p>&gt; Initializing environment...</p>
                    <p>&gt; Candidate joined session.</p>
                    <p className="text-white mt-2">{'function solveProblem(input) {'}</p>
                    <p className="text-white ml-4">{'  return input.filter(x => x > 0);'}</p>
                    <p className="text-white">{'}'}</p>
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-white px-4 py-2 rounded-lg shadow-lg flex items-center animate-bounce">
                <span className="material-icons-round text-sm mr-2">check_circle</span>
                <span className="font-bold text-sm">Hired!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-4xl text-gray-900 dark:text-white">Benefits for everyone</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative overflow-hidden group rounded-3xl bg-gray-50 dark:bg-gray-800 p-8 md:p-12 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8"></div>
              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wide mb-6">For Candidates</span>
              <h3 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Showcase your real skills</h3>
              <ul className="space-y-4">
                {["Use your own IDE setup", "Fair, standardized grading", "Instant feedback loops"].map((benefit, idx) => (
                  <li key={idx} className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="material-icons-round text-blue-500 mr-3">done</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden group rounded-3xl bg-gray-50 dark:bg-gray-800 p-8 md:p-12 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8"></div>
              <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900 text-primary dark:text-orange-300 rounded-full text-xs font-bold uppercase tracking-wide mb-6">For Recruiters</span>
              <h3 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Close roles 50% faster</h3>
              <ul className="space-y-4">
                {["Automated scheduling sync", "Anti-cheating detection", "Centralized candidate data"].map((benefit, idx) => (
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
              <span className="text-sm font-medium">Enterprise Grade Security</span>
            </div>
            <h2 className="font-display font-bold text-4xl mb-4">Secure by default.</h2>
            <p className="text-gray-400 text-lg max-w-md">We comply with SOC2, GDPR, and CCPA standards to keep your candidate data safe and private.</p>
          </div>

          <div className="md:w-1/2 flex justify-end">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="material-icons-round text-4xl text-primary mb-2">shield</span>
                <span className="font-bold">SOC2 Type II</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="material-icons-round text-4xl text-blue-400 mb-2">public</span>
                <span className="font-bold">GDPR Compliant</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center col-span-2">
                <span className="text-3xl font-black tracking-tight mb-1">99.99%</span>
                <span className="text-sm text-gray-400">Uptime SLA Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-background-light dark:bg-background-dark pt-16 pb-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center mb-4">
                <span className="material-icons-round text-primary text-3xl mr-2 transform -rotate-12">school</span>
                <span className="font-display font-bold text-xl text-gray-900 dark:text-white">SkillWise</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                Making the world's best engineering teams more efficient, one interview at a time.
              </p>
              <div className="flex space-x-4">
                {["Twitter", "LinkedIn", "Instagram"].map((social, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors"
                    onClick={(e) => handleComingSoon(e, social, `${social} links are coming soon.`)}
                  >
                    <span className="font-bold text-xs">{social.slice(0, 2).toLowerCase()}</span>
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "Platform", links: ["Live Coding", "Video Interview", "Take-home challenges", "Pricing"] },
              { title: "Company", links: ["About Us", "Careers", "Blog", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Security"] }
            ].map((column, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">{column.title}</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a
                        href="#"
                        className="hover:text-primary"
                        onClick={(e) => handleComingSoon(e, link, `${link} details are coming soon.`)}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-500">© 2023 SkillWise Inc. All rights reserved.</p>
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