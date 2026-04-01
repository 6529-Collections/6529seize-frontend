import { defineConfig, devices } from '@playwright/test';
import * as dotenv from "dotenv";

dotenv.config(); // Loads variables from .env
dotenv.config({ path: ".env.test" }); // Overrides or adds variables from .env

const config = defineConfig({
  testDir: './',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  ...(process.env["CI"] && { workers: 1 }),
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001', 
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add other browsers like Firefox, WebKit if needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env["CI"],
    timeout: 120000,
  },
});

export default config;
