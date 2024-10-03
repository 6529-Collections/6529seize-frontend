import { chromium, FullConfig } from '@playwright/test';
import { login } from './testHelpers';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    if (baseURL) {
      await login(page, baseURL);
    } else {
      throw new Error('baseURL is not defined in the configuration');
    }
    
    // Save signed-in state to 'storageState.json'
    await context.storageState({ path: 'storageState.json' });
  } catch (error) {
    console.error('Error during global setup:', error);
    throw error;  // Re-throw the error to fail the setup
  } finally {
    await browser.close();
  }
}

export default globalSetup;
