/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#f6faff',
          100: '#eaf3ff',
          200: '#d6e6fb',
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
