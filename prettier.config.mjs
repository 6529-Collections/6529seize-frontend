/** @type {import("prettier").Config} */
const config = {
  // =============================================================================
  // Line & Indentation
  // =============================================================================
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // =============================================================================
  // Syntax
  // =============================================================================
  semi: true,
  singleQuote: false,
  jsxSingleQuote: false,
  quoteProps: "as-needed",

  // =============================================================================
  // Trailing Commas - cleaner git diffs
  // =============================================================================
  trailingComma: "es5",

  // =============================================================================
  // Brackets & Spacing
  // =============================================================================
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",

  // =============================================================================
  // Special
  // =============================================================================
  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  endOfLine: "lf",
  embeddedLanguageFormatting: "auto",
  singleAttributePerLine: false,

  // =============================================================================
  // Plugins
  // =============================================================================
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["clsx", "cn", "cva"],
  tailwindAttributes: [
    "enter",
    "enterFrom",
    "enterTo",
    "leave",
    "leaveFrom",
    "leaveTo",
  ],
};

export default config;
