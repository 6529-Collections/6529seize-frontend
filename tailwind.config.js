/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: 'tw-',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: "#406AFE",
        "primary-hover": "#395FE4",
        dark: "#171B22"
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}