/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Naturalistic color palette for the ant colony theme
        primary: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f1d8bf',
          300: '#e8bd93',
          400: '#de9c66',
          500: '#d48544',
          600: '#c6773a',
          700: '#a46132',
          800: '#84502f',
          900: '#6b4228',
        },
        secondary: {
          50: '#f6f3f0',
          100: '#ebe3da',
          200: '#d7c7b5',
          300: '#bfa48a',
          400: '#a78562',
          500: '#967147',
          600: '#89633c',
          700: '#725232',
          800: '#5e442b',
          900: '#4e3925',
        },
        earth: {
          50: '#f7f4f1',
          100: '#ede5dd',
          200: '#ddcabc',
          300: '#c8a693',
          400: '#b5866e',
          500: '#a67356',
          600: '#99674b',
          700: '#7f5640',
          800: '#684838',
          900: '#553d31',
        },
        forest: {
          50: '#f4f6f3',
          100: '#e5ebe1',
          200: '#ccd7c4',
          300: '#a8bb9b',
          400: '#7f9970',
          500: '#627d52',
          600: '#4d6440',
          700: '#3e5034',
          800: '#34422c',
          900: '#2d3827',
        },
      },
      fontFamily: {
        'game': ['"Orbitron"', 'monospace'],
        'ui': ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'ant-walk': 'ant-walk 2s ease-in-out infinite',
        'colony-pulse': 'colony-pulse 3s ease-in-out infinite',
        'resource-float': 'resource-float 4s ease-in-out infinite',
      },
      keyframes: {
        'ant-walk': {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(2px) rotate(1deg)' },
          '75%': { transform: 'translateX(-2px) rotate(-1deg)' },
        },
        'colony-pulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
        'resource-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
} 