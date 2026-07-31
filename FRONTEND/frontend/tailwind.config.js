/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      boxShadow: {
        'clay': '0 8px 24px rgba(14,165,233,0.06), -4px -4px 12px rgba(255,255,255,0.7)',
        'clay-hover': '0 12px 32px rgba(14,165,233,0.1), -4px -4px 12px rgba(255,255,255,0.7)',
        'clay-btn': '0 4px 12px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
        'clay-btn-press': 'inset 0 2px 6px rgba(14,165,233,0.3)',
        'clay-inner': 'inset 2px 2px 6px rgba(14,165,233,0.04), inset -2px -2px 6px rgba(255,255,255,0.8)',
        'clay-inner-focus': 'inset 2px 2px 6px rgba(14,165,233,0.1), 0 0 0 3px rgba(14,165,233,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-in-up': 'fadeInUp 250ms ease-out',
        'fade-in-down': 'fadeInDown 250ms ease-out',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'clay-enter': 'clayEnter 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        skeleton: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        clayEnter: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.97)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
}
