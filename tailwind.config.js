/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "tw-",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      boxShadow: {
        "drop-btn-inactive":
          "0px -4px 2px 0px rgba(0, 0, 0, 0.25) inset, 0px 2px 1px 0px rgba(255, 255, 255, 0.25) inset",
        "drop-btn-active":
          "0px 0px 120px 0px #9917FF, 0px 0px 1px 3px rgba(255, 255, 255, 0.10), 0px -1px 2px 0px rgba(0, 0, 0, 0.25) inset, 0px 1px 1px 0px rgba(255, 255, 255, 0.25) inset",
      },
      screens: {
        "3xl": "2048px",
      },
      fontSize: {
        xxs: ["0.8125rem", "20px"],
        md: ["0.9375rem", "24px"],
      },
      colors: {
        "primary-200": "#84ADFF",
        "primary-300": "#84ADFF",
        "primary-400": "#528BFF",
        "primary-500": "#406AFE",
        "primary-600": "#395FE4",
        error: "#F97066",
        success: "#83BF6E",
        "iron-350": "#B0B0B0",
        green: "#3CCB7F",
        red: "#F97066",
        iron: {
          50: "#F5F5F5",
          100: "#EFEFF1",
          200: "#ECECEE",
          300: "#CECFD4",
          400: "#93939F",
          500: "#848490",
          600: "#60606C",
          650: "#4C4C55",
          700: "#37373E",
          800: "#26272B",
          900: "#1C1C21",
          950: "#131316",
        },
      },
      gridTemplateColumns: {
        13: "repeat(13, minmax(0, 1fr))",
      },
      zIndex: {
        1000: "1000",
      },
      keyframes: {
        "loading-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "trophy-appear": {
          "0%": {
            opacity: "0",
            transform: "scale(0.9) translateY(4px)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
        "gradient-shift": {
          "0%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
          '100%': { 
            'background-position': '0% 50%'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        },
        'fadeIn': {
          '0%': { 
            opacity: '0'
          },
          '100%': { 
            opacity: '1'
          }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' }
        },
        'gallery-reveal': {
          '0%': { 
            opacity: '0.7',
            transform: 'translateY(4px) perspective(1000px) rotateX(2deg)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) perspective(1000px) rotateX(0)'
          }
        },
      },
      animation: {
        'loading-bar': 'loading-bar 1.5s infinite',
        'trophy-appear': 'trophy-appear 0.3s ease-out forwards',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'spin-slow': 'spin 15s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'shake': 'shake 0.3s ease-in-out',
        'gallery-reveal': 'gallery-reveal 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      },
      backgroundSize: {
        'gradient-pos': '200% 200%',
        '200': '200% 200%'
      }
    },
  },
  variants: {
    extend: {
      fontSize: ["placeholder"],
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class",
    }),
    require("tailwind-scrollbar")({ nocompatible: true }),
    require("@tailwindcss/container-queries"),
    function ({ addVariant }) {
      addVariant("desktop-hover", "@media (hover: hover) and (pointer: fine)");
    },
  ],
};
