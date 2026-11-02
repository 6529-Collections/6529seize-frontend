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

import { isCapacitorSimulationProject } from "../support/surfaceSimulation";

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
    hasTouch,
    browserName,
  }, testInfo) => {
    if (hasTouch) {
      await page.addInitScript(() => {
        // Seed only the unrelated wallet SDK telemetry IDs: their initializers
        // also require randomUUID. The submission API must still work without it.
        for (const key of ["cbwsdk.store", "base-acc-sdk.store"]) {
          localStorage.setItem(
            key,
            JSON.stringify({
              state: {
                config: { deviceId: "00000000-0000-4000-8000-000000000529" },
              },
              version: 0,
            })
          );
        }
      });
    }
    await gotoSandboxWave(
      page,
      isCapacitorSimulationProject(testInfo.project.name)
    );
    if (hasTouch) {
      // Model the HTTP LAN origin's crypto API before submitting or editing.
      await page.evaluate(() => {
        Object.defineProperty(globalThis.crypto, "randomUUID", {
          configurable: true,
          value: undefined,
        });
      });
    }

    // Submit the sandbox drop we will edit: own-authored and inside the edit window.
    const composer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    await composer.fill(SANDBOX_CHAT_DROP_CONTENT);
    // Real pointer click on purpose: regression coverage for the quick-DM
    // launcher overlaying the Post button (WaveComposerDockVisibility).
    await page.getByRole("button", { name: "Post" }).last().click();

    const submittedDrop = page
      .getByRole("main")
      .locator('[data-serial-no="2"]');
    await expect(submittedDrop).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submittedDrop).toContainText(SANDBOX_CHAT_DROP_CONTENT);
    await expect(composer).toBeFocused();
    await expect(composer).toHaveText("");

    // Escape cancels edit mode without any mutation reaching the API.
    await openDropEditor(page, submittedDrop, hasTouch);
    await expect(dropEditor(submittedDrop)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dropEditor(submittedDrop)).toBeHidden({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submittedDrop).toContainText(SANDBOX_CHAT_DROP_CONTENT);
    expect(await fetchEditRequests(baseURL)).toHaveLength(0);

    // Re-enter edit mode, replace the content, and save.
    await openDropEditor(page, submittedDrop, hasTouch);
    const editor = dropEditor(submittedDrop);
    if (hasTouch) await editor.tap();
    else await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(SANDBOX_EDITED_CHAT_DROP_CONTENT);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("d");
    await expect(editor).toHaveText(SANDBOX_EDITED_CHAT_DROP_CONTENT);
    await expect(editor).toBeFocused();
    if (hasTouch) {
      await holdTouch(page, editor);
      await expect(editor).toBeVisible();
      await expect(editor).toBeFocused();
      await expect(editor).toHaveText(SANDBOX_EDITED_CHAT_DROP_CONTENT);
      await expect(
        page.getByRole("button", { name: "Edit Message", exact: true })
      ).toBeHidden();
      await expect(editor).toHaveCSS(
        browserName === "webkit" ? "-webkit-user-select" : "user-select",
        "text"
      );
    }
    const screenshotPath = testInfo.outputPath("inline-editor.png");
    await page.screenshot({ path: screenshotPath });
    await testInfo.attach("inline editor after cursor and touch gestures", {
      path: screenshotPath,
      contentType: "image/png",
    });
    await submittedDrop.getByRole("button", { name: /^save$/i }).click();

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
    await expect(submittedDrop).toContainText(SANDBOX_EDITED_CHAT_DROP_CONTENT);
    if (hasTouch) {
      await holdTouch(
        page,
        submittedDrop.getByText(SANDBOX_EDITED_CHAT_DROP_CONTENT, {
          exact: true,
        }),
        "touchCancel"
      );
      await page
        .getByRole("button", { name: "Edit Message", exact: true })
        .tap();
      await submittedDrop.getByRole("button", { name: /^cancel$/i }).tap();
      await expect(editor).toBeHidden();
      expect(await fetchEditRequests(baseURL)).toHaveLength(1);
    }
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

async function openDropEditor(
  page: Page,
  submittedDrop: Locator,
  hasTouch: boolean
) {
  await dismissNextDevTools(page);
  if (hasTouch) {
    // Model a keyboard that has not finished dismissing when actions appear.
    const previousInset = await page.evaluate(() => {
      const style = document.documentElement.style;
      const previous = style.getPropertyValue("--native-keyboard-inset-bottom");
      style.setProperty("--native-keyboard-inset-bottom", "300px");
      return previous;
    });
    await holdTouch(
      page,
      submittedDrop.getByText(SANDBOX_CHAT_DROP_CONTENT, { exact: true }),
      "touchCancel"
    );
    const container = page
      .getByRole("dialog", { name: "Drop actions", exact: true })
      .locator(".tw-pointer-events-none.tw-fixed.tw-inset-x-0");
    // The sheet now uses a layout bottom offset, rather than a transform.
    // Assert the same final-position guarantee while the keyboard closes.
    const bottomOffset = () =>
      container.evaluate((element) =>
        Math.abs(window.innerHeight - element.getBoundingClientRect().bottom)
      );
    await expect.poll(bottomOffset).toBeLessThanOrEqual(1);
    await page.evaluate((previous) => {
      const style = document.documentElement.style;
      if (previous)
        style.setProperty("--native-keyboard-inset-bottom", previous);
      else style.removeProperty("--native-keyboard-inset-bottom");
    }, previousInset);
    await expect.poll(bottomOffset).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Edit Message", exact: true }).tap();
    await expect(dropEditor(submittedDrop)).toBeVisible();
    return;
  }
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

async function holdTouch(
  page: Page,
  target: Locator,
  release: "touchEnd" | "touchCancel" = "touchEnd"
) {
  await target.tap({ trial: true });
  const box = await target.boundingBox();
  if (!box) throw new Error("Touch target is not visible.");
  const x = box.x + Math.min(20, box.width / 2);
  const y = box.y + Math.min(15, box.height / 2);
  if (page.context().browser()?.browserType().name() !== "chromium") {
    // Playwright has no trusted hold API for WebKit. Exercise the same DOM
    // touch sequence there; Chromium supplies real touch-input coverage.
    const element = await target.elementHandle();
    if (!element) throw new Error("Touch target is not attached.");
    try {
      await element.dispatchEvent("touchstart", {
        touches: [{ identifier: 0, clientX: x, clientY: y }],
      });
      await page.waitForTimeout(750);
      await element.dispatchEvent(
        release === "touchEnd" ? "touchend" : "touchcancel",
        { touches: [] }
      );
    } finally {
      await element.dispose();
    }
    return;
  }
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    // A stationary hold must exceed the drop's 500ms action-sheet threshold.
    await page.waitForTimeout(750);
    await touch.send("Input.dispatchTouchEvent", {
      // Cancel menu-entry gestures to avoid Chromium retargeting the release
      // click into the newly portaled sheet. Editor regression gestures end normally.
      type: release,
      touchPoints: [],
    });
  } finally {
    await touch.detach();
  }
}

async function gotoSandboxWave(page: Page, nativeHeader: boolean) {
  // The touch sheet requests curation memberships; this fixture has none.
  await page.route("**/api/drops/*/curations**", async (route) => {
    await route.fulfill({ json: [] });
  });
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
  // The development indicator can overlap inline Save on native layouts.
  // Runtime errors still fail through the shared page diagnostics fixture.
  await page.addStyleTag({ content: "nextjs-portal { visibility: hidden; }" });
  await expect(page).toHaveURL(new RegExp(`/waves/${SANDBOX_WAVE_ID}$`));
  await expect(
    nativeHeader
      ? page.getByRole("button", {
          name: "About Local Composer Sandbox Wave",
          exact: true,
        })
      : page.getByRole("heading", {
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
