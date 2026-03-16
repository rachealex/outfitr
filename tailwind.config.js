/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F0F10',
        charcoal: '#1C1C1F',
        rust: '#A3472A',
        gold: '#C6A96A',
        ivory: '#F2EEE8',
        muted: '#8A8681',
        moss: '#3F4A3C',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
    },
  },
  plugins: [],
}

