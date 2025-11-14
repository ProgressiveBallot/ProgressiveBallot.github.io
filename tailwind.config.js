
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        goodGreen: {
          50:  '#E9F7E9',
          100: '#CFF0CF',
          200: '#A6E0A6',
          300: '#7DD07D',
          400: '#5BC95B',
          500: '#49B838', // base
          600: '#3FA32F',
          700: '#348A27',
          800: '#2A701F',
          900: '#1F5717',
        },
        badOrange: {
          50:  '#faefeb',
          100: '#f4ded7',
          200: '#e9bdaf',
          300: '#df9d86',
          400: '#d47c5e',
          500: '#c95b36', // base
          600: '#a1492b',
          700: '#793720',
          800: '#502416',
          900: '#28120b'
        },
      },
      fontFamily: {
        neuton: ['"Neuton ExtraBold"', 'serif'],
      },
    },
  },
  plugins: [],
}
