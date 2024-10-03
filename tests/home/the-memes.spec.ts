import { test, expect } from '@playwright/test';

test.describe('The Memes Page', () => {
  test('should load the memes page', async ({ page }) => {
    await page.goto('/the-memes');
    await expect(page).toHaveTitle(/The Memes/);
  });

  test('should display The Memes header', async ({ page }) => {
    await page.goto('/the-memes');
    const header = page.locator('h1', { hasText: 'The Memes' });
    await expect(header).toBeVisible();
  });

  test('should load memes data and display correctly', async ({ page }) => {
    await page.goto('/the-memes');
    
    // Wait for the meme items to load
    await page.waitForSelector('.row > div > a[href^="/the-memes/"]', { timeout: 10000 });
    
    // Get all meme items
    const memeItems = page.locator('.row > div > a[href^="/the-memes/"]');
    
    // Check if there are meme items
    const count = await memeItems.count();
    expect(count).toBeGreaterThan(0);

    // Check the structure of the first meme item
    if (count > 0) {
      const firstMeme = memeItems.first();
      
      // Check for the image
      await expect(firstMeme.locator('img')).toBeVisible();
      
      // Check for the meme number and title
      const titleElement = firstMeme.locator('.row > .col', { hasText: /#\d+ -/ });
      await expect(titleElement).toBeVisible();
      
      // Check for the date
      const dateElement = firstMeme.locator('.row > .col', { hasText: /ago/ });
      await expect(dateElement).toBeVisible();
    }
  });
});
