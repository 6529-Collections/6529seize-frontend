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
import perfectionist from "eslint-plugin-perfectionist";
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
  "unused-imports": unusedImports,
  "react-hooks": reactHooks,
  "@typescript-eslint": tseslint.plugin,
  import: importPlugin,
  sonarjs: sonarjs,
  security: security,
  promise: promise,
  perfectionist: perfectionist,
  tailwindcss: tailwindcss,
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
  "@next/next/no-css-tags": "warn",
  "@next/next/no-sync-scripts": "error",

  // Google Fonts
  "@next/next/google-font-display": "error",
  "@next/next/google-font-preconnect": "error",
  "@next/next/no-page-custom-font": "error",

  // Scripts & Head
  "@next/next/no-head-element": "error",
  "@next/next/next-script-for-ga": "warn",
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

  // -------------------------------------------------------------------------
  // TypeScript - Production Grade
  // -------------------------------------------------------------------------
  // Safety - Prevent unsafe operations
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unsafe-assignment": "warn",
  "@typescript-eslint/no-unsafe-call": "warn",
  "@typescript-eslint/no-unsafe-member-access": "warn",
  "@typescript-eslint/no-unsafe-return": "warn",
  "@typescript-eslint/no-unsafe-argument": "warn",

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
  "@typescript-eslint/no-redundant-type-constituents": "warn",

  // Type safety
  "@typescript-eslint/strict-boolean-expressions": [
    "warn",
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
  "@typescript-eslint/no-unnecessary-condition": "warn",
  "@typescript-eslint/no-unnecessary-type-assertion": "error",
  "@typescript-eslint/no-non-null-assertion": "warn",

  // Best practices
  "@typescript-eslint/prefer-nullish-coalescing": "warn",
  "@typescript-eslint/prefer-optional-chain": "error",
  "@typescript-eslint/no-unused-vars": "off", // Handled by unused-imports
  "@typescript-eslint/no-inferrable-types": "error",
  "@typescript-eslint/prefer-as-const": "error",
  "@typescript-eslint/no-unnecessary-type-parameters": "warn",

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
    "warn",
    {
      allowNumber: true,
      allowBoolean: true,
      allowNullish: false,
    },
  ],
  "@typescript-eslint/use-unknown-in-catch-callback-variable": "warn",

  // Disable base rules that TypeScript handles
  "require-await": "off", // Using @typescript-eslint/require-await instead

  // -------------------------------------------------------------------------
  // React Hooks Rules - Production Grade
  // -------------------------------------------------------------------------
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "error",
  "react-hooks/preserve-manual-memoization": "warn", // Keep intentional memoization
  "react-hooks/error-boundaries": "warn", // Validate error boundary usage
  "react-hooks/set-state-in-effect": "warn", // Catch problematic setState in effects
  "react-hooks/use-memo": "off", // Too noisy, React Compiler handles this
  "react-hooks/refs": "warn", // Validate ref usage
  "react-hooks/immutability": "error", // Critical: prevent state mutations
  "react-hooks/purity": "warn", // Catch side effects in render

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
  "import/newline-after-import": ["error", { count: 1 }],
  "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
  "import/order": [
    "off",
    {
      groups: [
        "builtin",
        "external",
        "internal",
        ["parent", "sibling"],
        "index",
        "type",
      ], // TODO: enable later
      pathGroups: [
        { pattern: "react", group: "builtin", position: "before" },
        { pattern: "next/**", group: "builtin", position: "before" },
        { pattern: "@/**", group: "internal", position: "before" },
      ],
      pathGroupsExcludedImportTypes: ["react", "next"],
      "newlines-between": "always",
      alphabetize: {
        order: "asc",
        caseInsensitive: true,
      },
    },
  ],

  // -------------------------------------------------------------------------
  // Accessibility (jsx-a11y) - handled by eslint-config-next
  // Next.js includes jsx-a11y with sensible defaults
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // SonarJS - Production Grade
  // -------------------------------------------------------------------------
  // Complexity
  "sonarjs/cognitive-complexity": ["warn", 15],
  "sonarjs/no-nested-switch": "error",
  "sonarjs/no-nested-template-literals": "warn",
  "sonarjs/no-nested-conditional": "warn",

  // Code Smells
  "sonarjs/no-duplicate-string": ["warn", { threshold: 4 }],
  "sonarjs/no-identical-functions": "warn",
  "sonarjs/no-identical-expressions": "error",
  "sonarjs/no-collapsible-if": "warn",
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
  "sonarjs/prefer-immediate-return": "warn",
  "sonarjs/prefer-single-boolean-return": "warn",
  "sonarjs/prefer-object-literal": "warn",
  "sonarjs/prefer-while": "warn",

  // -------------------------------------------------------------------------
  // Security - Production Grade
  // -------------------------------------------------------------------------
  // Critical - These can lead to RCE or major vulnerabilities
  "security/detect-eval-with-expression": "error",
  "security/detect-child-process": "warn",
  "security/detect-non-literal-fs-filename": "warn",
  "security/detect-non-literal-require": "error",

  // Injection vulnerabilities
  "security/detect-object-injection": "warn",
  "security/detect-non-literal-regexp": "warn",
  "security/detect-unsafe-regex": "error",

  // Buffer & crypto
  "security/detect-buffer-noassert": "error",
  "security/detect-pseudoRandomBytes": "warn",
  "security/detect-possible-timing-attacks": "warn",

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
  "promise/no-nesting": "warn",
  "promise/no-promise-in-callback": "warn",
  "promise/no-callback-in-promise": "warn",
  "promise/no-new-statics": "error",
  "promise/no-multiple-resolved": "error",

  // Best practices
  "promise/param-names": "error",
  "promise/valid-params": "error",
  "promise/prefer-await-to-then": "warn",
  "promise/prefer-await-to-callbacks": "warn",

  // -------------------------------------------------------------------------
  // Perfectionist - Production Grade
  // -------------------------------------------------------------------------
  "perfectionist/sort-imports": "off", // Using import/order instead

  // TypeScript types
  "perfectionist/sort-named-imports": [
    "error",
    {
      type: "alphabetical",
      order: "asc",
    },
  ],
  "perfectionist/sort-named-exports": [
    "error",
    {
      type: "alphabetical",
      order: "asc",
    },
  ],
  "perfectionist/sort-object-types": [
    "off",
    {
      type: "alphabetical",
      order: "asc",
    },
  ], // TODO: enable later
  "perfectionist/sort-interfaces": [
    "off",
    {
      type: "alphabetical",
      order: "asc",
    },
  ], // TODO: enable later
  "perfectionist/sort-enums": [
    "error",
    {
      type: "alphabetical",
      order: "asc",
    },
  ],
  "perfectionist/sort-union-types": [
    "off",
    {
      type: "alphabetical",
      order: "asc",
    },
  ], // TODO: enable later
  "perfectionist/sort-intersection-types": [
    "error",
    {
      type: "alphabetical",
      order: "asc",
    },
  ],

  // JSX
  "perfectionist/sort-jsx-props": [
    "off",
    {
      type: "alphabetical",
      order: "asc",
    },
  ], // TODO: enable later

  // Code structure
  "perfectionist/sort-switch-case": [
    "error",
    {
      type: "alphabetical",
      order: "asc",
    },
  ],

  // -------------------------------------------------------------------------
  // Tailwind CSS - Production Grade
  // -------------------------------------------------------------------------
  "tailwindcss/classnames-order": "off", // Handled by prettier-plugin-tailwindcss
  "tailwindcss/enforces-negative-arbitrary-values": "error", // Use -top-[5px] not top-[-5px]
  "tailwindcss/enforces-shorthand": "warn", // Use mx-4 not ml-4 mr-4
  "tailwindcss/no-arbitrary-value": "off", // Allow arbitrary values like w-[123px]
  "tailwindcss/no-custom-classname": "off", // Only Tailwind classes allowed, no legacy CSS, TODO: enable later
  "tailwindcss/no-contradicting-classname": "error", // Catch p-4 p-5 conflicts
  "tailwindcss/no-unnecessary-arbitrary-value": "warn", // Use p-4 not p-[16px]

  // -------------------------------------------------------------------------
  // General Code Quality - Production Grade
  // -------------------------------------------------------------------------
  // Console & debugging
  "no-console": ["error", { allow: ["warn", "error"] }],
  "no-debugger": "error",
  "no-alert": "error",

  // Best practices
  eqeqeq: ["error", "always"],
  curly: ["error", "all"],
  "default-case": "error",
  "default-case-last": "error",
  "no-else-return": ["error", { allowElseIf: false }],
  "no-lonely-if": "error",
  "no-param-reassign": ["error", { props: false }],
  "no-return-assign": "error",
  "no-sequences": "error",
  "no-throw-literal": "error",
  "no-useless-return": "error",
  // "require-await" is off - using @typescript-eslint/require-await instead
  yoda: "error",

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
  "object-shorthand": "error",
  "prefer-template": "error",
  "prefer-arrow-callback": "error",
  "prefer-destructuring": ["warn", { array: false, object: true }],
  "prefer-rest-params": "error",
  "prefer-spread": "error",
  "arrow-body-style": ["error", "as-needed"],

  // Complexity limits
  "max-depth": ["warn", 4],
  "max-lines-per-function": [
    "warn",
    { max: 150, skipBlankLines: true, skipComments: true },
  ],
  "max-params": ["warn", 5],

  // Arrays
  "array-callback-return": ["error", { allowImplicit: true }],
  "no-array-constructor": "error",
};

// Add React Compiler rule if available
if (reactCompilerPlugin) {
  rules["react-compiler/react-compiler"] = "warn";
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

  // Prettier - MUST be last to override formatting rules
  eslintConfigPrettier,
]);
