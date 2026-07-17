import type { Locator, Page } from "@playwright/test";

import { DEFAULT_LONG_PRESS_DURATION_MS } from "../../hooks/useLongPressInteraction";
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
import { isCapacitorSimulationProject } from "../support/surfaceSimulation";

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

  test("selects a recipient and creates a synthetic direct-message wave", async ({
    baseURL,
    page,
  }) => {
    await page.goto("/messages/create", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(page.getByText("Search Identity")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    const createButton = page.getByRole("button", { name: "Create" }).last();
    await expect(createButton).toBeDisabled();

    await page.getByLabel("Identity").fill("sandbox");
    await page.getByRole("button", { name: /sandbox-recipient/i }).click();
    await expect(page.getByText("sandbox-recipient").last()).toBeVisible();

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

  test("shows a mobile direct-message reaction immediately and after reload", async ({
    baseURL,
    browserName,
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name) ||
        browserName !== "chromium",
      "This regression requires a Chromium Capacitor simulation for trusted CDP touch input."
    );

    await seedQuickReaction(page);
    await gotoSandboxDirectMessage(page);

    const drop = page.locator('[data-serial-no="1"]').first();
    await openMobileDropMenu(page, drop);

    const quickReactButton = page
      .getByRole("button", { name: "Click to react" })
      .first();
    await expect(quickReactButton).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await quickReactButton.evaluate((button: HTMLButtonElement) =>
      button.click()
    );

    const optimisticReactionChip = reactionChip(drop);
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
});

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

async function openMobileDropMenu(page: Page, drop: Locator) {
  const point = await centerOf(drop);
  const cdp = await page.context().newCDPSession(page);

  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    await page.waitForTimeout(DEFAULT_LONG_PRESS_DURATION_MS + 600);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
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
  return drop.locator("button").filter({ hasText: /^\D*1$/ });
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
