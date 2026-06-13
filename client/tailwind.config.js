/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-base': 'var(--color-bg-base)',
        'bg-sidebar': 'var(--color-bg-sidebar)',
        'bg-card': 'var(--color-bg-card)',
        'bg-card-hover': 'var(--color-bg-card-hover)',
        'bg-input': 'var(--color-bg-input)',
        border: 'var(--color-border)',
        'border-subtle': 'var(--color-border-subtle)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-inverse': 'var(--color-text-inverse)',
        'accent-purple': 'var(--color-accent-purple)',
        'accent-purple-dim': 'var(--color-accent-purple-dim)',
        'accent-pink': 'var(--color-accent-pink)',
        'accent-cyan': 'var(--color-accent-cyan)',
        'accent-orange': 'var(--color-accent-orange)',
        'accent-teal': 'var(--color-accent-teal)',
        'accent-indigo': 'var(--color-accent-indigo)',
        'stat-purple-bg': 'var(--color-stat-purple-bg)',
        'stat-blue-bg': 'var(--color-stat-blue-bg)',
        'stat-teal-bg': 'var(--color-stat-teal-bg)',
        'stat-red-bg': 'var(--color-stat-red-bg)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      borderRadius: {
        xl2: '12px',
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(1.5rem) scale(0.95)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateX(0) scale(1)' },
          to: { opacity: '0', transform: 'translateX(1.5rem) scale(0.95)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-out': 'toast-out 0.25s ease-in forwards',
      },
    },
  },
  safelist: ['animate-toast-in', 'animate-toast-out'],
  plugins: [],
};
