/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#f27f0d",
        "primary-hover": "#d96f0a",
        "background-light": "#f8f7f5",
        "background-dark": "#221910",
        "surface-light": "#ffffff",
        "surface-dark": "#2d241b",
        "border-light": "#e8dbce",
        "border-dark": "#4a3b30",
        "text-main": "#1c140d",
        "text-secondary": "#9c7349",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        'xl': "1rem",
        '2xl': "1.5rem",
        '3xl': "2rem",
      },
      boxShadow: {
        'soft': '0 20px 40px -15px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(255, 107, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
