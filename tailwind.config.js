/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        minecraft: {
          grass: '#2D7A2D',
          dirt: '#8B4513',
          gold: '#FFD700',
          stone: '#808080',
          coal: '#1A1A1A',
        }
      },
      fontFamily: {
        minecraft: ['Inter', 'monospace'],
      }
    },
  },
  plugins: [],
}