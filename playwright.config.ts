import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config(); // Loads variables from .env
dotenv.config({ path: ".env.test" }); // Overrides or adds variables from .env

const baseURL = process.env["PLAYWRIGHT_BASE_URL"] || "http://localhost:3001";
const stagingHostname = "staging.6529.io";
const isStagingBaseURL = (() => {
  try {
    return new URL(baseURL).hostname === stagingHostname;
  } catch {
    return false;
  }
})();
const skipWebServer =
  process.env["PLAYWRIGHT_SKIP_WEB_SERVER"] === "1" ||
  process.env["PLAYWRIGHT_SKIP_WEB_SERVER"] === "true";
const webServerUrl =
  process.env["PLAYWRIGHT_WEB_SERVER_URL"] || "http://localhost:3001";

const config = defineConfig({
  testDir: "./",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  ...(process.env["CI"] && { workers: 1 }),
  reporter: "html",
  use: {
    baseURL,
    trace: isStagingBaseURL ? "off" : "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: "./bin/6529 run dev",
          url: webServerUrl,
          reuseExistingServer: !process.env["CI"],
          timeout: 120000,
        },
      }),
});

export default config;
