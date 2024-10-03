import { Page, BrowserContext } from '@playwright/test';

let authContext: BrowserContext | null = null;

export async function login(page: Page, baseURL: string) {
  if (authContext) {
    await page.context().addCookies(await authContext.cookies());
    return;
  }

  console.log('Navigating to home page');
  await page.goto(baseURL);
  
  // Handle staging login
  if (page.url().includes('/access')) {
    console.log('Redirected to /access, attempting login...');
    
    const password = process.env.STAGING_PASSWORD;
    console.log(`Using password: ${password ? '*'.repeat(password.length) : 'NOT SET IN ENV'}`);

    const inputField = page.locator('input[type="text"]');
    
    console.log('Filling in and submitting password...');
    await inputField.fill(password);
    await inputField.press('Enter');

    console.log('Waiting for redirect after dismissing confirmation dialog');
    await page.waitForSelector('nav', { timeout: 20000 });
    
    // Check if we're no longer on the /access page
    if (!page.url().includes('/access')) {
      console.log(`Successfully logged in. Current URL: ${page.url()}`);
      authContext = page.context();
    } else {
      throw new Error('Login failed: Still on /access page after submitting password');
    }
  } else {
    console.log('Already on the main page, no login required');
    authContext = page.context();
  }
}

export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

// Add any other helper functions here
