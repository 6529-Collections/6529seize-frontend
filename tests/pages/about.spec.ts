import { test, expect } from '@playwright/test';

test.describe('About Pages', () => {
  test('should load the about/the-memes page', async ({ page }) => {
    await page.goto('/about/the-memes');
    await expect(page).toHaveTitle(/About - THE MEMES | 6529 SEIZE/);
    const text = await page.getByText('large edition, CCO (public domain) NFTs');
    await expect(text).toBeVisible();
  });
  
  test('should display AboutGradients Page', async ({ page }) => {
    await page.goto('/about/6529-gradient');
    await expect(page).toHaveTitle(/About - GRADIENT | 6529 SEIZE/);
    const gradients = await page.locator('[src="/gradients-preview.png"]');
    const text = await page.getByText('We encourage social experimentation');
    await expect(text).toBeVisible();
  });
  
  test('should display AboutSubscriptions Page', async ({ page }) => {
    await page.goto('/about/subscriptions');
    await expect(page).toHaveTitle(/About - SUBSCRIPTIONS | 6529 SEIZE/);
    
    // Look for the specific paragraph containing "Remote Minting"
    const remoteMintingParagraph = page.locator('p.font-larger.font-bolder', { hasText: 'Remote Minting' });
    await expect(remoteMintingParagraph).toBeVisible();
    
    // Additionally, check for some content specific to the Subscriptions page
    const subscriptionContent = page.getByText('It is better to think about subscriptions as');
    await expect(subscriptionContent).toBeVisible();
  });
});
