import { test, expect } from "../testHelpers";
import { Page } from "@playwright/test";
import { setupWalletMock, setupWalletRejection, setupWalletConnectionError } from "../mocks/walletMock";

// Create mock data for testing
const mockTermsContent = `
# Terms of Service

These are the test terms of service that the user must agree to before proceeding. By accepting these terms, you agree to the conditions specified by the wave creator.

## User Responsibilities
1. You must be at least 18 years old
2. You agree to use the platform responsibly
3. You will not share inappropriate content

## Legal Information
This is a binding agreement between you and the platform. Please read carefully before proceeding.
`;

// Helper to set up the test environment
async function setupTermsTest(page: Page, { walletBehavior = "success" } = {}) {
  // Navigate to a test page
  await page.goto("/test-terms-flow");
  
  // Mock API responses for the wave
  await page.route("**/api/waves/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-wave-id",
        name: "Test Wave with Terms",
        participation: {
          signature_required: true,
          terms: mockTermsContent,
          authenticated_user_eligible: true,
          required_metadata: [],
          required_media: []
        },
        wave: { type: "participatory" },
        description_drop: { id: "desc-id" },
        voting: {
          authenticated_user_eligible: true,
          credit_type: "equal",
          forbid_negative_votes: false,
          period: { min: null, max: null }
        },
        chat: { authenticated_user_eligible: true }
      })
    });
  });
  
  // Set up wallet mocking based on test requirements
  if (walletBehavior === "success") {
    await setupWalletMock(page);
  } else if (walletBehavior === "reject") {
    await setupWalletRejection(page);
  } else if (walletBehavior === "error") {
    await setupWalletConnectionError(page);
  }
  
  // Trigger the terms flow
  await page.getByRole("button", { name: "Create Drop" }).click();
}

test.describe("Terms Flow Integration Tests", () => {
  test("should complete the entire flow successfully", async ({ page }) => {
    await setupTermsTest(page);
    
    // Verify terms modal appears
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).toBeVisible();
    
    // Verify terms content
    const termsContent = page.locator("div.tw-scrollable-terms");
    await expect(termsContent).toContainText("These are the test terms of service");
    
    // Accept terms
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    
    // Click continue
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await agreeButton.click();
    
    // Verify modal is closed after signing
    await expect(termsModal).not.toBeVisible();
    
    // Verify success message appears
    const successMessage = page.locator("div", { hasText: "Drop submitted successfully" });
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });
  
  test("should handle wallet rejection gracefully", async ({ page }) => {
    await setupTermsTest(page, { walletBehavior: "reject" });
    
    // Accept terms
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    
    // Click continue
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await agreeButton.click();
    
    // Verify error message appears
    const errorMessage = page.locator("div", { hasText: "Authentication rejected" });
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
  
  test("should render terms modal responsively on different viewports", async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await setupTermsTest(page);
    
    // Verify modal adapts to small screen
    const modalContainer = page.locator("div.tw-fixed.tw-inset-0");
    await expect(modalContainer).toBeVisible();
    
    // Measure container to verify it's properly sized for mobile
    const containerBoundingBox = await modalContainer.boundingBox();
    expect(containerBoundingBox?.width).toBeLessThanOrEqual(375);
    
    // Close the modal
    await page.getByRole("button", { name: "Cancel" }).click();
    
    // Now test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupTermsTest(page);
    
    // Verify modal size is appropriate for desktop
    const desktopModalContainer = page.locator("div.tw-max-w-3xl");
    await expect(desktopModalContainer).toBeVisible();
    
    // Verify modal is centered and not full width
    const desktopBoundingBox = await desktopModalContainer.boundingBox();
    expect(desktopBoundingBox?.width).toBeLessThan(1280);
    expect(desktopBoundingBox?.width).toBeGreaterThan(500);
  });
  
  test("should allow scrolling through long terms content", async ({ page }) => {
    await setupTermsTest(page);
    
    // Get the scrollable container
    const scrollableTerms = page.locator("div.tw-max-h-\\[400px\\]");
    await expect(scrollableTerms).toBeVisible();
    
    // Verify we can scroll to bottom
    await scrollableTerms.evaluate(element => {
      element.scrollTop = element.scrollHeight;
    });
    
    // Verify scrolling worked (we can see text that was at the bottom)
    await expect(page.locator("text=binding agreement")).toBeVisible();
  });
  
  test("should store terms acknowledgment and not show again", async ({ page }) => {
    await setupTermsTest(page);
    
    // Accept terms first time
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    await page.getByRole("button", { name: "Agree & Continue" }).click();
    
    // Create a second drop
    await page.getByRole("button", { name: "Create Another Drop" }).click();
    
    // Verify terms modal doesn't appear second time (should go straight to signature)
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).not.toBeVisible();
    
    // Verify success message appears directly
    const successMessage = page.locator("div", { hasText: "Drop submitted successfully" });
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });
});