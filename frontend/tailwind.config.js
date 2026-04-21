/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#06080f',
        primary: '#3d53fc',
        accent: '#14b8a6',
        surface: 'rgba(255,255,255,0.03)',
        border: 'rgba(255,255,255,0.07)',
        'stress-low': '#22c55e',
        'stress-medium': '#f59e0b',
        'stress-high': '#ef4444',
      },
      fontFamily: {
        heading: ['DM Sans', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease both',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan-line': 'scanLine 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(61,83,252,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(61,83,252,0.7)' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
