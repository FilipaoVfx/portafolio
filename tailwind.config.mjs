/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06060a',
          900: '#0a0a12',
          800: '#11111c',
          700: '#1a1a2a',
        },
        accent: {
          lime: '#c6ff3d',
          electric: '#3df0ff',
          magenta: '#ff3dd1',
          amber: '#ffb13d',
        },
        glass: {
          white: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        brutal: '6px 6px 0 0 #000',
        'brutal-lg': '10px 10px 0 0 #000',
        'brutal-accent': '6px 6px 0 0 #c6ff3d',
        glow: '0 0 40px rgba(198,255,61,0.35)',
        'glow-cyan': '0 0 40px rgba(61,240,255,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
