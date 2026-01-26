/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aethex-cyan': '#00FFCC',
        'aethex-dark': '#0A0E1A',
      }
    },
  },
  plugins: [],
}
