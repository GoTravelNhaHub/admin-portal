/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.{vue,js}',
    './pages/**/*.{vue,js}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        // One typeface everywhere, as in the community design (Inter)
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        brand: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Site palette follows the community design (blue and white)
        ink: '#0A1024',
        sea: {
          DEFAULT: '#0066E4',
          50: '#EAF2FC',
        },
        sand: '#F7F9FD',
        coral: '#E26D5A',
        line: '#E6EBF3',
        // Blue scale around the community primary (#0066E4), for pages that used emerald/teal accents
        brand: {
          50: '#F2F7FF',
          100: '#E3EEFD',
          200: '#C9DEFB',
          300: '#9DC3F7',
          400: '#5C9DF0',
          500: '#2A7FEA',
          600: '#0066E4',
          700: '#0057C8',
          800: '#0642D2',
          900: '#0B3580',
        },
        // Community redesign (design-references/…Dashboard.png), sampled from the approved mockup
        cm: {
          primary: '#0066E4',      // filled buttons, Publish/Start Planning
          'primary-hover': '#0057C8',
          active: '#0642D2',       // active nav, tab and link text
          brand: '#0055D9',        // GoTravelNha wordmark
          ink: '#0A1024',          // headings, names, card titles
          body: '#2B3245',         // descriptions
          muted: '#7E8496',        // nav labels, meta rows, counts
          subtle: '#A2A8B4',       // timestamps, placeholders
          line: '#E6EBF3',         // card borders, dividers
          soft: '#EAF2FC',         // active nav pill, Follow button
          panel: '#E4F0FC',        // promo panels
          search: '#EFF4FB',       // header search field
          canvas: '#F7F9FD',       // page background
          heart: '#E0476A'
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        'cm-card': '0 1px 2px rgba(16, 32, 72, 0.04), 0 6px 18px -8px rgba(16, 32, 72, 0.10)',
        'cm-panel': '0 1px 3px rgba(16, 32, 72, 0.05), 0 10px 28px -12px rgba(16, 32, 72, 0.12)',
        'cm-button': '0 6px 14px -6px rgba(0, 102, 228, 0.55)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'fade-in-delayed': 'fadeIn 0.8s ease-in 0.3s both',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-up-delayed': 'slideUp 0.8s ease-out 0.2s both',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 2s',
        'bounce-slow': 'bounceSlow 3s ease-in-out infinite',
        'bounce-slow-delayed': 'bounceSlow 3s ease-in-out infinite 0.5s',
        'bounce-slow-more': 'bounceSlow 3s ease-in-out infinite 1s',
        'bounce-slow-more-delayed': 'bounceSlow 3s ease-in-out infinite 1.5s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      screens: {
        'xs': '475px',
        // Large monitors: more columns instead of empty margins
        '3xl': '1920px',
        '4xl': '2560px',
      },
      // Community three-column shell, measured at 1536px: 198 nav, feed, 333 sidebar
      gridTemplateColumns: {
        'cm-3': '198px minmax(0, 1fr) 333px',
        'cm-2': 'minmax(0, 1fr) 300px',
      },
      borderRadius: {
        'cm': '14px',
        'cm-lg': '18px',
      },
    },
  },
  plugins: [],
}
