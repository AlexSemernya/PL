/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Из дизайна: светло-серый фон, белые карточки, синий акцент
        bg: '#F0F0F5',
        card: '#FFFFFF',
        accent: '#4F7FFF',
        'accent-light': '#EEF2FF',
        'text-primary': '#1C1C1E',
        'text-secondary': '#8E8E93',
        'text-muted': '#C7C7CC',
        border: '#E5E5EA',
      },
      borderRadius: {
        card: '16px',
        pill: '100px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
