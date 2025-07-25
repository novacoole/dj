/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mixxx-dark': '#1a1a1a',
        'mixxx-darker': '#0f0f0f',
        'mixxx-blue': '#00b4d8',
        'mixxx-green': '#06ffa5',
        'mixxx-red': '#ff006e',
        'mixxx-yellow': '#ffbe0b',
      },
      fontFamily: {
        'mono': ['Fira Code', 'monospace'],
      },
      animation: {
        'spin-vinyl': 'spin 2s linear infinite',
        'pulse-beat': 'pulse 0.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}