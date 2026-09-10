/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Outfit"', 'sans-serif'],
        outfit: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        script: ['"Caveat"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        vera: {
          bg: '#080914',
          sidebar: '#0b0c1b',
          card: '#121427',
          cardHover: '#181b35',
          border: 'rgba(255, 255, 255, 0.08)',
          purpleBorder: 'rgba(168, 85, 247, 0.25)',
          glow: '#9333ea',
          accent: '#c084fc',
        }
      },
      boxShadow: {
        'vera-card': '0 4px 20px -2px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'vera-pill': '0 0 20px -2px rgba(168, 85, 247, 0.35)',
        'vera-input': '0 10px 35px -5px rgba(0, 0, 0, 0.8), 0 0 25px -5px rgba(147, 51, 234, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'vera-orb': '0 0 70px 10px rgba(139, 92, 246, 0.45)',
      }
    },
  },
  plugins: [],
}
