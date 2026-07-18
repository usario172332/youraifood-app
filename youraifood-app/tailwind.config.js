/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#e6f7ef',
          500: '#27ab7a',
          600: '#1f8f66',
          700: '#1a6b4f',
          900: '#0f3d2e',
        },
        ink: '#1c2621',
        'ink-soft': '#5c6b64',
      },
    },
  },
  plugins: [],
};
