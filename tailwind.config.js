/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#fdfaf5",
          100: "#f9f2e7",
          200: "#f2e4cc",
        },
        espresso: {
          700: "#3b1f0e",
          800: "#2c1608",
          900: "#1a0d04",
        },
        stamp: {
          active: "#c8763a",
          inactive: "#e8d5bc",
        },
      },
    },
  },
  plugins: [],
};
