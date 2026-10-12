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
          950: '#06080e',
          900: '#0c101a',
          850: '#111726',
          800: '#171f33',
          700: '#232d48',
          600: '#344065',
          500: '#4c5b8a',
        },
        fire: {
          amber: '#ff9900',
          orange: '#ff6600',
          gold: '#f59e0b',
          glow: 'rgba(255, 153, 0, 0.45)',
        },
        neon: {
          cyan: '#06b6d4',
          purple: '#a855f7',
          pink: '#ec4899',
          emerald: '#10b981',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'tv-focus': '0 0 0 3px #ff9900, 0 10px 30px -5px rgba(255, 153, 0, 0.5)',
        'tv-focus-cyan': '0 0 0 3px #06b6d4, 0 10px 30px -5px rgba(6, 182, 212, 0.5)',
        'tv-focus-purple': '0 0 0 3px #a855f7, 0 10px 30px -5px rgba(168, 85, 247, 0.5)',
        'card-glow': '0 12px 35px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(99, 102, 241, 0.15)',
        'hero-glow': '0 25px 60px -15px rgba(0, 0, 0, 0.9)',
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
