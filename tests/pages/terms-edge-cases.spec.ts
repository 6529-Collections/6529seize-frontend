import { test, expect } from "../testHelpers";
import { Page } from "@playwright/test";
import { setupWalletMock, setupWalletRejection, setupWalletConnectionError } from "../mocks/walletMock";

// Create a helper to set up a test environment with network errors
async function setupNetworkErrorTest(page: Page) {
  // Navigate to test page
  await page.goto("/test-terms-flow");
  
  // Mock API with a network error
  await page.route("**/api/waves/*", route => route.abort("failed"));
  
  // Trigger the terms flow
  await page.getByRole("button", { name: "Create Drop" }).click();
}

// Helper to test browser navigation during the flow
async function setupNavigationTest(page: Page) {
  // Navigate to test page
  await page.goto("/test-terms-flow");
  
  // Mock the API response
  await page.route("**/api/waves/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-wave-id",
        name: "Test Wave",
        participation: {
          signature_required: true,
          terms: "Test terms for navigation interruption",
          authenticated_user_eligible: true,
          required_metadata: [],
          required_media: []
        },
        wave: { type: "participatory" },
        description_drop: { id: "desc-id" },
        voting: {
          authenticated_user_eligible: true,
          credit_type: "equal",
          forbid_negative_votes: false
        },
        chat: { authenticated_user_eligible: true }
      })
    });
  });
  
  // Set up wallet mock
  await setupWalletMock(page);
  
  // Trigger the flow
  await page.getByRole("button", { name: "Create Drop" }).click();
}

// Helper to test accessibility issues
async function setupAccessibilityTest(page: Page) {
  // Navigate to test page
  await page.goto("/test-terms-flow");
  
  // Mock the API response
  await page.route("**/api/waves/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-wave-id",
        name: "Test Wave",
        participation: {
          signature_required: true,
          terms: "Test terms for accessibility testing",
          authenticated_user_eligible: true,
          required_metadata: [],
          required_media: []
        },
        wave: { type: "participatory" },
        description_drop: { id: "desc-id" },
        voting: {
          authenticated_user_eligible: true,
          credit_type: "equal",
          forbid_negative_votes: false
        },
        chat: { authenticated_user_eligible: true }
      })
    });
  });
  
  // Trigger the flow
  await page.getByRole("button", { name: "Create Drop" }).click();
}

