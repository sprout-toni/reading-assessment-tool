/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'lexend': ['Lexend', 'sans-serif'],
      },
      colors: {
        brand: {
          teal: '#259388',
          'darker-teal': '#0E796F',
          'light-teal': '#56D1BD',
          'golden-yellow': '#F7D361',
          'midnight-blue': '#0B1028',
          cream: '#F9F3ED',
          orange: '#E29148',
          'coral-red': '#DB655C',
          purple: '#7356DF',
          'cloud-blue': '#B1CFD4',
          'electric-blue': '#4D81D5'
        }
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}