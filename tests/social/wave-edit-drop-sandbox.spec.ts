import type { Locator, Page } from "@playwright/test";

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
  getSandboxApiOrigin,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  resetSandboxRequests,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const SANDBOX_WAVE_ID = "00000000-0000-4000-8000-000000000529";
// Mirrors SANDBOX_SUBMITTED_CHAT_DROP_ID in tests/support/composerSandboxServer.cjs.
const SANDBOX_SUBMITTED_CHAT_DROP_ID = "00000000-0000-4000-8000-000000000539";
const SANDBOX_EDIT_PATH = `/api/drops/${SANDBOX_SUBMITTED_CHAT_DROP_ID}`;
const SANDBOX_CHAT_DROP_CONTENT = "Local-only chat drop from Playwright.";
// Mirrors SANDBOX_EDITED_CHAT_DROP_CONTENT in tests/support/composerSandboxServer.cjs.
const SANDBOX_EDITED_CHAT_DROP_CONTENT =
  "Local-only chat drop from Playwright. (edited)";

test.describe.configure({ mode: "serial" });

test.describe("Wave drop edit local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Drop edit sandbox requires the local mock API runner."
  );

  test("cancels with escape, then saves an edit through the real affordance", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);

    // Submit the sandbox drop we will edit: own-authored and inside the edit window.
    const composer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    await composer.fill(SANDBOX_CHAT_DROP_CONTENT);
    // Enter submits the chat composer; the floating quick-DM button overlays
    // the Post button at this viewport, so the keyboard path is the stable one.
    await composer.press("Enter");

    const submittedDrop = page.locator('[data-serial-no="2"]');
    await expect(submittedDrop).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submittedDrop).toContainText(SANDBOX_CHAT_DROP_CONTENT);

    // Escape cancels edit mode without any mutation reaching the API.
    await openDropEditor(page, submittedDrop);
    await page.keyboard.press("Escape");
    await expect(dropEditor(submittedDrop)).toBeHidden({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submittedDrop).toContainText(SANDBOX_CHAT_DROP_CONTENT);
    expect(await fetchEditRequests(baseURL)).toHaveLength(0);

    // Re-enter edit mode, replace the content, and save.
    await openDropEditor(page, submittedDrop);
    const editor = dropEditor(submittedDrop);
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(SANDBOX_EDITED_CHAT_DROP_CONTENT);
    await submittedDrop.getByRole("button", { name: "save" }).click();

    await expect
      .poll(
        async () =>
          (await fetchEditRequests(baseURL)).map((request) => request.kind),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message: "Expected exactly one drop edit to reach the mock API.",
        }
      )
      .toEqual(["allowed-sandbox-mutation"]);

    const editRequests = await fetchEditRequests(baseURL);
    expect(editRequests).toHaveLength(1);
    expect(editRequests[0]).toMatchObject({
      kind: "allowed-sandbox-mutation",
      body: expect.objectContaining({
        content: SANDBOX_EDITED_CHAT_DROP_CONTENT,
        part_count: 1,
        mentioned_users_count: 0,
      }),
    });

    // The editor closes (EditingDropContext resets) and the drop shows the new text.
    await expect(dropEditor(submittedDrop)).toBeHidden({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submittedDrop).toContainText(
      SANDBOX_EDITED_CHAT_DROP_CONTENT
    );
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("rejects tampered edit mutation bodies", async ({ baseURL }) => {
    await resetSandboxRequests(baseURL);

    const response = await fetch(
      `${getSandboxApiOrigin(baseURL)}${SANDBOX_EDIT_PATH}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parts: [
            {
              content: "Unexpected sandbox edit body",
              quoted_drop: null,
              media: [],
            },
          ],
          title: null,
          metadata: [],
          referenced_nfts: [],
          mentioned_users: [],
          mentioned_waves: [],
          signature: null,
        }),
      }
    );

    expect(response.status).toBe(409);
    await expect
      .poll(async () => await fetchSandboxRequests(baseURL), {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
        message: "Expected the mock API to log the rejected edit mutation.",
      })
      .toContainEqual(
        expect.objectContaining({
          method: "POST",
          path: SANDBOX_EDIT_PATH,
          kind: "dangerous-composer-mutation",
        })
      );

    await resetSandboxRequests(baseURL);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

function dropEditor(submittedDrop: Locator): Locator {
  return submittedDrop.getByRole("textbox");
}

async function fetchEditRequests(baseURL: string | undefined) {
  return (await fetchSandboxRequests(baseURL)).filter(
    (request) => request.method === "POST" && request.path === SANDBOX_EDIT_PATH
  );
}

async function openDropEditor(page: Page, submittedDrop: Locator) {
  await dismissNextDevTools(page);
  await submittedDrop.hover();

  const editButton = submittedDrop.getByRole("button", { name: "Edit" });
  await expect(editButton).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await editButton.click();

  await expect(dropEditor(submittedDrop)).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
}

async function gotoSandboxWave(page: Page) {
  await page.route("**/6529-emoji/emoji-list.json**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: [],
      status: 200,
    });
  });

  // Open-graph lookups fire as page-level POST batches; fulfill them in-page
  // so they never count as blocked mutations against the sandbox guard.
  await page.route("**/api/open-graph**", async (route) => {
    if (route.request().method().toUpperCase() === "POST") {
      await route.fulfill({
        contentType: "application/json",
        json: { errors: {}, results: {} },
        status: 200,
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      json: { url: null, title: null, description: null },
      status: 200,
    });
  });

  await page.goto(`/waves/${SANDBOX_WAVE_ID}`, {
    waitUntil: "domcontentloaded",
  });
  await waitForRouteReady(page);
  await expect(page).toHaveURL(new RegExp(`/waves/${SANDBOX_WAVE_ID}$`));
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Local Composer Sandbox Wave",
    })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await expect(
    page.getByRole("textbox", { name: "Write a chat message" }).last()
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}
