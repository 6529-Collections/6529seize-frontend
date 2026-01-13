import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import eslintConfigPrettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import promise from "eslint-plugin-promise";
import tailwindcss from "eslint-plugin-tailwindcss";
import path from "node:path";
import { fileURLToPath } from "node:url";

// React Compiler plugin is optional; keep linting resilient if dependency is missing.
let reactCompilerPlugin;
try {
  ({ default: reactCompilerPlugin } =
    await import("eslint-plugin-react-compiler"));
} catch (error) {
  if (!error || typeof error !== "object") {
    throw error;
  }

  const moduleNotFound =
    "code" in error && error.code === "ERR_MODULE_NOT_FOUND";
  if (!moduleNotFound) {
    throw error;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =============================================================================
// PLUGINS
// =============================================================================
// Note: jsx-a11y is already included via eslint-config-next, so we don't register it again
const plugins = {
  "@typescript-eslint": tseslint.plugin,
  sonarjs: sonarjs,
  "react-hooks": reactHooks,
};

// =============================================================================
// RULES
// =============================================================================
const rules = {
  "sonarjs/no-duplicated-branches": "error",
};

// =============================================================================
// EXPORT CONFIG
// =============================================================================
export default defineConfig([
  // Global ignores
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
    ".claude/**",
        ".codex/**",
  ]),

  // Base config with Next.js rules
  {
    plugins,
    rules,
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: `${__dirname}/tsconfig.json`,
        },
        node: true,
      },
      tailwindcss: {
        config: `${__dirname}/tailwind.config.js`,
        callees: ["classnames", "clsx", "cn", "cva"],
      },
    },
  },

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
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: `${__dirname}/tsconfig.json`,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Accessing process.env is restricted. Use environment variables safely.",
        },
      ],
    },
  },

  // Prettier - MUST be last to override formatting rules
  eslintConfigPrettier,
]);
