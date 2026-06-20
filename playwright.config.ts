import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config(); // Loads variables from .env
dotenv.config({ path: ".env.test" }); // Overrides or adds variables from .env

const localBaseURL =
  process.env["BASE_ENDPOINT"] ||
  `http://localhost:${process.env["PORT"] || "3001"}`;
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] || localBaseURL;
const stagingHostname = "staging.6529.io";
const remoteTraceDisabledHostnames = new Set([
  stagingHostname,
  "6529.io",
  "www.6529.io",
]);
const isRemoteReadonlyBaseURL = (() => {
  try {
    return remoteTraceDisabledHostnames.has(new URL(baseURL).hostname);
  } catch {
    return false;
  }
})();
const skipWebServer =
  process.env["PLAYWRIGHT_SKIP_WEB_SERVER"] === "1" ||
  process.env["PLAYWRIGHT_SKIP_WEB_SERVER"] === "true";
const webServerUrl = process.env["PLAYWRIGHT_WEB_SERVER_URL"] || baseURL;
const webServerTimeout = Number(
  process.env["PLAYWRIGHT_WEB_SERVER_TIMEOUT_MS"] || 120000
);
const webServerPort = (() => {
  try {
    return new URL(webServerUrl).port || "3001";
  } catch {
    return "3001";
  }
})();

const config = defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  outputDir: "test-results/playwright",
  timeout: Number(process.env["PLAYWRIGHT_TEST_TIMEOUT_MS"] || 60000),
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  ...(process.env["CI"] && { workers: 1 }),
  reporter: process.env["CI"] ? [["list"], ["html"]] : "html",
  use: {
    baseURL,
    trace: isRemoteReadonlyBaseURL ? "off" : "on-first-retry",
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
          command:
            process.env["PLAYWRIGHT_WEB_SERVER_COMMAND"] || "pnpm run dev",
          env: {
            PORT: webServerPort,
          },
          url: webServerUrl,
          reuseExistingServer: !process.env["CI"],
          timeout: webServerTimeout,
        },
      }),
});

export default config;
