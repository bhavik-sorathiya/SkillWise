import React from 'react';

const PricingPage = ({ onBack, onGetStarted }) => {
  const tiers = [
    {
      name: "Gareeb Tier",
      price: "₹0",
      period: "forever",
      subtitle: "Best for college students surviving on Chai and Maggi.",
      icon: "local_dining",
      color: "border-gray-200 dark:border-gray-700",
      highlight: false,
      features: [
        "1 Free Resume Analysis per day",
        "1 Free AI Mock Interview per day",
        "Add your own Gemini API key for UNLIMITED free usage!",
        "Standard AI Response Speed (runs on a toaster)",
        "Max 3 Resumes storage capacity",
        "Support: Send a silent prayer and hope it works"
      ],
      buttonText: "Stay Gareeb (Free)",
      action: () => onGetStarted ? onGetStarted() : onBack()
    },
    {
      name: "Amir Tier",
      price: "₹10,000",
      period: "month",
      subtitle: "For the high-rollers who want to impress the GCET batch.",
      icon: "payments",
      color: "border-primary bg-primary/5 shadow-primary/10",
      highlight: true,
      badge: "Best Value (Cash Only)",
      features: [
        "High-Speed AI responses (instant roasting)",
        "Unlimited Resume SWOT evaluations",
        "Special 'No-Roast' Mode (AI will pretend you're smart)",
        "WhatsApp Direct Support (reply depends on sleep schedule)",
        "Payment: 100% Cash only. Hand over clean 500rs notes directly to Bhavik in GCET Canteen. No UPI, no GPay!"
      ],
      buttonText: "Handover Cash to Bhavik",
      action: () => alert("Payment instructions: Locate Bhavik Sorathiya in the GCET IT Dept or Canteen. Hand him 10,000rs in hard cash. A receipt written on a napkin will be provided on demand.")
    },
    {
      name: "Ambani Tier",
      price: "₹1,00,000",
      period: "month",
      subtitle: "Elon Musk mode. Perfect if you have rich relatives.",
      icon: "diamond",
      color: "border-purple-500/50 bg-purple-500/5 dark:bg-purple-500/10 shadow-purple-500/10",
      highlight: false,
      badge: "Musk Mode",
      features: [
        "Bhavik will write your React/Node code for you",
        "Answers fed to you during real placement interviews via secret Bluetooth earpiece",
        "Sponsorship of coffee/tea services at entire GCET Campus",
        "Direct 3 AM calls to the developer to discuss life and bugs",
        "Payment: Accepted only via 24K gold biscuits or a 1BHK apartment title deed in Anand"
      ],
      buttonText: "Sponsor GCET Coffee",
      action: () => alert("Sponsorship selected! Please prepare a draft deed for a 1BHK flat in Anand or bring gold biscuits to tea stall near GCET Library & Boys Hostel to unlock this tier.")
    }
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-white font-body py-10 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors self-start"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to App
        </button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <span className="material-icons-round text-primary text-5xl">monetization_on</span>
            Choose Your Budget
          </h1>
          <p className="text-lg text-text-secondary dark:text-gray-400 mt-3 max-w-2xl mx-auto">
            100% transparent pricing. Absolutely zero hidden fees (because there are no fees at all, except the cash you hand Bhavik).
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl border-2 p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl bg-surface-light dark:bg-surface-dark ${tier.color}`}
            >
              {tier.badge && (
                <span className={`absolute top-0 right-6 -translate-y-1/2 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${tier.highlight ? 'bg-primary text-white' : 'bg-purple-600 text-white'
                  }`}>
                  {tier.badge}
                </span>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-2xl ${tier.highlight ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                    <span className="material-icons-round text-2xl">{tier.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                </div>

                <p className="text-sm text-text-secondary dark:text-gray-400 mb-6 leading-relaxed">
                  {tier.subtitle}
                </p>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{tier.price}</span>
                  <span className="text-sm text-text-secondary dark:text-gray-400">/{tier.period}</span>
                </div>

                <hr className="border-border-light dark:border-border-dark mb-8" />

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm">
                      <span className="material-icons-round text-green-500 text-sm mt-0.5">check_circle</span>
                      <span className="text-gray-600 dark:text-gray-400 leading-normal">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={tier.action}
                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-300 ${tier.highlight
                  ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 hover:shadow-primary/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Small Funny Disclaimer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-600 mt-6 max-w-md mx-auto leading-relaxed">
          * Disclaimer: Bhavik is not actually authorized by GCET to sell Bluetooth earpieces or write code during exams. Amir Tier cash handovers are final and non-refundable, especially if spent on canteen Food.
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
