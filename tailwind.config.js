/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Noto Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Noto Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Noto Sans Thai"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        cream: {
          50: '#fdfcf9',
          100: '#faf6ef',
          200: '#f3ebd9',
          300: '#e9dcc0',
          400: '#dcc79c',
        },
        sand: {
          50: '#f8f3ea',
          100: '#f0e6d2',
          200: '#e2d0ac',
          300: '#d0b581',
          400: '#bd9a5f',
          500: '#a37f47',
          600: '#87673a',
          700: '#6b5030',
          800: '#523e26',
          900: '#3a2c1b',
        },
        stone: {
          50: '#f7f6f4',
          100: '#eeece7',
          200: '#dad6cc',
          300: '#bfb8a8',
          400: '#9c9280',
          500: '#7d7361',
          600: '#635a4b',
          700: '#4d453a',
          800: '#39332b',
          900: '#26221c',
        },
        concrete: {
          DEFAULT: '#8a8175',
          light: '#b8b0a0',
          dark: '#4a4438',
        },
        status: {
          pending: '#eab308',
          approved: '#d4a017',
          dispatched: '#f97316',
          completed: '#16a34a',
          cancelled: '#dc2626',
        },
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgba(74, 68, 56, 0.08)',
        card: '0 1px 3px 0 rgba(74, 68, 56, 0.1), 0 1px 2px -1px rgba(74, 68, 56, 0.08)',
        elevated: '0 20px 60px -12px rgba(58, 44, 27, 0.35)',
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #faf6ef 0%, #f0e6d2 100%)',
      },
      animation: {
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'toast-in': 'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        toastIn: {
          '0%': { opacity: 0, transform: 'translateX(100%)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
