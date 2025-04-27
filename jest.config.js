const nextJest = require('next/jest')();

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!src/lib/testing/**', // Exclude test utilities
    '!src/**/*.d.ts',
    '!**/coverage/**',
    '!**/.next/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!playwright.config.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};

module.exports = createJestConfig(customJestConfig); 
