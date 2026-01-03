import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";

// React Compiler plugin is optional; keep linting resilient if dependency is missing.
let reactCompilerPlugin;
try {
    ({ default: reactCompilerPlugin } = await import("eslint-plugin-react-compiler"));
} catch (error) {
    if (!error || typeof error !== "object") {
        throw error;
    }

    const moduleNotFound = "code" in error && error.code === "ERR_MODULE_NOT_FOUND";
    if (!moduleNotFound) {
        throw error;
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plugins = {
    "unused-imports": unusedImports,
    "react-hooks": reactHooks,
    "@typescript-eslint": tseslint.plugin,
};

const rules = {
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-img-element": "off",
    "react/display-name": "off",
    "react-hooks/rules-of-hooks": "warn",
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/preserve-manual-memoization": "off",
    "react-hooks/error-boundaries": "off",
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/use-memo": "off",
    "react-hooks/refs": "off",
    "react-hooks/immutability": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "@next/next/no-css-tags": "off",
    "unused-imports/no-unused-imports": "error",

    "unused-imports/no-unused-vars": ["warn", {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
    }],
};

if (reactCompilerPlugin) {
    plugins["react-compiler"] = reactCompilerPlugin;
    rules["react-compiler/react-compiler"] = "warn";
}

export default defineConfig([globalIgnores([
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
]), {
    extends: [...nextCoreWebVitals],

    plugins,

    rules,
}, {
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

    rules: {
        "no-restricted-syntax": ["error", {
            selector: "MemberExpression[object.name='process'][property.name='env']",
            message: "Accessing process.env is restricted. Use environment variables safely.",
        }],
    },
}]);
