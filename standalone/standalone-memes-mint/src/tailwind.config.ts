import baseConfig from "../../../config/tailwind.shared.cjs";
import type { Config } from "tailwindcss";

const standaloneTailwindConfig: Config = {
  ...baseConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../../app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../../pages/**/*.{js,ts,jsx,tsx}",
    "../../../components/**/*.{js,ts,jsx,tsx}",
  ],
};

export default standaloneTailwindConfig;
