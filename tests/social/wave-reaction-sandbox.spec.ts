import type { Page, Route } from "@playwright/test";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";

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
      .getByRole("button", { name: "React with Thumbs up" })
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

  test("confirms committed add and remove after losing their responses without replay", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);
    await installCanonicalDropReadFixture(page);
    await page.route(`**${REACTION_PATH}`, async (route) => {
      if (!["POST", "DELETE"].includes(route.request().method())) {
        await route.fallback();
        return;
      }
      // Commit in the mock API, then lose the response on its way to the client.
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("connectionreset");
    });
    const drop = page.getByRole("main").locator('[data-serial-no="1"]').first();
    await drop.hover();
    const waitForRecoveryRead = () =>
      page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/v2/drops" && response.ok()
      );
    const added = waitForRecoveryRead();
    await drop
      .getByRole("button", { name: "React with Thumbs up" })
      .first()
      .click();
    await added;
    await expect
      .poll(() => getReactionMutationMethods(baseURL))
      .toEqual(["POST"]);
    const chip = page
      .getByRole("main")
      .locator('[data-serial-no="1"]')
      .first()
      .getByRole("button")
      .filter({ hasText: /^\D*1$/ });
    await expect(chip).toBeVisible();
    // A saved reaction must not surface a failure toast or be rolled back.
    // Next's route announcer is an empty alert; any notification text fails.
    const failureToast = page.getByRole("alert").filter({ hasText: /\S/ });
    await expect(failureToast).toHaveCount(0);
    const removed = waitForRecoveryRead();
    await chip.click();
    await removed;
    await expect
      .poll(() => getReactionMutationMethods(baseURL))
      .toEqual(["POST", "DELETE"]);
    await expect(chip).toHaveCount(0);
    await expect(failureToast).toHaveCount(0);
    await reloadSandboxWave(page);
    await expect(chip).toHaveCount(0);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("retains quick-reaction history after reopening and selecting from the picker", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);
    const drop = page.getByRole("main").locator('[data-serial-no="1"]').first();
    const openPicker = async () => {
      await drop.hover();
      await drop.getByRole("button", { name: "Add reaction to drop" }).click();
      await expect(
        page.getByRole("button", { name: "Frequently used", exact: true })
      ).toBeVisible();
    };

    // Opening the picker primes its cached history before a quick reaction.
    await openPicker();
    await page.keyboard.press("Escape");
    await drop.hover();
    await drop
      .getByRole("button", { name: "React with Thumbs up" })
      .first()
      .click();
    await expect
      .poll(async () => getReactionMutationMethods(baseURL))
      .toEqual(["POST"]);

    await page
      .getByRole("button", { name: "Open emoji picker", exact: true })
      .click();
    await page.getByPlaceholder("Search", { exact: true }).fill("smile");
    await page.getByRole("button", { name: "😄", exact: true }).click();
    await expect(
      drop
        .getByRole("button", { name: /^React with / })
        .filter({ hasText: "😄" })
    ).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("emoji-mart.frequently") ?? "{}")
        )
      )
      .toEqual({ "+1": 11, smile: 1 });

    await openPicker();
    await expect(
      page.getByRole("button", { name: "😄", exact: true }).first()
    ).toBeVisible();
    await page.keyboard.press("Escape");
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

