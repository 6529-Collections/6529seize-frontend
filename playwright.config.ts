import { PlaywrightTestConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config(); // Loads variables from .env
dotenv.config({ path: '.env.local' }); // Overrides or adds variables from .env.local

console.log('loaded process.env.TEST_BASE_URL', process.env.TEST_BASE_URL);

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 70000,
  globalSetup: require.resolve('./tests/globalSetup'),
  use: {
    baseURL: process.env.TEST_BASE_URL,
    browserName: 'chromium',
    screenshot: 'off',
    storageState: 'storageState.json',
    trace: 'on-first-retry',
  },
  reporter: [
    ['list'],
  ],
  workers: '50%',
  fullyParallel: true,
};

export default config;
