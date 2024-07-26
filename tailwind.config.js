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
        "primary-300": "#84ADFF",
        "primary-400": "#528BFF",
        "primary-500": "#406AFE",
        "primary-600": "#395FE4",
        error: "#F97066",
        success: "#83BF6E",
        "iron-350": "#B0B0B0",
        green: "#3CCB7F",
        red: "#F97066",
        yellow: "#FEDF89",
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
    },
  },
  variants: {
    extend: {
      fontSize: ["placeholder"],
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "class" })],
};
