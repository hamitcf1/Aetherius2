/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      colors: {
        skyrim: {
          dark: 'var(--skyrim-dark)',
          paper: 'var(--skyrim-paper)',
          border: 'var(--skyrim-border)',
          gold: 'var(--skyrim-gold)',
          goldHover: 'var(--skyrim-gold-hover)',
          text: 'var(--skyrim-text)',
          accent: 'var(--skyrim-accent)'
        }
      }
    },
  },
  plugins: [],
}
