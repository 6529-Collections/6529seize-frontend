import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  dismissNextDevTools,
  expectNoUnsafeSandboxMutations,
  fetchSandboxRequests,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const SANDBOX_SIGNATURE_WAVE_ID = "00000000-0000-4000-8000-000000000540";
const SANDBOX_SIGNATURE_TERMS =
  "Local-only signature sandbox terms. Unsigned drops must not be submitted.";
const SIGNATURE_FAILED_MESSAGE_PATTERN =
  /Signature failed\. Make sure your wallet is connected and unlocked/i;
const NEGATIVE_ASSERTION_WINDOW_MS = 1500;
const NEGATIVE_ASSERTION_INTERVAL_MS = 100;

test.describe.configure({ mode: "serial" });

test.describe("Waves signed drop local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Signed drop sandbox requires the local authenticated mock API runner."
  );

  test.describe("submit dialog keyboard layout", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("keeps the composer and metadata above the native keyboard", async ({
      baseURL,
      page,
    }) => {
      await gotoSignedSandboxWave(page);
      await page.getByRole("button", { name: "Submit drop" }).click();
      const dialog = page.getByRole("dialog", { name: "Submit drop" });
      const panel = page.getByTestId("chat-submit-drop-modal-panel");
      const composer = dialog.getByRole("textbox", { name: "Create a drop" });
      await expect(dialog).toBeVisible();
      await composer.fill("Local keyboard layout check.");

      const keyboardInset = 320;
      await page.evaluate((inset) => {
        document.documentElement.style.setProperty(
          "--native-keyboard-inset-bottom",
          `${inset}px`
        );
      }, keyboardInset);
      const keyboardTop = 844 - keyboardInset;
      const readBottom = (locator: ReturnType<Page["locator"]>) =>
        locator.evaluate((element) => element.getBoundingClientRect().bottom);
      await expect
        .poll(() => readBottom(panel))
        .toBeLessThanOrEqual(keyboardTop);
      await expect
        .poll(() => readBottom(composer))
        .toBeLessThanOrEqual(keyboardTop);

      await expect(
        dialog.getByRole("button", { name: "Add field", exact: true })
      ).toHaveCount(0);
      const showActions = dialog.getByRole("button", {
        name: "Show composer actions",
      });
      if (await showActions.isVisible()) await showActions.click();
      await dialog
        .getByRole("button", { name: /^(Add metadata|Metadata)$/ })
        .click();
      for (let row = 0; row < 8; row += 1) {
        await dialog
          .getByRole("button", { name: "Add field", exact: true })
          .click();
        await expect(
          dialog
            .getByRole("textbox", { name: "Field name", exact: true })
            .last()
        ).toBeFocused();
      }
      const metadataValue = dialog
        .getByRole("textbox", { name: "Value", exact: true })
        .last();
      await metadataValue.focus();
      await expect
        .poll(() =>
          metadataValue.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const scrollport = element.closest(
              '[data-testid="chat-submit-drop-modal-panel"]'
            )?.lastElementChild;
            return (
              !!scrollport &&
              rect.top >= scrollport.getBoundingClientRect().top &&
              rect.bottom <= scrollport.getBoundingClientRect().bottom
            );
          })
        )
        .toBe(true);
      await expect
        .poll(() => readBottom(metadataValue))
        .toBeLessThanOrEqual(keyboardTop);
      await expectNoHorizontalOverflow(page);

      await page.evaluate(() => {
        document.documentElement.style.setProperty(
          "--native-keyboard-inset-bottom",
          "0px"
        );
      });
      await expect.poll(() => readBottom(panel)).toBeGreaterThan(keyboardTop);
      await dialog
        .getByRole("button", { name: "Close modal", exact: true })
        .click();
      await expect(dialog).toBeHidden();
      await expectNoUnsafeSandboxMutations(baseURL);
    });
  });

  test("requires terms and fails closed before unsigned drop submission", async ({
    baseURL,
    page,
  }) => {
    await gotoSignedSandboxWave(page);

    await page.getByRole("button", { name: "Submit drop" }).click();
    const submitDialog = page.getByRole("dialog", { name: "Submit drop" });
    await expect(submitDialog).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    await submitDialog
      .getByRole("textbox", { name: "Create a drop" })
      .fill(
        "Signed sandbox drop should not submit without a wallet signature."
      );
    await submitDialog
      .getByRole("button", { name: "Drop", exact: true })
      .click();

    const termsDialog = page.getByRole("dialog", {
      name: "Terms of Service",
    });
    await expect(termsDialog).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(termsDialog.getByText(SANDBOX_SIGNATURE_TERMS)).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Agree to terms of service checkbox" })
      .click();
    await page.getByRole("button", { name: "Agree & Continue" }).click();

    await expect(termsDialog).toBeHidden({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText(SIGNATURE_FAILED_MESSAGE_PATTERN)).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submitDialog).toBeVisible();
    await expectNoUnsignedDropMutation(baseURL);
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

async function gotoSignedSandboxWave(page: Page) {
  await installExternalDataFixtures(page);
  await page.goto(`/waves/${SANDBOX_SIGNATURE_WAVE_ID}`, {
    waitUntil: "domcontentloaded",
  });
  await waitForRouteReady(page);
  await expect(page).toHaveURL(
    new RegExp(`/waves/${SANDBOX_SIGNATURE_WAVE_ID}$`)
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Local Signature Sandbox Wave",
    })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await expect(page.getByRole("button", { name: "Submit drop" })).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}

async function installExternalDataFixtures(page: Page) {
  await page.route("**/6529-emoji/emoji-list.json**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: [],
      status: 200,
    });
  });
}

async function expectNoUnsignedDropMutation(baseURL: string | undefined) {
  const deadline = Date.now() + NEGATIVE_ASSERTION_WINDOW_MS;

  while (Date.now() < deadline) {
    const requests = await fetchSandboxRequests(baseURL);
    const dropMutations = requests.filter(
      (request) => request.method === "POST" && request.path === "/api/drops"
    );

    expect(
      dropMutations,
      `Expected signing failure to happen before any /api/drops POST. Requests: ${JSON.stringify(
        requests
      )}`
    ).toEqual([]);

    await new Promise((resolve) =>
      setTimeout(resolve, NEGATIVE_ASSERTION_INTERVAL_MS)
    );
  }
}
