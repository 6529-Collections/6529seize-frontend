import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tseslint.parser,
      sourceType: "module",
      ecmaVersion: "latest",
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
      }],
    },
  },
];
