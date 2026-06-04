/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        clinical: {
          ink: '#17324d',
          teal: '#087f8c',
          mint: '#d8f3ed',
          coral: '#e06d5f',
          amber: '#f2b84b',
          sky: '#e8f4ff',
        },
      },
      boxShadow: {
        card: '0 14px 35px rgba(23, 50, 77, 0.08)',
      },
    },
  },
  plugins: [],
};
