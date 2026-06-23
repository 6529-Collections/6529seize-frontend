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

test.describe.configure({ mode: "serial" });

test.describe("Waves signed drop local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Signed drop sandbox requires the local authenticated mock API runner."
  );

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

    await expect(
      page.getByRole("dialog", { name: "Terms of Service" })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(page.getByText(SANDBOX_SIGNATURE_TERMS)).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Agree to terms of service checkbox" })
      .click();
    await page.getByRole("button", { name: "Agree & Continue" }).click();

    await expect(
      page.getByRole("dialog", { name: "Terms of Service" })
    ).toBeHidden({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
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
}