test.describe("Terms Flow Edge Cases and Error Handling", () => {
  test("should handle wallet connection failures gracefully", async ({ page }) => {
    // Set up the wallet connection error
    await setupWalletConnectionError(page);
    
    // Navigate to test page
    await page.goto("/test-terms-flow");
    
    // Mock the API response
    await page.route("**/api/waves/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-wave-id",
          name: "Test Wave",
          participation: {
            signature_required: true,
            terms: "Test terms for wallet connection error",
            authenticated_user_eligible: true,
            required_metadata: [],
            required_media: []
          },
          wave: { type: "participatory" },
          description_drop: { id: "desc-id" },
          voting: {
            authenticated_user_eligible: true,
            credit_type: "equal",
            forbid_negative_votes: false
          },
          chat: { authenticated_user_eligible: true }
        })
      });
    });
    
    // Trigger the terms flow
    await page.getByRole("button", { name: "Create Drop" }).click();
    
    // Verify terms modal appears
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).toBeVisible();
    
    // Accept terms
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await agreeButton.click();
    
    // Verify error message about wallet connection
    const errorMessage = page.locator("div", { hasText: "Wallet connection error" });
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify user can dismiss the error
    const dismissButton = page.getByRole("button", { name: "Dismiss" });
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }
    
    // Verify we return to a state where user can try again
    await expect(page.getByRole("button", { name: "Create Drop" })).toBeVisible();
  });
  
  test("should handle signature rejection properly", async ({ page }) => {
    // Set up the wallet to reject signatures
    await setupWalletRejection(page);
    
    // Navigate to test page
    await page.goto("/test-terms-flow");
    
    // Mock the API response
    await page.route("**/api/waves/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-wave-id",
          name: "Test Wave",
          participation: {
            signature_required: true,
            terms: "Test terms for signature rejection",
            authenticated_user_eligible: true,
            required_metadata: [],
            required_media: []
          },
          wave: { type: "participatory" },
          description_drop: { id: "desc-id" },
          voting: {
            authenticated_user_eligible: true,
            credit_type: "equal",
            forbid_negative_votes: false
          },
          chat: { authenticated_user_eligible: true }
        })
      });
    });
    
    // Trigger the terms flow
    await page.getByRole("button", { name: "Create Drop" }).click();
    
    // Verify terms modal appears and accept terms
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await agreeButton.click();
    
    // Verify error message about signature rejection
    const errorMessage = page.locator("div", { hasText: "Authentication rejected" });
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
  
  test("should handle network errors during terms retrieval", async ({ page }) => {
    await setupNetworkErrorTest(page);
    
    // Verify error message
    const errorMessage = page.locator("div", { hasText: "Error loading terms" });
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify retry button is available
    const retryButton = page.getByRole("button", { name: "Retry" });
    await expect(retryButton).toBeVisible();
    
    // Test the retry functionality
    // First, update the route to succeed on retry
    await page.route("**/api/waves/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-wave-id",
          name: "Test Wave",
          participation: {
            signature_required: true,
            terms: "Test terms loaded after retry",
            authenticated_user_eligible: true,
            required_metadata: [],
            required_media: []
          },
          wave: { type: "participatory" },
          description_drop: { id: "desc-id" },
          voting: {
            authenticated_user_eligible: true,
            credit_type: "equal",
            forbid_negative_votes: false
          },
          chat: { authenticated_user_eligible: true }
        })
      });
    }, { times: 1 });
    
    // Click retry
    await retryButton.click();
    
    // Verify terms modal appears after retry
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).toBeVisible();
    
    // Verify the terms content loaded after retry
    const termsContent = page.locator("div.tw-scrollable-terms");
    await expect(termsContent).toContainText("Test terms loaded after retry");
  });
  
  test("should handle interruptions during the flow", async ({ page }) => {
    await setupNavigationTest(page);
    
    // Verify terms modal appears
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).toBeVisible();
    
    // Simulate navigation during the terms display
    await page.goto("/different-page");
    
    // Navigate back to the test page
    await page.goto("/test-terms-flow");
    
    // Trigger the flow again
    await page.getByRole("button", { name: "Create Drop" }).click();
    
    // Verify terms modal appears again
    await expect(termsModal).toBeVisible();
    
    // This time accept terms
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await agreeButton.click();
    
    // Verify flow completes successfully despite the interruption
    const successMessage = page.locator("div", { hasText: "Drop submitted successfully" });
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });
  
  test("should be accessible with keyboard navigation", async ({ page }) => {
    await setupAccessibilityTest(page);
    
    // Verify terms modal appears
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).toBeVisible();
    
    // Test keyboard navigation through Tab key
    await page.keyboard.press("Tab");
    
    // The scrollable content should receive focus first
    const scrollableContent = page.locator("div.tw-scrollable-terms");
    await expect(scrollableContent).toBeFocused();
    
    // Tab to the checkbox
    await page.keyboard.press("Tab");
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await expect(checkbox).toBeFocused();
    
    // Check the box with space key
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
    
    // Tab to the Cancel button
    await page.keyboard.press("Tab");
    const cancelButton = page.getByRole("button", { name: "Cancel" });
    await expect(cancelButton).toBeFocused();
    
    // Tab to the Agree button
    await page.keyboard.press("Tab");
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await expect(agreeButton).toBeFocused();
    
    // Press Enter to submit
    await page.keyboard.press("Enter");
    
    // Verify flow completes with keyboard navigation
    const successMessage = page.locator("div", { hasText: "Drop submitted successfully" });
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });
  
  test("should handle timeout scenarios gracefully", async ({ page }) => {
    // Navigate to test page
    await page.goto("/test-terms-flow");
    
    // Mock the API with a timeout
    await page.route("**/api/waves/*", async (route) => {
      // Simulate timeout by waiting and then aborting
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.abort("timedout");
    });
    
    // Trigger the terms flow
    await page.getByRole("button", { name: "Create Drop" }).click();
    
    // Verify timeout error message
    const timeoutMessage = page.locator("div", { hasText: "Request timed out" });
    await expect(timeoutMessage).toBeVisible({ timeout: 10000 });
    
    // Verify user can retry
    const retryButton = page.getByRole("button", { name: "Retry" });
    await expect(retryButton).toBeVisible();
  });
});
