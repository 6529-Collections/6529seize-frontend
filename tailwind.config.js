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
      colors: {
        "primary-300": "#84ADFF",
        "primary-400": "#528BFF",
        "primary-500": "#406AFE",
        "primary-600": "#395FE4",
        error: "#F97066",
        success: "#83BF6E",
        "neutral-350": "#B0B0B0",
        "green": "#3CCB7F",
        "red":"#F97066",
        "yellow":"#FEDF89"
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
