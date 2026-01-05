import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =============================================================================
// EXPORT CONFIG
// =============================================================================
export default defineConfig([
  // Global ignores - same as main config
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
    "config/**",
    "*.js",
    "*.mjs",
    "*.ts",
    "*.tsx",
    "scripts/**",
    "stubs/**",
  ]),

  // TypeScript-specific rules with type-checking
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "scripts/**",
      "**/next.config.*",
      "config/env.ts",
      "config/serverEnv.ts",
      "config/alchemyEnv.ts",
      "__tests__/config/env.base-endpoint.test.ts",
      "**/playwright.config.ts",
      "tests/**",
    ],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: `${__dirname}/tsconfig.json`,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Single rule to run - change this to test different rules
      "@typescript-eslint/no-unnecessary-condition": "error",
    },
  },
]);
