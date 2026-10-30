import type { Locator, Page } from "@playwright/test";

import {
  captureSafeScreenshot,
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
import {
  isCapacitorSimulationProject,
  isMobileWebProject,
} from "../support/surfaceSimulation";

const SANDBOX_DM_WAVE_ID = "00000000-0000-4000-8000-000000000532";
const SANDBOX_DROP_ID = "00000000-0000-4000-8000-000000000530";
const SANDBOX_DM_RECIPIENT_WALLET =
  "0x0000000000000000000000000000000000000532";
const REACTION_PATH = `/api/drops/${SANDBOX_DROP_ID}/reaction`;

test.describe("Direct message local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Direct message sandbox requires the local mock API runner."
  );

  test("prepares a recent native conversation without marking it read and reuses it on tap", async ({
    baseURL,
    page,
  }, testInfo) => {
    const isNative = isCapacitorSimulationProject(testInfo.project.name);
    const feedPath = `/api/v2/waves/${SANDBOX_DM_WAVE_ID}/drops`;
    const initialRequests: URL[] = [];
    let releaseFeed!: () => void;
    const feedGate = new Promise<void>((resolve) => {
      releaseFeed = resolve;
    });
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    await page.route("**/api/v2/waves?*", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      const directMessage =
        new URL(route.request().url()).searchParams.get("direct_message") ===
        "true";
      await route.fulfill({
        response,
        json: directMessage
          ? {
              ...body,
              data: [
                {
                  ...body.data[0],
                  id: SANDBOX_DM_WAVE_ID,
                  name: "Sandbox Direct Message",
                  is_private: true,
                  is_dm_wave: true,
                },
              ],
            }
          : body,
      });
    });
    await page.route(`**${feedPath}*`, async (route) => {
      const url = new URL(route.request().url());
      if (!url.searchParams.has("serial_no_limit")) {
        initialRequests.push(url);
        await feedGate;
      }
      await route.fallback();
    });
    try {
      await page.goto("/messages", { waitUntil: "domcontentloaded" });
      const chat = page
        .getByRole("link", { name: "Sandbox Direct Message", exact: true })
        .first();
      await expect(chat).toBeVisible({
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      if (isNative) {
        await expect.poll(() => initialRequests.length).toBe(1);
        expect(initialRequests[0]!.searchParams.get("limit")).toBe("20");
        const requests = await fetchSandboxRequests(baseURL);
        expect(
          requests.filter(
            (request) =>
              request.method === "POST" &&
              request.path.includes("notifications/read")
          )
        ).toEqual([]);
      } else {
        expect(initialRequests).toHaveLength(0);
      }
      // Open while prefetch is pending; it must reuse the same initial request.
      await chat.click();
      await expect(page).toHaveURL(
        new RegExp(`/messages/${SANDBOX_DM_WAVE_ID}$`)
      );
      releaseFeed();
      await expect(
        page
          .getByText(
            "Synthetic local-only direct message body for Playwright.",
            { exact: true }
          )
          .first()
      ).toBeVisible();
      expect(initialRequests).toHaveLength(1);
      await expectNoHorizontalOverflow(page);
      await page.goBack();
      await expect(chat).toBeVisible();
      await page.route(`**${feedPath}*`, async (route) => {
        await refreshGate;
        await route.fallback();
      });
      await chat.click();
      // Cached content remains available even while the newer-message refresh waits.
      await expect(
        page
          .getByText(
            "Synthetic local-only direct message body for Playwright.",
            { exact: true }
          )
          .first()
      ).toBeVisible();
      expect(initialRequests).toHaveLength(1);
      releaseRefresh();
      await captureSafeScreenshot(page, testInfo, "prefetched-direct-message");
      await expectNoUnsafeSandboxMutations(baseURL);
    } finally {
      releaseFeed();
      releaseRefresh();
    }
  });

  test("selects a recipient and creates a synthetic direct-message wave", async ({
    baseURL,
    page,
  }, testInfo) => {
    await page.goto(
      isMobileWebProject(testInfo.project.name)
        ? "/messages?create=dm"
        : "/messages/create",
      { waitUntil: "domcontentloaded" }
    );
    await waitForRouteReady(page);

    await expect(
      page.getByRole("textbox", { name: "To:", exact: true })
    ).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    await expect(
      page.getByRole("button", { name: "Message", exact: true })
    ).toBeDisabled();

    await page
      .getByRole("textbox", { name: "To:", exact: true })
      .fill("sandbox");
    await page.getByRole("button", { name: /sandbox-recipient/i }).click();
    await expect(page.getByText("sandbox-recipient").last()).toBeVisible();

    const createButton = page.getByRole("button", {
      name: "Message sandbox-recipient",
      exact: true,
    });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    await expect(page).toHaveURL(
      new RegExp(`/messages/${escapeRegExp(SANDBOX_DM_WAVE_ID)}$`),
      {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      }
    );
    await expect(page.getByText("Sandbox Direct Message")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expectNoHorizontalOverflow(page);

    const requests = await fetchSandboxRequests(baseURL);
    const createRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.path === "/api/waves/direct-message/new"
    );
    expect(createRequest).toMatchObject({
      kind: "allowed-sandbox-mutation",
      body: { identity_addresses: [SANDBOX_DM_RECIPIENT_WALLET] },
    });
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps recipient results and the action usable after blur and viewport changes", async ({
    page,
  }, testInfo) => {
    const isNative = isCapacitorSimulationProject(testInfo.project.name);
    const longHandle = `id-0x${"1234567890".repeat(4)}`;
    const people = ["simo", longHandle, "simon"].map((handle, index) => ({
      handle,
      normalised_handle: handle,
      wallet: `0x${String(index + 1).padStart(40, "0")}`,
      primary_wallet: null,
      profile_id: `person-${index}`,
      display: handle,
      pfp: null,
      tdh: index === 0 ? 20200 : 0,
      level: 10,
      cic_rating: 0,
    }));
    await page.route("**/community-members?*", async (route) => {
      const query = new URL(route.request().url()).searchParams.get("param");
      await route.fulfill({ json: query === "none" ? [] : people });
    });
    await page.goto(isNative ? "/messages/create" : "/messages?create=dm", {
      waitUntil: "domcontentloaded",
    });
    await waitForRouteReady(page);
    const form = page.getByRole("form", { name: "New message" });
    const input = form.getByRole("textbox", { name: "To:", exact: true });
    await expect(input).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await dismissNextDevTools(page);
    if (!isNative) {
      const emptyPanel = page
        .getByRole("dialog", { name: "New message" })
        .locator(".mobile-wrapper-dialog");
      await expect(emptyPanel).toBeVisible();
      await expect(emptyPanel).toHaveCSS("opacity", "1");
      expect((await emptyPanel.boundingBox())!.height).toBeLessThan(280);
      await expect(
        form.getByRole("button", { name: "Message", exact: true })
      ).toBeDisabled();
      await page.screenshot({
        path: testInfo.outputPath("new-message-empty.png"),
      });
    }
    await input.fill("simo");
    const row = form.getByRole("button", {
      name: "simo Level 10 · 20.2K TDH",
      exact: true,
    });
    await expect(row).toBeVisible();
    await input.blur();
    await expect(row).toBeVisible();
    await row.click();
    await expect(row).toHaveAttribute("aria-pressed", "true");
    await expect(input).toHaveValue("simo");
    await form
      .getByRole("button", { name: `${longHandle} Level 10`, exact: true })
      .click();
    const submit = form.getByRole("button", {
      name: "Message 2 people",
      exact: true,
    });
    await expect(submit).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(input).toHaveCSS("font-size", "16px");
    await page.screenshot({
      path: testInfo.outputPath("new-message-selected.png"),
    });

    if (isNative) {
      await expect(
        page.getByRole("heading", { name: "New message", exact: true })
      ).toBeVisible();
      const formBox = await form.boundingBox();
      const buttonBox = await submit.boundingBox();
      expect(formBox).not.toBeNull();
      expect(buttonBox).not.toBeNull();
      expect(buttonBox!.x - formBox!.x).toBe(16);
      const originalBottom = buttonBox!.y + buttonBox!.height;
      // Browser simulation of the native keyboard's existing layout inset contract.
      await page.evaluate(() =>
        document.documentElement.style.setProperty(
          "--native-keyboard-inset-bottom",
          "290px"
        )
      );
      await expect
        .poll(async () => {
          const box = await submit.boundingBox();
          return box ? box.y + box.height : Infinity;
        })
        .toBeLessThan(originalBottom - 280);
      await page.screenshot({
        path: testInfo.outputPath("new-message-keyboard-inset.png"),
      });
      await page.evaluate(() =>
        document.documentElement.style.removeProperty(
          "--native-keyboard-inset-bottom"
        )
      );
      await expect
        .poll(async () => {
          const box = await submit.boundingBox();
          return box ? Math.abs(box.y + box.height - originalBottom) : Infinity;
        })
        .toBeLessThan(2);
    } else {
      const dialog = page.getByRole("dialog", { name: "New message" });
      const panel = page
        .getByRole("dialog", { name: "New message" })
        .locator(".mobile-wrapper-dialog");
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(panel).toBeVisible();
      if (isMobileWebProject(testInfo.project.name)) {
        const viewport = page.viewportSize()!;
        await expect
          .poll(async () => {
            const box = await panel.boundingBox();
            return box
              ? Math.abs(box.y + box.height - viewport.height)
              : Infinity;
          })
          .toBeLessThan(2);
        const sheetBox = (await panel.boundingBox())!;
        expect(sheetBox.x).toBe(0);
        expect(sheetBox.width).toBe(viewport.width);

        // Responsive presentation must not discard the query or recipients.
        await page.setViewportSize({ width: 1024, height: viewport.height });
        await expect
          .poll(async () => (await panel.boundingBox())?.width)
          .toBe(500);
        await expect(input).toHaveValue("simo");
        await expect(submit).toBeEnabled();
        await page.setViewportSize(viewport);
        await expect
          .poll(async () => (await panel.boundingBox())?.width)
          .toBe(viewport.width);
        await expect(submit).toBeEnabled();
      } else {
        const box = (await panel.boundingBox())!;
        const viewport = page.viewportSize()!;
        expect(box.width).toBe(500);
        expect(box.height).toBeLessThanOrEqual(680);
        expect(Math.abs(box.x - (viewport.width - box.width) / 2)).toBeLessThan(
          2
        );
        // The shared desktop dialog reserves a 24px bottom gutter.
        const expectedTop = (viewport.height - box.height - 24) / 2;
        expect(Math.abs(box.y - expectedTop)).toBeLessThan(2);
      }
    }

    await input.fill("none");
    await expect(form.getByRole("status")).toHaveText(
      "No one found for “none”"
    );
    await input.clear();
    await input.press("Backspace");
    await expect(
      form.getByRole("button", { name: "Message simo", exact: true })
    ).toBeEnabled();
    await expect(
      form.getByRole("button", { name: `Remove ${longHandle}`, exact: true })
    ).toHaveCount(0);
    if (!isNative) {
      await input.press("Escape");
      await expect(
        page.getByRole("dialog", { name: "New message" })
      ).toHaveCount(0);
      await expect(page).toHaveURL(/\/messages$/);
    }
  });

  test("shows a mobile direct-message reaction immediately and after reload", async ({
    baseURL,
    browserName,
    page,
  }, testInfo) => {
    testInfo.skip(
      !isCapacitorSimulationProject(testInfo.project.name) ||
        browserName !== "chromium",
      "This regression requires a Chromium Capacitor simulation for trusted CDP touch input."
    );

    await seedQuickReaction(page);
    await gotoSandboxDirectMessage(page);

    const drop = page.locator('[data-serial-no="1"]').first();
    const quickReactButton = page
      .getByRole("button", { name: "React with Thumbs up" })
      .first();
    await openMobileDropMenu(page, drop, quickReactButton);
    const delayedReaction = await delayReactionResponse(page);

    await expect(quickReactButton).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await quickReactButton.evaluate((button: HTMLButtonElement) =>
      button.click()
    );

    const optimisticReactionChip = reactionChip(drop);
    try {
      await delayedReaction.requestStarted;
      await expect(quickReactButton).toHaveCount(0);
    } finally {
      delayedReaction.release();
    }
    await expect(optimisticReactionChip).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(optimisticReactionChip).toHaveClass(/tw-border-primary-500/);
    await expect
      .poll(async () => getReactionMutationMethods(baseURL))
      .toEqual(["POST"]);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expectSandboxDirectMessageReady(page);

    const persistedDrop = page.locator('[data-serial-no="1"]').first();
    const persistedReactionChip = reactionChip(persistedDrop);
    await expect(persistedReactionChip).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(persistedReactionChip).toHaveClass(/tw-border-primary-500/);
    await persistedReactionChip.click();

    await expect(persistedReactionChip).toHaveCount(0, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect
      .poll(async () => getReactionMutationMethods(baseURL))
      .toEqual(["POST", "DELETE"]);

    const requests = await fetchSandboxRequests(baseURL);
    const allowedRequests = requests.filter(
      (request) =>
        request.kind === "allowed-sandbox-mutation" &&
        request.path === REACTION_PATH
    );
    expect(allowedRequests).toEqual([
      {
        method: "POST",
        path: REACTION_PATH,
        kind: "allowed-sandbox-mutation",
        body: { reaction: ":+1:" },
      },
      {
        method: "DELETE",
        path: REACTION_PATH,
        kind: "allowed-sandbox-mutation",
      },
    ]);
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("closes the mobile reaction menu before a failed response rolls back", async ({
    baseURL,
    browserName,
    page,
  }, testInfo) => {
    testInfo.skip(
      !isCapacitorSimulationProject(testInfo.project.name) ||
        browserName !== "chromium",
      "This regression requires a Chromium Capacitor simulation for trusted CDP touch input."
    );

    await seedQuickReaction(page);
    await gotoSandboxDirectMessage(page);

    const drop = page.locator('[data-serial-no="1"]').first();
    const quickReactButton = page
      .getByRole("button", { name: "React with Thumbs up" })
      .first();
    await openMobileDropMenu(page, drop, quickReactButton);
    const delayedReaction = await delayReactionResponse(page, {
      failureMessage: "Sandbox reaction rejected",
    });

    await quickReactButton.evaluate((button: HTMLButtonElement) =>
      button.click()
    );

    const optimisticReactionChip = reactionChip(drop);
    try {
      await delayedReaction.requestStarted;
      await expect(quickReactButton).toHaveCount(0);
    } finally {
      delayedReaction.release();
    }

    await expect(optimisticReactionChip).toHaveCount(0, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("Sandbox reaction rejected")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    expect(await getReactionMutationMethods(baseURL)).toEqual([]);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

async function delayReactionResponse(
  page: Page,
  options?: { readonly failureMessage?: string }
) {
  let release!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markRequestStarted!: () => void;
  const requestStarted = new Promise<void>((resolve) => {
    markRequestStarted = resolve;
  });

  await page.route(`**${REACTION_PATH}`, async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    markRequestStarted();
    await responseGate;

    if (options?.failureMessage) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: options.failureMessage }),
      });
      return;
    }

    await route.fallback();
  });

  return { release, requestStarted };
}

async function gotoSandboxDirectMessage(page: Page) {
  await page.goto(`/messages/${SANDBOX_DM_WAVE_ID}`, {
    waitUntil: "domcontentloaded",
  });
  await expectSandboxDirectMessageReady(page);
}

async function expectSandboxDirectMessageReady(page: Page) {
  await waitForRouteReady(page);
  await expect(page).toHaveURL(new RegExp(`/messages/${SANDBOX_DM_WAVE_ID}$`));
  await expect(page.getByText("Sandbox Direct Message").first()).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}

async function seedQuickReaction(page: Page) {
  await page.addInitScript(() => {
    globalThis.localStorage.setItem(
      "emoji-mart.frequently",
      JSON.stringify({ "+1": 10 })
    );
  });
}

async function openMobileDropMenu(
  page: Page,
  drop: Locator,
  quickReactButton: Locator
) {
  const point = await centerOf(drop);
  const cdp = await page.context().newCDPSession(page);

  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    await quickReactButton.waitFor({
      state: "visible",
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
  } finally {
    // Cancel the held gesture so its release cannot retarget the opened sheet.
    await cdp
      .send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      })
      .catch(() => undefined);
    await cdp.detach();
  }
}

async function centerOf(target: Locator) {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error(
      "Expected the mobile reaction target to have a layout box."
    );
  }

  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function reactionChip(drop: Locator) {
  return drop.getByRole("button", { name: /^👍\s*1$/ });
}

async function getReactionMutationMethods(baseURL: string | undefined) {
  const requests = await fetchSandboxRequests(baseURL);
  return requests
    .filter((request) => request.path === REACTION_PATH)
    .map((request) => request.method);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
