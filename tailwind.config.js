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
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
      colors: {
        cream: {
          50: '#f6faff',
          100: '#eaf3ff',
          200: '#d6e6fb',
        },
        sand: {
          50: '#faf8f5',
          100: '#f5f1eb',
          200: '#ede7dc',
        },
        ink: {
          900: '#0b2545',
          800: '#13315c',
        },
      },
    },
  },
  plugins: [],
};
