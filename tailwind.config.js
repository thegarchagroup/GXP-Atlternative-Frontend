/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        harbor: { DEFAULT: '#173B57', 50: '#EEF3F7', 100: '#D6E2EC', 600: '#1F4C6E', 700: '#173B57', 800: '#112C42', 900: '#0C2031' },
        paper: '#F5F6F3',
        brass: { DEFAULT: '#A87B2E', 50: '#F8F1E4', 600: '#8E6724' },
        slate: { ink: '#27313B' },
        mist: '#DDE2E4',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};
