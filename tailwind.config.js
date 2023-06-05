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
        "primary-focus":"#528BFF",
        dark: "#171B22",
        error: "#F97066"
      }
    },
  },
  variants: {
    extend: {
      fontSize: ['placeholder'],
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}