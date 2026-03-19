const path = require("node:path");
const jiti = require("jiti")(__filename, { interopDefault: true });
const rootTailwindPath = path.resolve(__dirname, "../../../tailwind.config.ts");
const baseModule = jiti(rootTailwindPath);
const baseConfig = baseModule.default ?? baseModule;

module.exports = {
  ...baseConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../../app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../../pages/**/*.{js,ts,jsx,tsx}",
    "../../../components/**/*.{js,ts,jsx,tsx}",
  ],
};
