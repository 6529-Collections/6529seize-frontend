const fs = require("node:fs");
const path = require("node:path");
const { createJiti } = require("jiti");

const jiti = createJiti(__filename, { interopDefault: true });
const rootTailwindPath = path.resolve(__dirname, "../../../tailwind.config.ts");
const source = fs.readFileSync(rootTailwindPath, "utf8");
const compiled = jiti.transform({
  source,
  filename: rootTailwindPath,
  ts: true,
});
const baseModule = jiti.evalModule(compiled, {
  id: rootTailwindPath,
  filename: rootTailwindPath,
});
const baseConfig = baseModule?.default ?? baseModule;

module.exports = {
  ...baseConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../../app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../../pages/**/*.{js,ts,jsx,tsx}",
    "../../../components/**/*.{js,ts,jsx,tsx}",
  ],
};
