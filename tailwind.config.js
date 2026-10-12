/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      colors: {
        cinematic: {
          950: '#0c0d10',
          900: '#131519',
          850: '#191b21',
          800: '#20232a',
          700: '#2c2f38',
          600: '#3e424d',
          500: '#585c69',
        },
        fire: {
          amber: '#f59e0b',
          orange: '#d97706',
          gold: '#b45309',
          glow: 'rgba(245, 158, 11, 0.2)',
        },
        neon: {
          cyan: '#38bdf8',
          purple: '#94a3b8',
          pink: '#f43f5e',
          emerald: '#10b981',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'tv-focus': '0 0 0 2px #ffffff, 0 6px 16px rgba(0, 0, 0, 0.6)',
        'tv-focus-cyan': '0 0 0 2px #ffffff, 0 6px 16px rgba(0, 0, 0, 0.6)',
        'tv-focus-purple': '0 0 0 2px #ffffff, 0 6px 16px rgba(0, 0, 0, 0.6)',
        'card-glow': '0 8px 20px -4px rgba(0, 0, 0, 0.7)',
        'hero-glow': '0 20px 40px -15px rgba(0, 0, 0, 0.85)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float-subtle': 'floatSubtle 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
