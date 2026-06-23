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

const SANDBOX_WALLET = "0x0000000000000000000000000000000000000529";
const SANDBOX_CREATED_WAVE_ID = "00000000-0000-4000-8000-000000000536";
const SANDBOX_ADMIN_GROUP_ID = "00000000-0000-4000-8000-000000000537";
const SANDBOX_CREATED_WAVE_NAME = "Sandbox Created Wave";
const SANDBOX_CREATED_WAVE_DESCRIPTION =
  "Local-only create-wave description for Playwright.";

test.describe.configure({ mode: "serial" });

test.describe("Create wave local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Create-wave sandbox requires the local mock API runner."
  );

  test("creates a chat wave with only explicit sandbox mutations", async ({
    baseURL,
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill(SANDBOX_CREATED_WAVE_NAME);
    await expect(nextStepButton(page)).toBeEnabled();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can view" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Who can chat" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.getByText("Anyone").first()).toBeVisible();
    await expect(page.getByText("Only me").first()).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await fillDescription(page, SANDBOX_CREATED_WAVE_DESCRIPTION);
    await page.getByRole("button", { name: "Complete" }).click();
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" &&
              ["/api/groups", "/api/waves"].includes(request.path)
          ),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message: "Expected create-wave submit to reach the sandbox mock API.",
        }
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "/api/groups",
            kind: "allowed-sandbox-mutation",
          }),
          expect.objectContaining({
            path: "/api/waves",
            kind: "allowed-sandbox-mutation",
          }),
        ])
      );

    await expect(page).toHaveURL(
      new RegExp(`/waves/${SANDBOX_CREATED_WAVE_ID}$`),
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: SANDBOX_CREATED_WAVE_NAME,
      })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(
      page.getByText(SANDBOX_CREATED_WAVE_DESCRIPTION).first()
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const requests = await fetchSandboxRequests(baseURL);
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "POST",
          path: "/api/groups",
          kind: "allowed-sandbox-mutation",
          body: {
            name: "Only playwright",
            identity_addresses: [SANDBOX_WALLET],
          },
        }),
        expect.objectContaining({
          method: "POST",
          path: `/api/groups/${SANDBOX_ADMIN_GROUP_ID}/visible`,
          kind: "allowed-sandbox-mutation",
          body: {
            visible: true,
            old_version_id: null,
          },
        }),
        expect.objectContaining({
          method: "POST",
          path: "/api/waves",
          kind: "allowed-sandbox-mutation",
          body: expect.objectContaining({
            name: SANDBOX_CREATED_WAVE_NAME,
            admin_group_id: SANDBOX_ADMIN_GROUP_ID,
            description: SANDBOX_CREATED_WAVE_DESCRIPTION,
          }),
        }),
      ])
    );
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

async function gotoCreateWave(page: Page) {
  await installExternalDataFixtures(page);
  await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(page).toHaveURL(/\/waves\/create$/);
  await expect(page.getByLabel(/Wave Name/)).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}

async function fillDescription(page: Page, text: string) {
  const editor = page.locator('[contenteditable="true"]').last();
  await expect(editor).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await editor.fill(text);
}

function nextStepButton(page: Page) {
  return page.getByRole("button", { name: "Next", exact: true });
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
