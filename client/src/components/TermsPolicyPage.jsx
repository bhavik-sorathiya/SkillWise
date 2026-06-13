import React from 'react';

const TermsPolicyPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-white font-body py-10 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors self-start"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to App
        </button>

        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
            <span className="material-icons-round text-primary text-4xl">gavel</span>
            Terms & Policy
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-2">
            Welcome to the zero-corporate-policy zone. Just have fun and practice!
          </p>
        </div>

        {/* Fun mock legal terms */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 md:p-8 shadow-lg space-y-6">
          
          <div>
            <h3 className="font-bold text-lg text-primary mb-2">1. Term-less Project</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              This is a fun academic and portfolio project built by Bhavik. There are no actual legal contracts or lawyer-approved conditions. By using this, you agree not to sue the developer if the AI interviewer roasts your resume skills too hard.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-primary mb-2">2. Objective AI Roast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              If the platform returns a low fit match rating, it is a call to level up, not an insult. The AI reviews resumes objectively based on target role definitions. Cheat codes or copy-pasting answers are technically possible, but you're only fooling yourself!
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-primary mb-2">3. Data Integrity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              We encrypt and store your profiles, resumes, and interview transcripts securely on private DB containers. However, please do not upload classified state documents or your grandmother's secret recipe.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-primary mb-2">4. Indian Meme Exemption Clause</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              This app values humor and Indian memes. Bug fixes may contain hidden comments quoting popular Indian developer realities. Feel free to roast the CSS in your feedback mails!
            </p>
          </div>

        </div>

        {/* Fun Footer Statement */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-600">
          No cookies were harmed in the making of this privacy page. Go write some code! 🚀
        </div>

      </div>
    </div>
  );
};

export default TermsPolicyPage;
