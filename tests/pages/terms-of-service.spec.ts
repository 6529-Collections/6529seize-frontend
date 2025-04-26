import { test, expect } from "../testHelpers";
import { Page } from "@playwright/test";

// Create a mock wave with terms requirements
const mockWaveWithTerms = {
  id: "test-wave-id",
  name: "Test Wave",
  participation: {
    signature_required: true,
    terms: "These are the test terms of service that the user must agree to before proceeding. By accepting these terms, you agree to the conditions specified by the wave creator.",
    authenticated_user_eligible: true,
    required_metadata: [],
    required_media: []
  },
  wave: {
    type: "participatory"
  },
  description_drop: {
    id: "description-id"
  },
  voting: {
    authenticated_user_eligible: true,
    credit_type: "equal",
    forbid_negative_votes: false
  },
  chat: {
    authenticated_user_eligible: true
  }
};

// Mock functions for testing
async function mockWaveData(page: Page) {
  await page.route("**/api/waves/*", async (route) => {
    await route.fulfill({
      status: 200, 
      contentType: "application/json",
      body: JSON.stringify(mockWaveWithTerms)
    });
  });
}

// Create a helper to simulate creating a drop with terms
async function simulateCreateDrop(page: Page) {
  // Navigate to a wave page (would be mocked)
  await page.goto("/waves/test-wave-id");
  
  // Fill in drop content
  await page.locator("div[contenteditable='true']").fill("This is a test drop");
  
  // Click the submit button
  await page.getByRole("button", { name: "Drop" }).click();
}

test.describe("Terms of Service Modal", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API to return a wave that requires terms acceptance
    await mockWaveData(page);
  });

  test("should display terms modal when submitting a drop", async ({ page }) => {
    await simulateCreateDrop(page);
    
    // The terms modal should appear
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).toBeVisible();
    
    // The terms content should be displayed
    const termsContent = page.locator("div.tw-scrollable-terms");
    await expect(termsContent).toBeVisible();
    await expect(termsContent).toContainText("These are the test terms of service");
  });

  test("should disable Agree button until checkbox is checked", async ({ page }) => {
    await simulateCreateDrop(page);
    
    // The Agree button should be disabled initially
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await expect(agreeButton).toBeDisabled();
    
    // Check the checkbox
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    
    // The Agree button should now be enabled
    await expect(agreeButton).toBeEnabled();
  });

  test("should close modal when Cancel button is clicked", async ({ page }) => {
    await simulateCreateDrop(page);
    
    // The terms modal should appear
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).toBeVisible();
    
    // Click the Cancel button
    const cancelButton = page.getByRole("button", { name: "Cancel" });
    await cancelButton.click();
    
    // The modal should disappear
    await expect(termsModal).not.toBeVisible();
  });

  test("should proceed to signature request when terms are accepted", async ({ page }) => {
    // This test would need to mock the wallet interaction
    // For now, we'll just verify the flow up to that point
    
    await simulateCreateDrop(page);
    
    // Check the checkbox
    const checkbox = page.getByLabel("I have read and agree to the terms of service");
    await checkbox.check();
    
    // Click Agree & Continue
    const agreeButton = page.getByRole("button", { name: "Agree & Continue" });
    await agreeButton.click();
    
    // The modal should close
    const termsModal = page.locator("div", { hasText: "Terms of Service" }).first();
    await expect(termsModal).not.toBeVisible();
    
    // Here we would normally expect the wallet signature request to appear
    // But for testing purposes, we'd need to mock that interaction
  });
});