
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
          500: '#49B838', // main green
          600: '#3FA32F',
          700: '#348A27',
          800: '#2A701F',
          900: '#1F5717',
        },
        badOrange: {
          50:  '#F9ECE7',
          100: '#F3D6C9',
          200: '#E8B59E',
          300: '#DD9473',
          400: '#D37A54',
          500: '#CC663F', // main orange
          600: '#B85638',
          700: '#9E4A31',
          800: '#843E29',
          900: '#6A3222',
        },
      },
      fontFamily: {
        neuton: ['"Neuton ExtraBold"', 'serif'],
      },
    },
  },
  plugins: [],
}
