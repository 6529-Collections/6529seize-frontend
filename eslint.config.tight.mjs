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
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";

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
  "unused-imports": unusedImports,
  "react-hooks": reactHooks,
  "@typescript-eslint": tseslint.plugin,
  import: importPlugin,
  sonarjs: sonarjs,
  security: security,
  promise: promise,
  tailwindcss: tailwindcss,
  "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
};

if (reactCompilerPlugin) {
  plugins["react-compiler"] = reactCompilerPlugin;
}

// =============================================================================
// RULES
// =============================================================================
const rules = {
  // -------------------------------------------------------------------------
  // Next.js Rules - Production Grade
  // -------------------------------------------------------------------------
  // Performance & Core Web Vitals
  "@next/next/no-img-element": "error",
  "@next/next/no-html-link-for-pages": "error",
  "@next/next/no-css-tags": "error",
  "@next/next/no-sync-scripts": "error",

  // Google Fonts
  "@next/next/google-font-display": "error",
  "@next/next/google-font-preconnect": "error",
  "@next/next/no-page-custom-font": "error",

  // Scripts & Head
  "@next/next/no-head-element": "error",
  "@next/next/next-script-for-ga": "error",
  "@next/next/inline-script-id": "error",
  "@next/next/no-before-interactive-script-outside-document": "error",
  "@next/next/no-script-component-in-head": "error",

  // Document & Structure
  "@next/next/no-document-import-in-page": "error",
  "@next/next/no-head-import-in-document": "error",
  "@next/next/no-duplicate-head": "error",
  "@next/next/no-title-in-document-head": "error",
  "@next/next/no-styled-jsx-in-document": "error",

  // Code Quality
  "@next/next/no-typos": "error",
  "@next/next/no-assign-module-variable": "error",
  "@next/next/no-unwanted-polyfillio": "error",
  "@next/next/no-async-client-component": "error",

  // -------------------------------------------------------------------------
  // React Rules - handled by eslint-config-next
  // Next.js includes react plugin with sensible defaults
  // Custom overrides not possible due to ESLint flat config plugin scoping
  // -------------------------------------------------------------------------

  "react/no-unescaped-entities": "error",

  // -------------------------------------------------------------------------
  // TypeScript - Production Grade
  // -------------------------------------------------------------------------
  // Safety - Prevent unsafe operations
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-member-access": "error",
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/no-unsafe-argument": "error",

  // Async - Catch promise mistakes
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    {
      checksVoidReturn: { attributes: false }, // Allow async onClick handlers
    },
  ],
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/require-await": "error",
  "@typescript-eslint/no-redundant-type-constituents": "error",

  // Type safety
  "@typescript-eslint/strict-boolean-expressions": [
    "error",
    {
      allowString: true,
      allowNumber: true,
      allowNullableObject: true,
      allowNullableBoolean: true,
      allowNullableString: true,
      allowNullableNumber: false,
      allowAny: false,
    },
  ],
  "@typescript-eslint/no-unnecessary-condition": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": "error",

  // Best practices
  "@typescript-eslint/prefer-nullish-coalescing": "error",
  "@typescript-eslint/prefer-optional-chain": "error",
  "@typescript-eslint/no-unused-vars": "off", // Handled by unused-imports
  "@typescript-eslint/prefer-as-const": "error",
  "@typescript-eslint/no-unnecessary-type-parameters": "error",

  // Consistency
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
    },
  ],
  "@typescript-eslint/consistent-type-exports": [
    "error",
    {
      fixMixedExportsWithInlineTypeSpecifier: true,
    },
  ],
  "@typescript-eslint/no-import-type-side-effects": "error",

  // Prevent common mistakes
  "@typescript-eslint/no-array-delete": "error",
  "@typescript-eslint/no-duplicate-enum-values": "error",
  "@typescript-eslint/no-duplicate-type-constituents": "error",
  "@typescript-eslint/no-for-in-array": "error",
  "@typescript-eslint/no-mixed-enums": "error",
  "@typescript-eslint/restrict-plus-operands": "error",
  "@typescript-eslint/restrict-template-expressions": [
    "error",
    {
      allowNumber: true,
      allowBoolean: true,
      allowNullish: false,
    },
  ],
  "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
  "@typescript-eslint/no-shadow": "error",
  "@typescript-eslint/only-throw-error": "error",
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/unbound-method": "error",
  "@typescript-eslint/no-base-to-string": "error",
  "@typescript-eslint/no-confusing-void-expression": [
    "error",
    { ignoreArrowShorthand: true },
  ],
  "@typescript-eslint/no-unsafe-enum-comparison": "error",
  "@typescript-eslint/no-deprecated": "error",

  // Disable base rules that TypeScript handles
  "require-await": "off", // Using @typescript-eslint/require-await instead

  // -------------------------------------------------------------------------
  // React Hooks Rules - Production Grade
  // -------------------------------------------------------------------------
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "error",
  "react-hooks/preserve-manual-memoization": "error",
  "react-hooks/error-boundaries": "error",
  "react-hooks/set-state-in-effect": "error",
  "react-hooks/use-memo": "off", // Too noisy, React Compiler handles this
  "react-hooks/refs": "error",
  "react-hooks/immutability": "error",
  "react-hooks/purity": "error",
  "react-hooks/set-state-in-render": "error",
  "react-hooks/globals": "error",
  "react-hooks/static-components": "error",
  "react-hooks/incompatible-library": "error",
  "react-hooks/gating": "error",

  // -------------------------------------------------------------------------
  // Unused Imports - Production Grade
  // -------------------------------------------------------------------------
  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": [
    "error",
    {
      vars: "all",
      varsIgnorePattern: "^_",
      args: "after-used",
      argsIgnorePattern: "^_",
      ignoreRestSiblings: true, // Allow const { used, ...rest } = obj
      destructuredArrayIgnorePattern: "^_",
    },
  ],

  // -------------------------------------------------------------------------
  // Import Plugin - Production Grade
  // -------------------------------------------------------------------------
  // Safety
  "import/no-cycle": ["error", { maxDepth: 3 }],
  "import/no-duplicates": "error",
  "import/no-self-import": "error",
  "import/no-relative-packages": "error", // No imports from packages via relative path
  "import/no-mutable-exports": "error",
  "import/no-extraneous-dependencies": [
    "error",
    {
      devDependencies: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/tests/**",
        "**/__tests__/**",
        "**/e2e/**",
        "**/*.config.{js,ts,mjs}",
        "**/scripts/**",
      ],
    },
  ],

  // Organization
  "import/first": "error",
  "import/no-useless-path-segments": ["error", { noUselessIndex: true }],

  // -------------------------------------------------------------------------
  // Accessibility (jsx-a11y) - handled by eslint-config-next
  // Next.js includes jsx-a11y with sensible defaults
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // SonarJS - Production Grade
  // -------------------------------------------------------------------------
  // Complexity
  "sonarjs/cognitive-complexity": ["error", 15],
  "sonarjs/no-nested-switch": "error",
  "sonarjs/no-nested-template-literals": "error",
  "sonarjs/no-nested-conditional": "error",

  // Code Smells
  "sonarjs/no-duplicate-string": ["error", { threshold: 4 }],
  "sonarjs/no-identical-functions": "error",
  "sonarjs/no-identical-expressions": "error",
  "sonarjs/no-collapsible-if": "error",
  "sonarjs/no-redundant-boolean": "error",
  "sonarjs/no-redundant-jump": "error",
  "sonarjs/no-inverted-boolean-check": "error",
  "sonarjs/no-gratuitous-expressions": "error",

  // Bug Detection
  "sonarjs/no-collection-size-mischeck": "error",
  "sonarjs/no-unused-collection": "error",
  "sonarjs/no-use-of-empty-return-value": "error",
  "sonarjs/no-element-overwrite": "error",
  "sonarjs/no-empty-collection": "error",
  "sonarjs/no-extra-arguments": "error",
  "sonarjs/no-all-duplicated-branches": "error",
  "sonarjs/no-duplicated-branches": "error",
  "sonarjs/no-same-line-conditional": "error",
  "sonarjs/no-ignored-return": "error",
  "sonarjs/no-identical-conditions": "error",

  // Maintainability
  "sonarjs/prefer-immediate-return": "error",
  "sonarjs/prefer-single-boolean-return": "error",
  "sonarjs/prefer-object-literal": "error",
  "sonarjs/prefer-while": "error",

  // -------------------------------------------------------------------------
  // Security - Production Grade
  // -------------------------------------------------------------------------
  // Critical - These can lead to RCE or major vulnerabilities
  "security/detect-eval-with-expression": "error",
  "security/detect-child-process": "error",
  "security/detect-non-literal-fs-filename": "error",
  "security/detect-non-literal-require": "error",

  // Injection vulnerabilities
  "security/detect-non-literal-regexp": "error",
  "security/detect-unsafe-regex": "error",

  // Buffer & crypto
  "security/detect-buffer-noassert": "error",
  "security/detect-pseudoRandomBytes": "error",
  "security/detect-possible-timing-attacks": "error",

  // Web security
  "security/detect-no-csrf-before-method-override": "error",
  "security/detect-bidi-characters": "error",

  // -------------------------------------------------------------------------
  // Promise - Production Grade
  // -------------------------------------------------------------------------
  // Error handling
  "promise/catch-or-return": ["error", { allowFinally: true }],
  "promise/always-return": ["error", { ignoreLastCallback: true }],
  "promise/no-return-in-finally": "error",

  // Anti-patterns
  "promise/no-return-wrap": "error",
  "promise/no-nesting": "error",
  "promise/no-promise-in-callback": "error",
  "promise/no-callback-in-promise": "error",
  "promise/no-new-statics": "error",
  "promise/no-multiple-resolved": "error",

  // Best practices
  "promise/param-names": "error",
  "promise/valid-params": "error",
  "promise/prefer-await-to-callbacks": "error",

  // -------------------------------------------------------------------------
  // Tailwind CSS - Production Grade
  // -------------------------------------------------------------------------
  "tailwindcss/classnames-order": "off", // Handled by prettier-plugin-tailwindcss
  "tailwindcss/enforces-negative-arbitrary-values": "error", // Use -top-[5px] not top-[-5px]
  "tailwindcss/enforces-shorthand": "error",
  "tailwindcss/no-arbitrary-value": "off", // Allow arbitrary values like w-[123px]
  "tailwindcss/no-custom-classname": "off", // TODO: enable later
  "tailwindcss/no-contradicting-classname": "error",
  "tailwindcss/no-unnecessary-arbitrary-value": "error",

  // -------------------------------------------------------------------------
  // General Code Quality - Production Grade
  // -------------------------------------------------------------------------
  // Console & debugging
  "no-console": ["error", { allow: ["warn", "error"] }],
  "no-debugger": "error",
  "no-alert": "error",

  // Best practices
  eqeqeq: ["error", "always"],
  "no-else-return": ["error", { allowElseIf: false }],
  "no-lonely-if": "error",
  "no-param-reassign": ["error", { props: false }],
  "no-return-assign": "error",
  "no-sequences": "error",
  "no-useless-return": "error",
  // "require-await" is off - using @typescript-eslint/require-await instead

  // Variables
  "prefer-const": "error",
  "no-var": "error",
  "no-unused-expressions": [
    "error",
    { allowShortCircuit: true, allowTernary: true },
  ],
  "no-shadow": "off", // Handled by @typescript-eslint

  // Ternary & conditionals
  "no-nested-ternary": "error",
  "no-unneeded-ternary": "error",

  // Modern JS
  "prefer-arrow-callback": "error",
  "prefer-rest-params": "error",
  "prefer-spread": "error",

  // Complexity limits
  "max-depth": ["error", 4],
  "max-lines": [
    "error",
    { max: 750, skipBlankLines: true, skipComments: true },
  ],
  "max-lines-per-function": [
    "error",
    { max: 150, skipBlankLines: true, skipComments: true },
  ],
  "max-params": ["error", 5],

  // Arrays
  "array-callback-return": ["error", { allowImplicit: true }],
  "no-array-constructor": "error",
};

// Add React Compiler rule if available
if (reactCompilerPlugin) {
  rules["react-compiler/react-compiler"] = "error";
}

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
    extends: [...nextCoreWebVitals],
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

  // Disable max-lines-per-function for React components
  {
    files: ["**/*.tsx", "**/*.jsx"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  // React You Might Not Need An Effect
  reactYouMightNotNeedAnEffect.configs.strict,
  // Prettier - MUST be last to override formatting rules
  eslintConfigPrettier,
]);
