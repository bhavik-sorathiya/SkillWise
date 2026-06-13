import React, { useState } from 'react';

const FAQs = [
  {
    question: "What is SkillWise?",
    answer: "SkillWise is an AI-powered resume and mock interview intelligence platform. It helps you analyze your resume strengths and weaknesses (SWOT metrics), check role alignment, and simulate interactive text-based mock interviews to get real-world preparation feedback."
  },
  {
    question: "Which resume file formats are supported?",
    answer: "Currently, SkillWise supports Word Documents (.docx) up to 3MB. We parse the contents to structure your skills, years of experience, and target job descriptions."
  },
  {
    question: "How does the AI Mock Interview simulator work?",
    answer: "Our backend orchestration engine uses your parsed resume data and your selected target role. The AI interviewer generates contextual technical and behavioral questions via a real-time text chat interface, reacts to your answers, and scores your performance in real-time."
  },
  {
    question: "Where can I view my detailed performance reviews?",
    answer: "After completing a simulated mock interview session, you get an Interview Summary card. Click on 'View Question Wise Analysis' to navigate to a detailed breakdown of each question, your answer, and actionable feedback/model answers."
  },
  {
    question: "Is my personal data secure?",
    answer: "Yes, privacy is a core priority of SkillWise. Your uploaded resumes, parsed profile rows, and interview chat histories are stored securely in database tables (MongoDB & MySQL) and are never shared or made public."
  },
  {
    question: "How do I remove an uploaded resume?",
    answer: "Navigate to the 'Resume & Skills' workspace, find your resume list, and click the red trash delete button on the card. This instantly removes the document and its cached analysis metadata."
  }
];

const HelpCenterPage = ({ onBack }) => {
  const [openIdx, setOpenIdx] = useState(null);

  const toggleFAQ = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-white font-body py-10 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors self-start"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to App
        </button>

        {/* Title */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Help Center & FAQ
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-2">
            Got questions about how SkillWise analyzes profiles or scores interviews? Find answers below.
          </p>
        </div>

        {/* FAQ List */}
        <div className="flex flex-col gap-4">
          {FAQs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined transform transition-transform duration-200">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-5 border-t border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center">
          <p className="text-sm text-text-main dark:text-white font-medium mb-3">Still have questions?</p>
          <a
            href="mailto:bhavik.sorathiya.dev@gmail.com?subject=SkillWise%20Inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Contact Support
          </a>
        </div>

      </div>
    </div>
  );
};

export default HelpCenterPage;
