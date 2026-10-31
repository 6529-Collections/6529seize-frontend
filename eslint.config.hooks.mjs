import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import { baseGlobalIgnores } from "./eslint.config.mjs";

// Repo-wide Rules of Hooks gate (`6529 run lint:hooks`). The main config keeps
// react-hooks/rules-of-hooks off and eslint.config.diff.mjs only reports it on
// changed lines, so a violation on untouched lines would otherwise go unseen.
// This config is deliberately minimal and not type-aware: one rule, the
// parsers, and the main config's ignore list, so a full run stays cheap.
export default [
  { ignores: [...baseGlobalIgnores] },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: { parser: tseslint.parser },
  },
  // Only this rule is loaded, so disable comments for the main config's other
  // plugins would be reported as unknown rules. A Rules of Hooks violation is a
  // bug rather than a style choice: rename the helper or restructure the
  // component instead of suppressing it.
  { linterOptions: { noInlineConfig: true } },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    plugins: { "react-hooks": reactHooks },
    rules: { "react-hooks/rules-of-hooks": "error" },
  },
];
