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
const webServerCommand =
  process.env["PLAYWRIGHT_WEB_SERVER_COMMAND"] ||
  "node scripts/require-6529-command.cjs && node scripts/dev-with-fallback.cjs";
const forceWebServer =
  process.env["PLAYWRIGHT_FORCE_WEB_SERVER"] === "1" ||
  process.env["PLAYWRIGHT_FORCE_WEB_SERVER"] === "true";

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
      name: "web-desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "web-mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "web-desktop-firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "web-desktop-webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "capacitor-ios-sim",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "capacitor-android-sim",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "electron-shell-sim",
      use: {
        ...devices["Desktop Chrome"],
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 6529.io/1.0.0 Chrome/124.0.0.0 Electron/31.0.0 Safari/537.36",
      },
    },
  ],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: webServerCommand,
          env: {
            PORT: webServerPort,
          },
          url: webServerUrl,
          reuseExistingServer: !process.env["CI"] && !forceWebServer,
          timeout: webServerTimeout,
        },
      }),
});

export default config;