async function installCanonicalDropReadFixture(page: Page) {
  await page.route("**/api/v2/drops?**", async (route) => {
    const url = new URL(route.request().url());
    const ids = new Set(url.searchParams.get("ids")?.split(",") ?? []);
    // The sandbox's batch endpoint is an empty page. Serve the actual current
    // drop from its stateful wave read, including the embedded-wave contract.
    const response = await route.fetch({
      url: new URL(`/api/v2/waves/${SANDBOX_WAVE_ID}/drops`, url).toString(),
    });
    expect(response.ok()).toBe(true);
    const feed = (await response.json()) as ApiWaveDropsFeedV2;
    await route.fulfill({
      json: {
        data: feed.drops
          .filter((drop) => ids.has(drop.id))
          .map((drop) => ({ ...drop, wave: feed.wave })),
        page: 1,
        next: false,
      },
    });
  });
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

test.describe("Live reaction details @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Reaction details use only synthetic local data."
  );

  test("keeps the tooltip and open dialog current without reloading or fetching hidden lists", async ({
    page,
    baseURL,
  }, testInfo) => {
    const fixture = await installReactionDetailsFixture(page, baseURL);
    await gotoSandboxWave(page);
    const drop = page
      .getByRole("tabpanel", { includeHidden: true })
      .locator('[data-serial-no="1"]');
    const chip = drop.getByRole("button", { name: "👍 4", exact: true });
    await expect(chip).toBeVisible();
    expect(fixture.detailReads()).toBe(0);
    await chip.hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toContainText("alice");
    await expect(tooltip).toContainText("bob");
    await tooltip
      .getByRole("button", { name: "and 1 other", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Reactions", exact: true });
    await expect(
      dialog.getByRole("link", { name: "dave dave", exact: true })
    ).toBeVisible();
    const surface = page
      .getByRole("dialog", { name: "Reactions", exact: true })
      .locator(".mobile-wrapper-dialog");
    await surface.evaluate(async (element) => {
      const animations: Animation[] = [];
      for (
        let node: Element | null = element;
        node;
        node = node.parentElement
      ) {
        animations.push(...node.getAnimations());
      }
      await Promise.all(
        animations.map((animation) => animation.finished.catch(() => undefined))
      );
    });
    const dialogBox = await surface.boundingBox();
    expect(dialogBox).not.toBeNull();
    fixture.update(["alice", "carol", "dave", "erin"]);
    await expect(
      dialog.getByRole("link", { name: "bob bob", exact: true })
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("link", { name: "erin erin", exact: true })
    ).toBeVisible();
    fixture.update(["alice", "carol", "dave"]);
    await expect(
      drop.getByRole("button", {
        name: "👍 3",
        exact: true,
        includeHidden: true,
      })
    ).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: "bob bob", exact: true })
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("link", { name: "dave dave", exact: true })
    ).toBeVisible();
    const updatedBox = await surface.boundingBox();
    expect(updatedBox).not.toBeNull();
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(updatedBox![key]).toBeCloseTo(dialogBox![key], 1);
    }
    await page.screenshot({
      path: testInfo.outputPath("reaction-dialog-desktop.png"),
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page
      .getByRole("heading", {
        name: "Local Composer Sandbox Wave",
      })
      .hover();
    await expect(tooltip).toBeHidden();
    const readsBeforeHiddenUpdate = fixture.detailReads();
    fixture.update(["alice", "carol", "dave", "erin"]);
    await expect(
      drop.getByRole("button", { name: "👍 4", exact: true })
    ).toBeVisible();
    expect(fixture.detailReads()).toBe(readsBeforeHiddenUpdate);
    await drop.getByRole("button", { name: "👍 4", exact: true }).hover();
    await expect(tooltip).toContainText("carol");
    await expect(tooltip).not.toContainText("bob");
    await expect(
      tooltip.getByRole("button", { name: "and 1 other", exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps hidden details idle when the last hovered chip disappears and returns", async ({
    page,
    baseURL,
  }) => {
    const fixture = await installReactionDetailsFixture(page, baseURL);
    await gotoSandboxWave(page);
    const drop = page.getByRole("tabpanel").locator('[data-serial-no="1"]');
    await drop.getByRole("button", { name: "👍 4", exact: true }).hover();
    await expect(page.getByRole("tooltip")).toContainText("alice");
    const viewedReads = fixture.detailReads();

    fixture.update([]);
    await expect(
      drop.getByRole("button", { name: "👍 4", exact: true })
    ).toHaveCount(0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await page
      .getByRole("heading", { name: "Local Composer Sandbox Wave" })
      .hover();

    const hiddenRead = page
      .waitForRequest(
        (request) =>
          request.method() === "GET" &&
          new URL(request.url()).pathname ===
            `/api/v2/drops/${SANDBOX_DROP_ID}/reactions`,
        { timeout: 1000 }
      )
      .then(
        () => true,
        (error: unknown) => {
          if (error instanceof Error && error.name === "TimeoutError") {
            return false;
          }
          throw error;
        }
      );
    fixture.update(["alice"]);
    const returnedChip = drop.getByRole("button", {
      name: "👍 1",
      exact: true,
    });
    await expect(returnedChip).toBeVisible();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    expect(await hiddenRead).toBe(false);
    expect(fixture.detailReads()).toBe(viewedReads);

    await returnedChip.hover();
    await expect(page.getByRole("tooltip")).toContainText("alice");
    await expect.poll(() => fixture.detailReads()).toBe(viewedReads + 1);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("retries a failed list on the next hover with the existing count fallback", async ({
    page,
    baseURL,
  }) => {
    const fixture = await installReactionDetailsFixture(page, baseURL);
    fixture.failNextRead();
    const failedRead = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          `/api/v2/drops/${SANDBOX_DROP_ID}/reactions` &&
        response.status() === 503
    );
    await gotoSandboxWave(page);
    const chip = page
      .getByRole("tabpanel")
      .locator('[data-serial-no="1"]')
      .getByRole("button", { name: "👍 4", exact: true });
    await chip.hover();
    const tooltip = page.getByRole("tooltip");
    await failedRead;
    await expect(tooltip).toContainText("4 reactions");
    expect(fixture.detailReads()).toBe(1);
    await page
      .getByRole("heading", {
        name: "Local Composer Sandbox Wave",
      })
      .hover();
    await expect(tooltip).toBeHidden();
    await chip.hover();
    await expect(tooltip).toContainText("alice");
    expect(fixture.detailReads()).toBe(2);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

test.describe("Touch reaction details @auth @medium @local-only", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  });
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Touch reactions require synthetic local data."
  );

  test("opens by long press, refreshes removed names in place, and leaves reactions unchanged", async ({
    page,
    baseURL,
  }, testInfo) => {
    const fixture = await installReactionDetailsFixture(page, baseURL);
    await gotoSandboxWave(page);
    const drop = page
      .getByRole("tabpanel", { includeHidden: true })
      .locator('[data-serial-no="1"]');
    const chip = drop.getByRole("button", { name: "👍 4", exact: true });
    await expect(chip).not.toHaveAttribute("data-tooltip-id");
    await chip.scrollIntoViewIfNeeded();
    const bounds = await chip.boundingBox();
    expect(bounds).not.toBeNull();
    const touch = await page.context().newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 },
      ],
    });
    const dialog = page.getByRole("dialog", { name: "Reactions", exact: true });
    await expect(
      dialog.getByRole("heading", { name: "Reactions", exact: true })
    ).toBeVisible();
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(
      dialog.getByRole("link", { name: "bob bob", exact: true })
    ).toBeVisible();
    fixture.update(["alice", "carol", "dave"]);
    await expect(
      dialog.getByRole("link", { name: "bob bob", exact: true })
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("link", { name: "dave dave", exact: true })
    ).toBeVisible();
    await expect(
      drop.getByRole("button", {
        name: "👍 3",
        exact: true,
        includeHidden: true,
      })
    ).toBeAttached();
    await page.screenshot({
      path: testInfo.outputPath("reaction-dialog-mobile.png"),
    });
    await expectNoHorizontalOverflow(page);
    expect(await getReactionMutationMethods(baseURL)).toEqual([]);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

async function installReactionDetailsFixture(
  page: Page,
  baseURL: string | undefined
) {
  const origin = getSandboxApiOrigin(baseURL);
  const response = await fetch(
    `${origin}/api/v2/waves/${SANDBOX_WAVE_ID}/drops`
  );
  expect(response.ok).toBe(true);
  const feed = (await response.json()) as ApiWaveDropsFeedV2;
  const source = feed.drops[0]!;
  let members = ["alice", "bob", "carol", "dave"];
  let reads = 0;
  let failNext = false;
  const currentDrop = () => ({
    ...source,
    reactions: [{ reaction: ":+1:", count: members.length }],
    context_profile_context: {
      ...source.context_profile_context,
      reaction: null,
    },
  });
  await page.route(`**/api/v2/waves/${SANDBOX_WAVE_ID}/drops?**`, (route) =>
    route.fulfill({ json: { ...feed, drops: [currentDrop()] } })
  );
  await page.route("**/api/v2/drops?**", (route) =>
    route.fulfill({
      json: {
        data: [{ ...currentDrop(), wave: feed.wave }],
        page: 1,
        next: false,
      },
    })
  );
  await page.route(`**/api/v2/drops/${SANDBOX_DROP_ID}/reactions`, (route) => {
    reads += 1;
    if (failNext) {
      failNext = false;
      return route.fulfill({
        status: 503,
        json: { message: "Temporarily unavailable" },
      });
    }
    return route.fulfill({
      json: [
        {
          reaction: ":+1:",
          reactors: members.map((handle) => ({
            ...source.author,
            id: handle,
            handle,
          })),
        },
      ],
    });
  });
  const sockets = new Set<import("@playwright/test").WebSocketRoute>();
  await page.routeWebSocket(
    (url) => url.host === new URL(origin).host,
    (socket) => {
      sockets.add(socket);
      socket.onMessage((message) => {
        if (JSON.parse(String(message)).type === "AUTHENTICATE") {
          socket.send(JSON.stringify({ type: "AUTHENTICATED" }));
        }
      });
      socket.onClose(() => sockets.delete(socket));
    }
  );
  return {
    detailReads: () => reads,
    failNextRead: () => {
      failNext = true;
    },
    update: (next: string[]) => {
      members = next;
      expect(sockets.size).toBeGreaterThan(0);
      for (const socket of sockets)
        socket.send(
          JSON.stringify({
            type: "DROP_UPDATE_REF",
            data: {
              update_type: "DROP_REACTION_UPDATE",
              wave_id: SANDBOX_WAVE_ID,
              drop_id: source.id,
              serial_no: source.serial_no,
              author_id: source.author.id,
            },
          })
        );
    },
  };
}
