import tseslint from "typescript-eslint";
import preferAccessible from "./scripts/eslint-rules/prefer-accessible-locators.mjs";

// Separate from app lint, which intentionally ignores tests/**.
export default [
  {
    files: ["{tests,e2e}/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // Exceptions belong in the documented rule, not file-wide suppressions.
    linterOptions: { noInlineConfig: true },
    plugins: {
      "e2e-selectors": { rules: { "prefer-accessible": preferAccessible } },
    },
    rules: { "e2e-selectors/prefer-accessible": "error" },
  },
];
