/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(200%)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14,110,254,0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(14,110,254,0.12)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
      colors: {
        cream: {
          50: '#f6faff',
          100: '#eaf3ff',
          200: '#d6e6fb',
        },
        sand: {
          50: '#f8f7f4',
          100: '#f2efea',
          200: '#e8e3da',
        },
        ink: {
          950: '#030b18',
          900: '#0b2545',
          800: '#13315c',
          700: '#1e4278',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        bilto: {
          50: '#eef5ff',
          100: '#daeaff',
          200: '#bdd7ff',
          300: '#90bbff',
          400: '#5e96ff',
          500: '#0e6efe',
          600: '#0a57cc',
          700: '#0846a8',
          800: '#063785',
          900: '#042d6c',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        'card-active': '0 0 0 3px rgba(14,110,254,0.15), 0 4px 16px rgba(14,110,254,0.12)',
        'cta': '0 4px 14px rgba(14,110,254,0.35)',
        'cta-hover': '0 6px 20px rgba(14,110,254,0.45)',
        'gold': '0 4px 14px rgba(245,158,11,0.30)',
      },
    },
  },
  plugins: [],
};
