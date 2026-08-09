/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A1220',
          light: '#10192E',
          mid: '#1B2740',
        },
        parchment: '#F4EFE0',
        gold: {
          DEFAULT: '#D4A94B',
          soft: '#E8C983',
        },
        rose: '#E8B4B8',
        teal: '#4A7C7C',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
      backgroundImage: {
        stars: "radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 90px 80px, rgba(255,255,255,0.3), transparent), radial-gradient(1.5px 1.5px at 150px 40px, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 200px 120px, rgba(255,255,255,0.25), transparent)",
      },
    },
  },
  plugins: [],
}
