import type { Page, Route } from "@playwright/test";

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
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const SANDBOX_WAVE_ID = "00000000-0000-4000-8000-000000000529";
const SANDBOX_DROP_ID = "00000000-0000-4000-8000-000000000530";
const REACTION_PATH = `/api/drops/${SANDBOX_DROP_ID}/reaction`;
const PREVIEW_URL = "https://example.com/6529-composer-preview";
const PREVIEW_TITLE = "Sandbox Preview Title";
const PREVIEW_DESCRIPTION = "Deterministic local preview served by Playwright.";

test.describe.configure({ mode: "serial" });

test.describe("Wave reaction local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Reaction sandbox requires the local mock API runner."
  );

  test("adds and removes a quick reaction through exact sandbox mutations", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);

    const drop = page.locator('[data-serial-no="1"]').first();
    const quickReactButton = drop
      .getByRole("button", { name: "Click to react" })
      .first();

    await drop.hover();
    await expect(quickReactButton).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await quickReactButton.click();

    await expect
      .poll(async () => getReactionMutationMethods(baseURL))
      .toEqual(["POST"]);

    await reloadSandboxWave(page);

    const reactedDrop = page.locator('[data-serial-no="1"]').first();
    const reactionChip = reactedDrop
      .locator("button")
      .filter({ hasText: /^\D*1$/ });
    await expect(reactionChip).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await reactionChip.click();

    await expect(reactionChip).toHaveCount(0, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect
      .poll(async () => getReactionMutationMethods(baseURL))
      .toEqual(["POST", "DELETE"]);

    const requests = await fetchSandboxRequests(baseURL);
    const allowedRequests = requests.filter(
      (request) => request.kind === "allowed-sandbox-mutation"
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

  test("rejects unsupported reaction mutation methods", async ({ baseURL }) => {
    const response = await fetch(
      `${getSandboxApiOrigin(baseURL)}${REACTION_PATH}`,
      {
        body: JSON.stringify({ reaction: ":+1:" }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }
    );

    expect(response.status).toBe(409);
    await expect
      .poll(async () => await fetchSandboxRequests(baseURL))
      .toContainEqual({
        method: "PUT",
        path: REACTION_PATH,
        kind: "dangerous-composer-mutation",
        body: { reaction: ":+1:" },
      });
  });
});

async function gotoSandboxWave(page: Page) {
  await seedQuickReaction(page);
  await installExternalDataFixtures(page);
  await installWaveReadSideEffectFixture(page);
  await installOpenGraphFixture(page);
  await page.goto(`/waves/${SANDBOX_WAVE_ID}`, {
    waitUntil: "domcontentloaded",
  });
  await expectSandboxWaveReady(page);
}

async function reloadSandboxWave(page: Page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await expectSandboxWaveReady(page);
}

async function expectSandboxWaveReady(page: Page) {
  await waitForRouteReady(page);
  await expect(page).toHaveURL(new RegExp(`/waves/${SANDBOX_WAVE_ID}$`));
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Local Composer Sandbox Wave",
    })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
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

async function installExternalDataFixtures(page: Page) {
  await page.route(isSandboxEmojiListRequest, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: [],
      status: 200,
    });
  });
}

function isSandboxEmojiListRequest(url: URL) {
  if (url.pathname === "/api/profile-cms/assets") {
    return (
      url.searchParams.get("url")?.endsWith("/6529-emoji/emoji-list.json") ??
      false
    );
  }

  return url.pathname.endsWith("/6529-emoji/emoji-list.json");
}

async function installWaveReadSideEffectFixture(page: Page) {
  await page.route(
    `**/api/notifications/wave/${SANDBOX_WAVE_ID}/read**`,
    async (route) => {
      const method = route.request().method().toUpperCase();
      if (method !== "OPTIONS" && method !== "POST") {
        // This fixture only owns the local mark-read side effect.
        await route.continue();
        return;
      }

      await route.fulfill({
        headers: {
          "Access-Control-Allow-Headers":
            "authorization, content-type, x-6529-auth, x-api-key",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Origin": "*",
        },
        status: 204,
      });
    }
  );
}

async function installOpenGraphFixture(page: Page) {
  await page.route("**/api/open-graph**", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();

    if (method === "POST") {
      await fulfillOpenGraphBatch(route);
      return;
    }

    const url = new URL(request.url());
    const targetUrl = url.searchParams.get("url") || PREVIEW_URL;
    await route.fulfill({
      contentType: "application/json",
      json: previewFor(targetUrl),
      status: 200,
    });
  });
}

async function fulfillOpenGraphBatch(route: Route) {
  const batchUrls = openGraphBatchUrls(route);

  await route.fulfill({
    contentType: "application/json",
    json: {
      errors: {},
      results: Object.fromEntries(
        batchUrls.map((url) => [url, previewFor(url)])
      ),
    },
    status: 200,
  });
}

function openGraphBatchUrls(route: Route) {
  let urls: unknown;

  try {
    urls = (route.request().postDataJSON() as { urls?: unknown }).urls;
  } catch {
    return [PREVIEW_URL];
  }

  return Array.isArray(urls)
    ? urls.filter((url): url is string => typeof url === "string")
    : [PREVIEW_URL];
}

function previewFor(url: string) {
  return {
    url,
    title: PREVIEW_TITLE,
    description: PREVIEW_DESCRIPTION,
    siteName: "Example Sandbox",
    mediaType: "article",
  };
}

async function getReactionMutationMethods(baseURL: string | undefined) {
  const requests = await fetchSandboxRequests(baseURL);
  return requests
    .filter((request) => request.path === REACTION_PATH)
    .map((request) => request.method);
}
