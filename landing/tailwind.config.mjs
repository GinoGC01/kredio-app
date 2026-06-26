import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'kredio-dark':      '#0D0D0D',
        'kredio-lime':      '#D4FF3A',
        'kredio-light':     '#FAF9F6',
        'kredio-gray-text': '#6E6E73',
        'kredio-card-bg':   '#111111',
      },
      borderRadius: {
        'hero-bottom': '48px',
      },
    },
  },
  plugins: [],
}
