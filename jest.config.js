// jest.config.js

// No longer using next/jest
// const nextJest = require('next/jest')();
// const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testTimeout: 10000,
  // Use ts-jest preset
  preset: "ts-jest",
  // Test environment setup
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  // Module resolution
  moduleDirectories: ["node_modules", "<rootDir>/"],
  // Path Aliases (from your tsconfig/jsconfig) - Keep existing one
  // Add mocks for CSS Modules, static assets, and next/font that next/jest handled
  moduleNameMapper: {
    // CSS modules under @
    "^@/(.*)\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    // Regular CSS under @
    "^@/(.*)\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    // Everything else under @
    "^@/(.*)$": "<rootDir>/$1",

    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$":
      "<rootDir>/__mocks__/fileMock.js",
    "^nano-css(.*)$": "<rootDir>/__mocks__/nanoCssMock.js",
    "^dom-helpers/css$": "<rootDir>/__mocks__/css-functions.js",
    "^@next/font/(.*)$": "<rootDir>/__mocks__/nextFontMock.js",
    "^next/font/(.*)$": "<rootDir>/__mocks__/nextFontMock.js",
  },
  // Test Discovery
  testMatch: ["<rootDir>/**/*.test.ts", "<rootDir>/**/*.test.tsx"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/", // Jest default
    "<rootDir>/.next/", // Next.js build folder
    "<rootDir>/tests/", // Ignore Playwright tests folder
    "<rootDir>/e2e/", // Ignore Playwright e2e folder
  ],
  // Transformation - use ts-jest
  transform: {
    // Use ts-jest for ts/tsx files
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json", // Use jest-specific tsconfig
        babelConfig: false,
      },
    ],
    // Add babel-jest for JS/JSX/MJS files
    "^.+\\.(js|jsx|mjs)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  // Don't transform node_modules except specific ESM packages if needed
  transformIgnorePatterns: [
    "/node_modules/(?!wagmi|viem)/", // Allow transforming wagmi and viem
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  // Coverage Configuration (keep existing)
  collectCoverage: true,
  collectCoverageFrom: [
    // Target actual source directories like app, components, contexts, etc.
    "{app,components,contexts,entities,helpers,hooks,lib,pages,services,store,utils,wagmiConfig}/**/*.{ts,tsx}",
    // Exclude all TypeScript definition files from coverage
    "!**/*.d.ts",
    // Exclude node_modules
    "!**/node_modules/**",
    // Keep other exclusions
    "!**/coverage/**",
    "!**/.next/**",
    "!jest.config.js",
    "!jest.setup.js",
    "!playwright.config.ts",
    "!<rootDir>/tests/**/*.spec.{js,jsx,ts,tsx}", // Exclude Playwright tests
    "!<rootDir>/e2e/**/*.spec.{js,jsx,ts,tsx}", // Exclude Playwright e2e tests
  ],
  coverageDirectory: "coverage",
  coverageProvider: "babel", // Explicitly set provider if needed, default is babel
  coverageReporters: ["json", "lcov", "text", "clover", "json-summary"],
  reporters: [["default", { silent: true, verbose: false }]],
};

module.exports = config; // Export the config object directly
