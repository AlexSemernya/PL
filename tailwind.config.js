/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        accent: 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        'icon-bg': 'var(--color-icon-bg)',
        border: 'var(--color-border)',
        text: {
          primary: 'var(--color-text)',
          secondary: 'var(--color-text-sub)',
          muted: 'var(--color-text-muted)',
          accent: 'var(--color-accent)',
        },
      },
      borderRadius: { card: '16px' },
      boxShadow: { card: '0 2px 12px rgba(0,0,0,0.06)' },
    },
  },
  plugins: [],
}
