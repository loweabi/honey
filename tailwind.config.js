/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3EEE2',
        field: '#FBF9F3',
        sand: '#E7E0CE',
        line: '#CBC0A3',
        ink: '#262421',
        'ink-soft': '#5B5448',
        honey: '#E2A61F',
        'honey-wash': '#F6E6B4',
        'honey-deep': '#7E5300',
        olive: '#4E6A2C',
        'olive-wash': '#DEE7CB',
        brick: '#A63D2A',
        'brick-wash': '#F1D9CF',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '4px' },
    },
  },
  plugins: [],
};
