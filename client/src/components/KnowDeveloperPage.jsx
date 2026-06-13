import React from 'react';

const KnowDeveloperPage = ({ onBack }) => {
  const emailDraftUrl = "mailto:bhavik.sorathiya.dev@gmail.com?subject=SkillWise%20App%20Feedback&body=Hi%20Bhavik,%20I%20wanted%20to%20connect%20with%20you%20regarding%20SkillWise!";
  const whatsappUrl = "https://wa.me/917041933330?text=Hi%20Bhavik,%20I%20just%20saw%20your%20awesome%20SkillWise%20app!";
  const linkedinUrl = "https://www.linkedin.com/in/bhaviksorathiya";
  const githubUrl = "https://github.com/bhavik-sorathiya/skillwise";

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-white font-body py-10 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Back Navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors self-start"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to App
        </button>

        {/* Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark border border-border-light dark:border-border-dark rounded-3xl p-6 md:p-10 shadow-lg flex flex-col md:flex-row gap-8 items-center">
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          
          {/* Avatar or Robo-head */}
          <div className="size-32 md:size-40 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center shrink-0">
            <span className="material-icons-round text-primary text-7xl animate-bounce">smart_toy</span>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-2 mb-2 justify-center md:justify-start">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Bhavik Sorathiya
              </h1>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                He/Him
              </span>
            </div>
            <p className="text-lg text-primary font-semibold mb-4">
              Full-Stack Developer | Building AI-Powered Products | B.Tech IT '27
            </p>
            <p className="text-sm text-text-secondary dark:text-gray-400 max-w-xl leading-relaxed">
              Based in Anand, Gujarat, India. Student Coordinator at Training & Placement Cell, GCET V.V. Nagar. I translate tea, coffee, and developer roasts into fully functioning web software.
            </p>

            {/* Quick Contacts */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                LinkedIn
              </a>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                GitHub
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#25d366] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* The Casual Roast (Indian Memes / Fun Section) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-icons-round text-primary">bug_report</span>
              Developer Confessions
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Solved 200+ LeetCode DSA questions but still spends 15 minutes googling <i>"how to vertically center an SVG."</i></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>My backend API architecture: <i>"Safe, SOC2 compliance ready."</i> Also me: bypasses auth checks by writing <code>user === "bhavik"</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Training & Placement Cell Coordinator: Helping batchmates get recruited while I practice talking to my own AI Interviewer. 🤖</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-icons-round text-primary">local_cafe</span>
              The Project: SkillWise
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              I built SkillWise between Jan 2026 and May 2026. Initially, it was meant to be a job board where companies hire candidates. But let's be real—AI took over, so I turned it into a resume intelligence and mock interview simulator.
            </p>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary font-mono text-center">
              Gemini API + MySQL + MongoDB + Socket.IO = 🔥
            </div>
          </div>
        </section>

        {/* Fun Meme Cards */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Reality vs Expectations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-center">
              <p className="font-semibold text-lg text-primary">Coding Backend</p>
              <p className="text-xs text-gray-500 mt-1">"Heavy AI Orchestration Engine, Socket state machines, hybrid schemas"</p>
            </div>
            <div className="p-4 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-center">
              <p className="font-semibold text-lg text-primary">Aligning CSS</p>
              <p className="text-xs text-gray-500 mt-1">"Please stay in the div. Why did you move? *Cries in Flexbox*"</p>
            </div>
            <div className="p-4 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-center">
              <p className="font-semibold text-lg text-primary">Placement Prep</p>
              <p className="text-xs text-gray-500 mt-1">"Didi please coordinate the PPT slides while I figure out why Socket.IO disconnected."</p>
            </div>
          </div>
        </section>

        {/* Formal Contact Details Page */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Need to hire or collaborate?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Feel free to drop a mail or text me directly on WhatsApp. Let's build cool things!</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href={emailDraftUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-center font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-icons-round text-sm">mail</span>
              Mail Bhavik
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25d366] hover:bg-[#20ba59] text-white text-center font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-icons-round text-sm">chat</span>
              WhatsApp Draft
            </a>
          </div>
        </section>

      </div>
    </div>
  );
};

export default KnowDeveloperPage;
