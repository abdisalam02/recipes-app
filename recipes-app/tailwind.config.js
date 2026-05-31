/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neo-cream': '#FDF8F5',
        'neo-mustard': '#FFD369',
        'neo-sage': '#9FBB73',
        'neo-peach': '#F3B092',
        'neo-indigo': '#7C83FD',
        'neo-dark': '#1E1E24',
        'neo-charcoal': '#2D2D34',
        'neo-purple': '#A78BFA',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-hover': '6px 6px 0px 0px rgba(0,0,0,1)',
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'neo-white': '4px 4px 0px 0px rgba(255,255,255,1)',
        'neo-white-hover': '6px 6px 0px 0px rgba(255,255,255,1)',
      },
      fontFamily: {
        'display': ['"Outfit"', 'system-ui', 'sans-serif'],
        'body': ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
    },
  },
  plugins: [
    require("daisyui"),
    function({ addUtilities }) {
      const newUtilities = {
        '.neo-shadow': {
          'box-shadow': '4px 4px 0px 0px var(--fallback-bc, oklch(var(--bc) / 1))',
        },
        '.neo-shadow-hover': {
          'box-shadow': '6px 6px 0px 0px var(--fallback-bc, oklch(var(--bc) / 1))',
        },
        '.neo-shadow-sm': {
          'box-shadow': '2px 2px 0px 0px var(--fallback-bc, oklch(var(--bc) / 1))',
        },
      }
      addUtilities(newUtilities)
    }
  ],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#7C83FD",
          "secondary": "#FFD369", 
          "accent": "#9FBB73",
          "neutral": "#111827",
          "base-100": "#FDF8F5",
          "base-200": "#FFFFFF",
          "base-300": "#F3B092",
          "base-content": "#111827",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      {
        dark: {
          "primary": "#A78BFA",
          "secondary": "#FFD369",
          "accent": "#9FBB73", 
          "neutral": "#f8fafc",
          "base-100": "#1E1E24",
          "base-200": "#2D2D34",
          "base-300": "#3D3D45",
          "base-content": "#ffffff",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
};
