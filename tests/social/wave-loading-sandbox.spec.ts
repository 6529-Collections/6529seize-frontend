import type { ApiWaveDropsFeedV2 } from "../../generated/models/ApiWaveDropsFeedV2";
import type { Page, WebSocketRoute } from "@playwright/test";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  installLocalSandboxBrowserMutationGuard,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import {
  installWaveListScrollFixture,
  scrollWaveId,
  sidebarScrollMetrics,
} from "../support/waveListScroll";

// Headless Chromium otherwise hides the native scrollbar we need to exercise.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

for (const collection of ["All", "Pinned", "Joined"]) {
  test(`wave list stops automatic scrolling during incoming activity in ${collection}`, async ({
    page,
    baseURL,
    browserName,
    headless,
  }, testInfo) => {
    // Mobile replaces the list with the open wave, so this simultaneous
    // sidebar-and-active-wave scenario applies only to desktop.
    test.skip(
      !!testInfo.project.use.isMobile,
      "The desktop sidebar stays visible beside the open wave."
    );
    const fixture = await installWaveListScrollFixture(page, baseURL);
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    // The enabled search control marks the sidebar's hydration boundary.
    await expect(
      page.getByRole("button", { name: "Find a wave…", exact: true })
    ).toBeEnabled({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await page
      .getByRole("group", { name: "Wave list filter" })
      .getByRole("button", { name: collection, exact: true })
      .click();
    const list = page
      .getByRole("region", {
        name:
          collection === "Pinned"
            ? "Pinned"
            : collection === "Joined"
              ? "Following waves list"
              : "All recent waves list",
        exact: true,
      })
      .filter({ visible: true });
    await expect(
      list.getByRole("link", { name: "Scroll wave 0", exact: true })
    ).toBeVisible();
    await sidebarScrollMetrics(list, 1200);
    const activeLink = list.getByRole("link", {
      name: "Scroll wave 20",
      exact: true,
    });
    await expect(activeLink).toBeInViewport();
    await activeLink.click();
    await expect(page).toHaveURL(new RegExp(scrollWaveId(20)));
    const container = await sidebarScrollMetrics(list);
    if (collection === "All" && browserName === "chromium") {
      const scale = container.height / container.scrollHeight;
      const thumbY =
        container.viewportTop + (container.top + container.height / 2) * scale;
      await page.mouse.move(container.right - 3, thumbY);
      await page.mouse.down();
      await page.mouse.move(container.right - 3, thumbY + 1200 * scale, {
        steps: 8,
      });
      await page.mouse.up();
    } else {
      await page.mouse.move(container.x, container.y);
      await page.mouse.wheel(0, 1200);
    }
    await expect(activeLink).not.toBeInViewport();
    // Wheel distances differ between engines. Exercise rows actually visible
    // after scrolling rather than assuming an engine-specific pixel distance.
    let visibleWaves: number[] = [];
    await expect
      .poll(async () => {
        visibleWaves = await list.getByRole("link").evaluateAll(
          (links, viewport) =>
            links
              .filter((link) => {
                const rect = link.getBoundingClientRect();
                return (
                  rect.top > viewport.viewportTop + 150 &&
                  rect.bottom < viewport.viewportTop + viewport.height - 100
                );
              })
              .map(
                (link) => Number(link.getAttribute("href")?.slice(-12)) - 7000
              ),
          await sidebarScrollMetrics(list)
        );
        return visibleWaves.length;
      })
      .toBeGreaterThanOrEqual(3);
    const [firstReceiving, secondReceiving, nextActive] = visibleWaves as [
      number,
      number,
      number,
    ];
    const before = (await sidebarScrollMetrics(list)).top;

    // Wait for each visible receiving row to move to the top before checking
    // the viewport: a pre-update assertion would miss the regression.
    for (const receivingWave of [firstReceiving, secondReceiving]) {
      const receivingLink = list.getByRole("link", {
        name: `Scroll wave ${receivingWave}`,
        exact: true,
      });
      await expect(receivingLink).toBeInViewport();
      await fixture.incoming(receivingWave);
      await expect(receivingLink).not.toBeInViewport();
      expect((await sidebarScrollMetrics(list)).top).toBe(before);
    }
    await page.screenshot({
      path: testInfo.outputPath("wave-list-scrolled.png"),
    });
    // Playwright's headless Firefox forces scrollbar-width:none even on a
    // plain overflow element with inline scrollbar-width:thin. Headed Firefox
    // verifies the styling; both modes still verify the scrolling behavior.
    if (browserName !== "firefox" || !headless)
      expect((await sidebarScrollMetrics(list)).width).toBe("thin");

    // Opening a wave reveals it once. Its later activity may reorder the row,
    // but must not move the viewport, even without more input after navigation.
    await list
      .getByRole("link", { name: `Scroll wave ${nextActive}`, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(scrollWaveId(nextActive)));
    const afterNavigation = (await sidebarScrollMetrics(list)).top;
    await fixture.incoming(nextActive);
    await expect(
      list.getByRole("link", { name: `Scroll wave ${nextActive}`, exact: true })
    ).not.toBeInViewport();
    expect((await sidebarScrollMetrics(list)).top).toBe(afterNavigation);
    await testInfo.attach("scroll-position-after-activity", {
      body: JSON.stringify({
        before: afterNavigation,
        after: (await sidebarScrollMetrics(list)).top,
      }),
      contentType: "application/json",
    });
    await page.screenshot({
      path: testInfo.outputPath("active-wave-reordered.png"),
    });
    // Scrolling to the top confirms the receiving wave really moved there.
    await sidebarScrollMetrics(list, 0);
    await expect(list.getByRole("link").first()).toHaveText(
      `Scroll wave ${nextActive}`
    );
    await fixture.incoming(55);
    await expect(list.getByRole("link").first()).toHaveText("Scroll wave 55");
    expect((await sidebarScrollMetrics(list)).top).toBe(0);
    // Exercise the track last so its native animation cannot overlap the
    // programmatic reset used by the activity-at-top assertion above.
    if (collection === "All" && browserName === "chromium") {
      const revealed = await sidebarScrollMetrics(list);
      await page.mouse.click(
        revealed.right - 3,
        revealed.viewportTop + revealed.height - 20
      );
      await expect
        .poll(async () => (await sidebarScrollMetrics(list)).top)
        .toBeGreaterThan(revealed.top);
    }
  });
}

test("wave list reveals a direct link after loading without following its later activity", async ({
  page,
  baseURL,
}, testInfo) => {
  test.skip(
    !!testInfo.project.use.isMobile,
    "The active wave and list share the desktop viewport."
  );
  const fixture = await installWaveListScrollFixture(page, baseURL);
  const loading = gate();
  let heldRequests = 0;
  await page.route("**/api/v2/waves?**", async (route) => {
    heldRequests += 1;
    await loading.ready;
    return route.fallback();
  });
  try {
    await page.goto(`/waves/${scrollWaveId(20)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect
      .poll(() => heldRequests, {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      })
      .toBeGreaterThan(0);
    loading.release();
    const list = page
      .getByRole("region", { name: "All recent waves list", exact: true })
      .filter({ visible: true });
    const activeLink = list.getByRole("link", {
      name: "Scroll wave 20",
      exact: true,
    });
    // The direct-link fallback row can appear before the full collection.
    await expect
      .poll(async () => (await sidebarScrollMetrics(list)).scrollHeight)
      .toBeGreaterThan(3000);
    await expect(activeLink).toBeInViewport();
    const before = (await sidebarScrollMetrics(list)).top;
    expect(before).toBeGreaterThan(0);
    await fixture.incoming(20);
    await expect(activeLink).not.toBeInViewport();
    expect((await sidebarScrollMetrics(list)).top).toBe(before);
    await sidebarScrollMetrics(list, 0);
    await expect(list.getByRole("link").first()).toHaveText("Scroll wave 20");
  } finally {
    loading.release();
  }
});

const WAVE = "00000000-0000-4000-8000-000000000529";
const ANNOUNCEMENTS = "00000000-0000-4000-8000-000000000599";
const SHARED_POST_GUEST = process.env["USE_DEV_AUTH"] === "false";

useLocalSandboxMutationGuard(
  test,
  "PLAYWRIGHT_AUTH_SANDBOX",
  "Requires the local sandbox."
);
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

function gate() {
  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { ready, release };
}

async function waveFixture(page: Page, baseURL: string | undefined) {
  const response = await page.request.get(
    `${getSandboxApiOrigin(baseURL)}/api/v2/waves`
  );
  expect(response.ok()).toBe(true);
  return (await response.json()).data[0];
}

function discoveryRegion(page: Page) {
  return page
    .getByRole("region", { name: "Wave discovery", exact: true })
    .filter({ visible: true });
}

test("discovery reserves space while loading and retains its controls", async ({
  page,
  baseURL,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const wave = await waveFixture(page, baseURL);
  const content = gate();
  const announcements = gate();
  await page.route("**/api/settings", (route) =>
    route.fulfill({ json: { announcements_wave_id: ANNOUNCEMENTS } })
  );
  await page.route(`**/api/waves/${ANNOUNCEMENTS}`, async (route) => {
    await announcements.ready;
    const response = await route.fetch();
    await route.fulfill({
      json: {
        ...(await response.json()),
        id: ANNOUNCEMENTS,
        name: "Announcements",
      },
    });
  });
  await page.route("**/api/v2/waves?**", async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("score_sort") !==
      "QUALITY"
    )
      return route.fallback();
    await content.ready;
    await route.fulfill({ json: { data: [wave], page: 1, next: false } });
  });
  await page.route("**/api/v2/waves/active-votes**", async (route) => {
    await content.ready;
    await route.fulfill({
      json: {
        data: [0, 1, 2].map((index) => ({
          wave: {
            ...wave,
            id: `${WAVE}-${index}`,
            name: `Loading fixture ${index + 1}`,
          },
          voting_ends_at: null,
          next_decision_at: null,
        })),
        page: 1,
        next: false,
        count: 3,
      },
    });
  });
  try {
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    const discovery = discoveryRegion(page);
    for (const name of ["Loading recommendations…", "Loading votes…"]) {
      await expect(
        discovery.getByRole("status").filter({ hasText: name })
      ).toBeVisible();
    }
    await expect(
      discovery.getByText(
        /Highly rated waves|Community decisions|No recommendations|No active TDH/
      )
    ).toHaveCount(0);
    await expect(
      discovery.getByRole("link", { name: "View all recommendations" })
    ).toBeVisible();
    await expect(
      discovery.getByRole("link", { name: "View all active votes" })
    ).toBeVisible();
    // The loading shell is server-rendered. Wait for an independent API row
    // before clicking so the control's client handlers have hydrated.
    await expect(
      page
        .getByRole("link", { name: "Local Composer Sandbox Wave", exact: true })
        .filter({ visible: true })
        .first()
    ).toBeVisible();
    const recommendationToggle = discovery.getByRole("button", {
      name: /(?:Expand|Collapse) Worth Checking Out/,
    });
    await recommendationToggle.click();
    await expect(recommendationToggle).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    await expect(
      discovery
        .getByRole("status")
        .filter({ hasText: "Loading recommendations…" })
    ).toBeHidden();
    await recommendationToggle.click();
    await expect(recommendationToggle).toHaveAttribute("aria-expanded", "true");
    const before = (await discovery.boundingBox())!;
    expect(
      await page
        .getByRole("region", { name: "Wave discovery", exact: true })
        .filter({ visible: true })
        .locator(".tw-animate-pulse")
        .first()
        .evaluate((element) => getComputedStyle(element).animationName)
    ).toBe("none");
    await page.screenshot({ path: testInfo.outputPath("sidebar-loading.png") });
    content.release();
    await expect(
      discovery.getByText("Highly rated waves you don’t follow.")
    ).toBeVisible();
    await expect(
      discovery.getByText("Community decisions powered by TDH.")
    ).toBeVisible();
    await expect(
      discovery.getByRole("status").filter({ hasText: /Loading/ })
    ).toHaveCount(0);
    const loaded = (await discovery.boundingBox())!;
    expect(Math.abs(loaded.height - before.height)).toBeLessThanOrEqual(12);
    announcements.release();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Loading announcements…" })
        .filter({ visible: true })
    ).toHaveCount(0);
    expect(
      Math.abs((await discovery.boundingBox())!.y - before.y)
    ).toBeLessThanOrEqual(2);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("sidebar-loaded.png") });
    await expectAxeClean(page, {
      include: ['section[aria-label="Wave discovery"]'],
    });
  } finally {
    content.release();
    announcements.release();
  }
});

test("discovery errors retry to genuinely empty sections without descriptions", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/v2/waves?**", async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("score_sort") !==
      "QUALITY"
    )
      return route.fallback();
    await route.fulfill(
      fail
        ? { status: 400, json: { error: "Fixture error" } }
        : { json: { data: [], page: 1, next: false } }
    );
  });
  await page.route("**/api/v2/waves/active-votes**", (route) =>
    route.fulfill(
      fail
        ? { status: 400, json: { error: "Fixture error" } }
        : { json: { data: [], count: 0, page: 1, next: false } }
    )
  );
  await page.goto("/waves", { waitUntil: "domcontentloaded" });
  const discovery = discoveryRegion(page);
  await expect(
    discovery.getByText("Couldn’t load recommendations.")
  ).toBeVisible();
  await expect(discovery.getByText("Couldn’t load votes.")).toBeVisible();
  await expect(
    discovery.getByText(
      /No recommendations|No active TDH|Highly rated waves|Community decisions/
    )
  ).toHaveCount(0);
  fail = false;
  await discovery
    .getByRole("region", { name: "Worth Checking Out", exact: true })
    .getByRole("button", { name: "Try again" })
    .click();
  await discovery
    .getByRole("region", { name: "Active Votes", exact: true })
    .getByRole("button", { name: "Try again" })
    .click();
  await expect(
    discovery.getByText("No recommendations right now.")
  ).toBeVisible();
  await expect(
    discovery.getByText("No active TDH votes right now.")
  ).toBeVisible();
  await expect(
    discovery.getByText(/Highly rated waves|Community decisions/)
  ).toHaveCount(0);
  for (const [sectionName, emptyMessage] of [
    ["Worth Checking Out", "No recommendations right now."],
    ["Active Votes", "No active TDH votes right now."],
  ] as const) {
    const section = discovery.getByRole("region", {
      name: sectionName,
      exact: true,
    });
    const heading = (await section.getByRole("heading").boundingBox())!;
    const message = (await section.getByText(emptyMessage).boundingBox())!;
    expect(message.y - (heading.y + heading.height)).toBeLessThanOrEqual(4);
  }
});

for (const width of [375, 390, 768, 1024, 1440]) {
  test(`quick vote keeps its close button stable at ${width}px`, async ({
    page,
    baseURL,
  }, testInfo) => {
    const touch = testInfo.project.name === "web-mobile-chromium";
    test.skip(
      touch ? width >= 768 : width < 768,
      "Use the matching pointer/viewport project."
    );
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (touch && width === 375)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        baseURL
      );
    const wave = await waveFixture(page, baseURL);
    const drop = {
      id: "00000000-0000-4000-8000-000000000598",
      serial_no: 1,
      drop_type: "PARTICIPATORY",
      wave: { ...wave, voting_credit_type: "TDH" },
      author: wave.author,
      title: "Loading fixture artwork",
      created_at: Date.now(),
      updated_at: null,
      parts: [
        {
          part_id: 1,
          content: "Local loading fixture",
          media: [
            {
              url: "https://6529.io/meme-lab.jpg",
              mime_type: "image/jpeg",
            },
          ],
          attachments: [],
          quoted_drop: null,
        },
      ],
      parts_count: 1,
      referenced_nfts: [],
      mentioned_users: [],
      mentioned_groups: [],
      mentioned_waves: [],
      metadata: [{ data_key: "title", data_value: "Loading fixture artwork" }],
      reactions: [],
      context_profile_context: { rating: 0, max_rating: 1000, min_rating: 0 },
      rating: 0,
      raters_count: 0,
      top_raters: [],
      boosts: 0,
      moderation: { status: "VISIBLE", can_view: true },
    };
    let first = true;
    let fail = false;
    let candidate = drop;
    await page.route("**/*meme-lab*", (route) =>
      route.fulfill({ path: "public/meme-lab.jpg", contentType: "image/jpeg" })
    );
    const content = gate();
    await page.route("**/api/waves/*/undiscovered-drop**", async (route) => {
      const isBatch = new URL(route.request().url()).pathname.endsWith(
        "/undiscovered-drops"
      );
      const footer = !isBatch && first;
      if (footer) first = false;
      if (!footer) await content.ready;
      await route.fulfill(
        fail && !footer
          ? { status: 400, json: { error: "Fixture error" } }
          : {
              json: {
                ...(isBatch ? { drops: [candidate] } : { drop: candidate }),
                total_count: 5,
                left_to_vote_in_current_round: 3,
              },
            }
      );
    });
    try {
      await page.goto("/waves", { waitUntil: "domcontentloaded" });
      const trigger = page
        .getByRole("button", { name: /^Uncast Power,/ })
        .filter({ visible: true });
      await expect(trigger).toBeVisible();
      // Sample every rendered frame, including the first frame before effects settle.
      await page.evaluate(() => {
        const positions: number[] = [];
        const sample = () => {
          const close = document.querySelector<HTMLButtonElement>(
            'dialog[open] button[aria-label="Close quick vote"]'
          );
          if (close) positions.push(close.getBoundingClientRect().x);
          requestAnimationFrame(sample);
        };
        Object.assign(globalThis, { quickVoteClosePositions: positions });
        requestAnimationFrame(sample);
      });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Memes quick vote" });
      const close = dialog.getByRole("button", { name: "Close quick vote" });
      await expect(close).toBeFocused();
      const before = (await close.boundingBox())!;
      expect(before.width).toBe(44);
      expect(before.height).toBe(44);
      expect(width < 768 ? before.x : width - before.x).toBeLessThan(
        width < 768 ? 25 : width / 2
      );
      const headerHeight = await close.evaluate(
        (element) => element.nextElementSibling?.getBoundingClientRect().height
      );
      const button = await close.elementHandle();
      // The visible footer already loaded this candidate. Slow lookahead must
      // not delay usable controls or move focus/the close button.
      await expect(
        dialog.getByRole("button", { name: "Skip", exact: true })
      ).toBeEnabled();
      await expect(
        dialog.getByRole("button", { name: /^Vote / })
      ).toBeEnabled();
      const artwork = dialog.getByRole("img").first();
      await expect(artwork).toBeVisible();
      await expect
        .poll(() =>
          artwork.evaluate((img: HTMLImageElement) => img.naturalWidth)
        )
        .toBeGreaterThan(0);
      await page.screenshot({
        path: testInfo.outputPath("quick-vote-cached.png"),
      });
      content.release();
      await expect(
        dialog.getByRole("button", { name: "Skip", exact: true })
      ).toBeVisible();
      await expect(close).toBeFocused();
      expect(
        await close.evaluate((node, original) => node === original, button)
      ).toBe(true);
      expect(await close.boundingBox()).toEqual(before);
      expect(
        await close.evaluate(
          (element) =>
            element.nextElementSibling?.getBoundingClientRect().height
        )
      ).toBe(headerHeight);
      await page.screenshot({
        path: testInfo.outputPath("quick-vote-loaded.png"),
      });
      const positions = await page.evaluate(
        () =>
          (
            globalThis as typeof globalThis & {
              quickVoteClosePositions: number[];
            }
          ).quickVoteClosePositions
      );
      expect(positions.length).toBeGreaterThan(0);
      expect(positions.every((x) => Math.abs(x - before.x) < 1)).toBe(true);
      if (touch && width === 375) {
        await page.evaluate(() =>
          document.documentElement.style.setProperty(
            "--native-keyboard-inset-bottom",
            "250px"
          )
        );
        expect(await close.boundingBox()).toEqual(before);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(artwork).toBeVisible();
      await expect
        .poll(() =>
          artwork.evaluate((img: HTMLImageElement) => img.naturalWidth)
        )
        .toBeGreaterThan(0);
      if (touch) await close.click();
      else await dialog.click({ position: { x: 5, y: 5 } });
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      fail = true;
      first = true;
      await page.reload({ waitUntil: "domcontentloaded" });
      await trigger.click();
      // A failed background window cannot replace the cached artwork with an error.
      await expect(
        dialog.getByRole("button", { name: "Skip", exact: true })
      ).toBeEnabled();
      await expect(
        dialog.getByRole("button", { name: "Try again" })
      ).toBeHidden();
      expect(await close.boundingBox()).toEqual(before);
      // Once the only usable candidate is consumed, a genuine discovery
      // failure must still expose Retry without moving the close control.
      await page.route("**/api/drops/*/ratings", (route) =>
        route.fulfill({ json: drop })
      );
      await dialog.getByRole("button", { name: "Skip", exact: true }).click();
      await expect(
        dialog.getByRole("button", { name: "Try again" })
      ).toBeVisible();
      expect(await close.boundingBox()).toEqual(before);
      fail = false;
      candidate = { ...drop, id: "00000000-0000-4000-8000-000000000999" };
      await dialog.getByRole("button", { name: "Try again" }).click();
      await expect(
        dialog.getByRole("button", { name: "Skip", exact: true })
      ).toBeEnabled();
      await page.route("**/api/drops/*/ratings", (route) =>
        route.fulfill({
          status: 400,
          json: { error: "Voting is closed in this wave" },
        })
      );
      await dialog.getByRole("button", { name: /^Vote / }).click();
      // Native dialogs obscure global toasts. Rejections must be announced
      // within the dialog, with the original voting controls restored.
      await expect(dialog.getByRole("alert")).toHaveText(
        "Voting is closed in this wave"
      );
      await expect(dialog.getByRole("alert")).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: /^Vote / })
      ).toBeEnabled();
      await page.screenshot({
        path: testInfo.outputPath("quick-vote-rejected.png"),
      });
      await close.click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    } finally {
      content.release();
    }
  });
}

async function sharedPostFixture(page: Page, baseURL: string | undefined) {
  // Keep the copied tab as isolated from telemetry as the original fixture.
  await page.route("https://www.googletagmanager.com/gtag/js?**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" })
  );
  await page.route("**/api/drops/*/curations", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route("**/api/open-graph", (route) => route.fulfill({ json: {} }));
  const response = await page.request.get(
    `${getSandboxApiOrigin(baseURL)}/api/v2/waves/${WAVE}/drops?limit=50`
  );
  expect(response.ok()).toBe(true);
  const feed = (await response.json()) as ApiWaveDropsFeedV2;
  const template = feed.drops[0];
  if (!template) throw new Error("Missing sandbox drop fixture");
  const drops = Array.from({ length: 150 }, (_, index) => {
    const serial = index + 2;
    return {
      ...template,
      id: `00000000-0000-4000-8000-${String(serial + 9000).padStart(12, "0")}`,
      serial_no: serial,
      created_at: 1714000000000 + serial * 60000,
      content: `Shared link fixture post ${serial}`,
    };
  }).reverse();
  await page.route("**/api/v2/drops?**", (route) => {
    const ids =
      new URL(route.request().url()).searchParams.get("ids")?.split(",") ?? [];
    return route.fulfill({
      json: {
        data: drops
          .filter((drop) => ids.includes(drop.id))
          .map((drop) => ({ ...drop, wave: feed.wave })),
        next: false,
      },
    });
  });
  const sockets: WebSocketRoute[] = [];
  await page.routeWebSocket(
    (url) => url.port === new URL(getSandboxApiOrigin(baseURL)).port,
    (socket) => {
      sockets.push(socket);
      socket.onMessage((message) => {
        if (JSON.parse(String(message)).type === "AUTHENTICATE") {
          socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
        }
      });
    }
  );
  await page.route(`**/api/v2/waves/${WAVE}/drops?**`, (route) => {
    const params = new URL(route.request().url()).searchParams;
    const serial = Number(params.get("serial_no_limit"));
    const strategy = params.get("search_strategy");
    let selected = drops;
    if (strategy === "FIND_BOTH") {
      selected = drops.filter((drop) => Math.abs(drop.serial_no - serial) < 20);
    } else if (strategy === "FIND_OLDER") {
      selected = drops.filter((drop) => drop.serial_no < serial);
    } else if (strategy === "FIND_NEWER") {
      selected = drops.filter((drop) => drop.serial_no > serial);
    }
    return route.fulfill({
      json: {
        ...feed,
        drops: selected.slice(0, Number(params.get("limit")) || 50),
      },
    });
  });
  await page.route("**/api/drop-ids?**", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const minimum = Number(params.get("min_serial_no"));
    return route.fulfill({
      json: drops
        .filter((drop) => drop.serial_no >= minimum)
        .map((drop) => ({
          id: drop.id,
          serial_no: drop.serial_no,
        })),
    });
  });
  return {
    post: (serial: number) =>
      page
        .getByRole("region", {
          name: "Wave chat file upload area",
        })
        .getByText(`Shared link fixture post ${serial}`, { exact: true }),
    async incoming() {
      const drop = {
        ...drops[0]!,
        id: "00000000-0000-4000-8000-000000009152",
        serial_no: 152,
        content: "Shared link fixture post 152",
      };
      drops.unshift(drop);
      await expect.poll(() => sockets.length).toBeGreaterThan(0);
      for (const socket of sockets)
        socket.send(
          JSON.stringify({
            type: "DROP_UPDATE_REF",
            data: {
              update_type: "DROP_UPDATE",
              wave_id: WAVE,
              drop_id: drop.id,
              serial_no: drop.serial_no,
              author_id: "another-reader",
            },
          })
        );
    },
  };
}

test("shared post stays in view after URL cleanup and delayed loading", async ({
  page,
  baseURL,
}, testInfo) => {
  const { post, incoming } = await sharedPostFixture(page, baseURL);
  const target = gate();
  let held = 0;
  await page.route(`**/api/v2/waves/${WAVE}/drops?**`, async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("search_strategy") ===
      "FIND_BOTH"
    ) {
      held += 1;
      await target.ready;
    }
    return route.fallback();
  });
  await page.goto(`/waves/${WAVE}?serialNo=20`, {
    waitUntil: "domcontentloaded",
  });
  try {
    await expect.poll(() => held).toBeGreaterThan(0);
    await expect(post(20)).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    // Keep data unavailable beyond the old three-second reveal deadline.
    // The jump must survive a slow response, not only a delayed render.
    await page.waitForTimeout(4500);
  } finally {
    target.release();
  }
  await expect(post(20)).toBeInViewport({ timeout: 30000 });
  await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
  const chat = page.getByRole("region", {
    name: "Wave chat file upload area",
    exact: true,
  });
  let afterHeight = 0;
  // Observe beyond the scroll retry timers. Simulate neighboring media growing,
  // then redistribute that height across the target without resizing the list.
  // A list ResizeObserver alone misses the second movement.
  for (let second = 0; second < 8; second += 1) {
    if (second === 2) {
      afterHeight = await page
        .getByRole("region", {
          name: "Wave chat file upload area",
          exact: true,
        })
        .locator("#drop-21")
        .evaluate((element) => {
          const height = element.getBoundingClientRect().height;
          (element as HTMLElement).style.minHeight = `${height + 1000}px`;
          return height;
        });
    } else if (second === 4) {
      await chat.evaluate((element, height) => {
        const before = element.querySelector<HTMLElement>("#drop-19");
        const after = element.querySelector<HTMLElement>("#drop-21");
        if (!before || !after)
          throw new Error("Missing neighboring fixture rows");
        before.style.minHeight = `${before.getBoundingClientRect().height + 1000}px`;
        after.style.minHeight = `${height}px`;
      }, afterHeight);
    }
    await page.waitForTimeout(1000);
    await expect(post(20)).toBeInViewport();
  }
  const composer = page.getByRole("textbox", { name: "Write a chat message" });
  if (SHARED_POST_GUEST) {
    await expect(composer).toBeHidden();
  } else {
    await expect(composer).toBeVisible();
    await incoming();
    // Live updates require the authenticated subscription. Check delivery before
    // asserting position, so a missing event cannot make this test pass.
    await expect(post(152)).toBeAttached();
  }
  await expect(post(20)).toBeInViewport();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("shared-post-settled.png"),
  });
  await page
    .getByRole("button", { name: "Scroll to bottom", exact: true })
    .click();
  await expect(post(SHARED_POST_GUEST ? 151 : 152)).toBeInViewport();
  await expect(post(20)).not.toBeInViewport();
});

test("copied shared post links settle in a separate tab and when reopened", async ({
  page,
  context,
  baseURL,
  browserName,
}, testInfo) => {
  test.skip(
    browserName !== "chromium",
    "Clipboard permissions are supported by Chromium."
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const { post } = await sharedPostFixture(page, baseURL);
  await page.goto(`/waves/${WAVE}?serialNo=20`, {
    waitUntil: "domcontentloaded",
  });
  await expect(post(20)).toBeInViewport({ timeout: 30000 });
  const row = page
    .getByRole("region", { name: "Wave chat file upload area", exact: true })
    .locator("#drop-20");
  if (testInfo.project.use.hasTouch) {
    await post(20).tap({ trial: true });
    const box = await post(20).boundingBox();
    if (!box) throw new Error("Shared post is not visible");
    const touch = await context.newCDPSession(page);
    try {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: box.x + 15, y: box.y + 10 }],
      });
      await expect(
        page.getByRole("dialog", { name: "Drop actions", exact: true })
      ).toBeAttached();
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });
    } finally {
      await touch.detach();
    }
    await page
      .getByRole("dialog", { name: "Drop actions", exact: true })
      .getByRole("button", { name: /copy link/i })
      .tap();
  } else {
    await row.hover();
    if (!SHARED_POST_GUEST) {
      await row
        .getByRole("button", { name: "More actions", exact: true })
        .click();
    }
    await (SHARED_POST_GUEST ? row : page)
      .getByRole("button", { name: "Copy link", exact: true })
      .click();
  }
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(`${baseURL}/waves/${WAVE}?serialNo=20`);
  const opened = await context.newPage();
  const guard = await installLocalSandboxBrowserMutationGuard(opened, baseURL);
  const fixture = await sharedPostFixture(opened, baseURL);
  try {
    for (let visit = 0; visit < 2; visit += 1) {
      await opened.goto(copied, { waitUntil: "domcontentloaded" });
      await expect(fixture.post(20)).toBeInViewport({ timeout: 30000 });
      await expect(opened).toHaveURL(new RegExp(`/waves/${WAVE}$`));
      await opened.waitForTimeout(3000);
      await expect(fixture.post(20)).toBeInViewport();
    }
    await opened.screenshot({
      path: testInfo.outputPath("copied-post-reopened.png"),
    });
    guard.assertNoBlockedMutations();
  } finally {
    await opened.close();
  }
});
