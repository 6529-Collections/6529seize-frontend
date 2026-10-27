import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testMatch: "social/wave-loading-sandbox.spec.ts",
  grep: /automatic scrolling/,
  timeout: 180000,
  expect: { timeout: 15000 },
  retries: 0,
  workers: 1,
  outputDir: "test-results/windows-wave-scroll",
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: "playwright-report/windows-wave-scroll", open: "never" },
    ],
  ],
  projects: ["chrome", "msedge"].flatMap((channel) =>
    (["light", "dark"] as const).map((colorScheme) => ({
      name: `windows-${channel}-${colorScheme}`,
      use: {
        browserName: "chromium" as const,
        channel,
        headless: false,
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        colorScheme,
        trace: "off" as const,
        screenshot: "only-on-failure" as const,
      },
    }))
  ),
});
