import { PlaywrightTestConfig } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config(); // Loads variables from .env
dotenv.config({ path: ".env.test" }); // Overrides or adds variables from .env

console.log("Loaded process.env.TEST_BASE_URL", process.env.TEST_BASE_URL);

const config: PlaywrightTestConfig = {
  testDir: "./tests",
  timeout: 70000,
  globalSetup: require.resolve("./tests/globalSetup"),
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.TEST_BASE_URL,
    browserName: "chromium",
    screenshot: "off",
    storageState: "tests/storageState.json",
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
  },
  metadata: {
    testDelay: parseInt(process.env.TEST_DELAY || '200'),
  },
  reporter: [["list"]],
  workers: process.env.TEST_WORKERS ? parseInt(process.env.TEST_WORKERS) : 2,
  fullyParallel: true,
};

export default config;
