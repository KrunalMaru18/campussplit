/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          purple: '#6654D9',
          lavender: '#917FF2',
          lightLavender: '#DCD6FF',
          darkBg: '#17172B',
          darkCard: '#21213E',
          darkTile: '#29294D',
          lightBg: '#F7F7FC',
          lightCard: '#FFFFFF',
          lightTile: '#F0EFF9',
          emerald: '#10B981',
          rose: '#FF5A79',
          amber: '#F59E0B',
        },
        primary: {
          50: '#f7f6fe',
          100: '#edeafd',
          200: '#dcd6ff',
          300: '#beb3fb',
          400: '#917ff2',
          500: '#6654d9',
          600: '#5843cc',
          700: '#4a34b8',
          800: '#3e2c99',
          900: '#34267e',
        },
        brand: {
          indigo: '#6654D9',
          purple: '#6654D9',
          violet: '#917FF2',
          emerald: '#10b981',
          rose: '#ff5a79',
          amber: '#f59e0b',
          dark: '#17172B',
          surface: '#21213E'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
