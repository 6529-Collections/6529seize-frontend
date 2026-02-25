import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const importRules = {
  "unused-imports/no-unused-imports": "error",
  "import/order": [
    "error",
    {
      groups: [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index",
        "object",
        "type",
      ],
      pathGroups: [
        {
          pattern: "@/**",
          group: "internal",
          position: "before",
        },
      ],
      pathGroupsExcludedImportTypes: ["builtin"],
      "newlines-between": "always",
      alphabetize: {
        order: "asc",
        caseInsensitive: true,
      },
    },
  ],
  "sort-imports": [
    "error",
    {
      ignoreCase: true,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      allowSeparatedGroups: true,
    },
  ],
};

export default defineConfig([
  globalIgnores([
    "**/node_modules",
    "**/.next",
    "**/dist",
    "**/out",
    "**/public",
    "**/coverage",
    "**/generated",
    "**/__tests__/**",
    "**/tests/**",
    "**/__mocks__/**",
    "**/e2e/**",
    "**/test-results/**",
    "config/**",
    "*.js",
    "*.mjs",
    "*.ts",
    "*.tsx",
    "scripts/**",
    "stubs/**",
    ".claude/**",
    ".codex/**",
  ]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      "react-hooks": reactHooksPlugin,
      "unused-imports": unusedImports,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: importRules,
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
]);
