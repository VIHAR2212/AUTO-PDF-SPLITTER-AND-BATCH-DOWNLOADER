/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./popup.html', './settings.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', '-apple-system', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', '"Iowan Old Style"', 'serif'],
        mono: ['"Geist Mono"', '"SF Mono"', '"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bone: {
          DEFAULT: '#FBFBFA',
          50: '#FBFBFA',
          100: '#F7F6F3',
          200: '#F0EFEB',
        },
        ink: {
          DEFAULT: '#111111',
          soft: '#2F3437',
          muted: '#787774',
          faint: '#A8A7A3',
        },
        line: {
          DEFAULT: '#EAEAEA',
          soft: 'rgba(0,0,0,0.06)',
        },
        pastel: {
          red: { bg: '#FDEBEC', text: '#9F2F2D' },
          blue: { bg: '#E1F3FE', text: '#1F6C9F' },
          green: { bg: '#EDF3EC', text: '#346538' },
          yellow: { bg: '#FBF3DB', text: '#956400' },
        },
      },
      borderRadius: {
        card: '12px',
        control: '6px',
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(0,0,0,0.04)',
        none: '0 0 0 rgba(0,0,0,0)',
      },
      animation: {
        'fade-up': 'fadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
    },
  },
  plugins: [],
};
