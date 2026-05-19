/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        line: 'var(--line)',
        'line-2': 'var(--line-2)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        'text-faint': 'var(--text-faint)',
        accent: 'var(--accent)',
        warn: 'var(--warn)',
        pink: 'var(--pink)',
        cyan: 'var(--cyan)',
        violet: 'var(--violet)',
        red: 'var(--red)',
        good: 'var(--good)',
      },
    },
  },
  plugins: [],
}
