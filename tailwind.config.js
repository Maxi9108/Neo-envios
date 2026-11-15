/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        faro: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        violeta: {
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        }
      }
    },
  },
  plugins: [],
}
