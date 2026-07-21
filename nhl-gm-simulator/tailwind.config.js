/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ice: {
          bg: '#0d1117',
          panel: '#161b22',
          panel2: '#1c2230',
          border: '#2a3242',
          muted: '#8b95a7',
          text: '#e6edf3',
          accent: '#38bdf8',
          good: '#34d399',
          warn: '#fbbf24',
          bad: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
