/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg:            'var(--color-bg)',
        card:          'var(--color-card)',
        accent:        '#4F7FFF',
        'accent-light':'var(--color-accent-light)',
        text:          'var(--color-text)',
        'text-sub':    'var(--color-text-sub)',
        border:        'var(--color-border)',
      },
    },
  },
  plugins: [],
}
