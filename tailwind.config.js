/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
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
