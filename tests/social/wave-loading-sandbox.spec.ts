import type { ApiWaveDropsFeedV2 } from "../../generated/models/ApiWaveDropsFeedV2";
import type { ApiWave } from "../../generated/models/ApiWave";
import type { ApiWaveOverviewPage } from "../../generated/models/ApiWaveOverviewPage";
import type { Page, WebSocketRoute } from "@playwright/test";
import {
  expect,
  waitForRouteReady,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  installLocalSandboxBrowserMutationGuard,
  dismissNextDevTools,
  expectNoUnsafeSandboxMutations,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { CHROMIUM_SANDBOX } from "../support/chromiumSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import {
  GAP_SYNC_TIMING,
  simulateGapSyncBurst,
} from "../support/gapSyncSchedule";
import {
  installWaveListScrollFixture,
  scrollWaveId,
  sidebarScrollMetrics,
} from "../support/waveListScroll";

// Headless Chromium otherwise hides the native scrollbar we need to exercise.
// launchOptions replaces the config value, so keep the sandbox setting too.
test.use({
  launchOptions: {
    chromiumSandbox: CHROMIUM_SANDBOX,
    ignoreDefaultArgs: ["--hide-scrollbars"],
  },
});

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

test("removes a successfully left open wave from Joined and restores it on rejoin", async ({
  page,
  baseURL,
}, testInfo) => {
  test.skip(
    !!testInfo.project.use.isMobile,
    "The desktop keeps the collection visible beside the open wave."
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  const origin = getSandboxApiOrigin(baseURL);
  const detailResponse = await page.request.get(`${origin}/api/waves/${WAVE}`);
  const overviewResponse = await page.request.get(`${origin}/api/v2/waves`);
  expect(detailResponse.ok()).toBe(true);
  expect(overviewResponse.ok()).toBe(true);
  const detail = (await detailResponse.json()) as ApiWave;
  const overview = ((await overviewResponse.json()) as ApiWaveOverviewPage)
    .data[0];
  expect(overview).toBeDefined();
  if (!overview) throw new Error("Missing sandbox wave overview");
  let joined = true;
  let failLeave = true;
  const actions = () => (joined ? ["DROP_CREATED"] : []);
  const row = () => ({
    ...overview,
    id: WAVE,
    name: detail.name,
    context_profile_context: {
      ...overview.context_profile_context,
      subscribed: joined,
      pinned: false,
    },
  });
  await page.route(`**/api/waves/${WAVE}`, (route) =>
    route.fulfill({
      json: { ...detail, subscribed_actions: actions(), pinned: false },
    })
  );
  await page.route(`**/api/waves/${WAVE}/subscriptions`, (route) => {
    if (route.request().method() === "DELETE" && failLeave)
      return route.fulfill({ status: 500, json: { message: "Leave failed" } });
    joined = route.request().method() !== "DELETE";
    return route.fulfill({ json: { actions: actions() } });
  });
  await page.route("**/api/v2/waves?**", (route) =>
    route.fulfill({ json: { data: [row()], page: 1, next: false } })
  );
  await page.route(/\/api\/v2\/waves\/(?:joined|all)(?:\?|$)/, (route) =>
    route.fulfill({
      json: {
        data: joined ? [row()] : [],
        next_cursor: null,
        snapshot_expires_at: Date.now() + 900000,
      },
    })
  );
  await page.goto(`/waves/${WAVE}`, { waitUntil: "domcontentloaded" });
  const filters = page.getByRole("group", { name: "Wave list filter" });
  await filters.getByRole("button", { name: "Joined", exact: true }).click();
  const list = page.getByRole("region", {
    name: "Following waves list",
    exact: true,
  });
  const waveRow = list.getByRole("link", { name: detail.name, exact: true });
  await expect(waveRow).toBeVisible();
  await page
    .getByRole("button", { name: `About ${detail.name}`, exact: true })
    .first()
    .click();
  const about = page.getByRole("complementary", { name: "Wave details" });
  await about.getByRole("button", { name: "Joined", exact: true }).click();
  await expect(
    page.getByText("Couldn't leave this wave.", { exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Expand waves panel", exact: true })
    .click();
  await expect(waveRow).toBeVisible();
  failLeave = false;
  await page
    .getByRole("button", { name: `About ${detail.name}`, exact: true })
    .first()
    .click();
  await about.getByRole("button", { name: "Joined", exact: true }).click();
  await expect(
    about.getByRole("button", { name: "Join", exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Expand waves panel", exact: true })
    .click();
  await expect(waveRow).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
  await filters.getByRole("button", { name: "All", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "All recent waves list", exact: true })
      .getByRole("link", { name: detail.name, exact: true })
  ).toBeVisible();
  await filters.getByRole("button", { name: "Joined", exact: true }).click();
  await expect(waveRow).toHaveCount(0);
  await page
    .getByRole("button", { name: `About ${detail.name}`, exact: true })
    .first()
    .click();
  await about.getByRole("button", { name: "Join", exact: true }).click();
  await page
    .getByRole("button", { name: "Expand waves panel", exact: true })
    .click();
  await expect(waveRow).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
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

test("saved discovery sections stay closed before hydration on reload", async ({
  page,
}, testInfo) => {
  await page.goto("/waves", { waitUntil: "domcontentloaded" });
  const names = ["Worth Checking Out", "Active Votes"];
  const discovery = discoveryRegion(page);
  for (const name of names) {
    await discovery
      .getByRole("button", { name: `Collapse ${name}`, exact: true })
      .click();
    await expect(
      discovery.getByRole("button", { name: `Expand ${name}`, exact: true })
    ).toHaveAttribute("aria-expanded", "false");
  }

  // Hold application JavaScript so the first visible server HTML cannot
  // be corrected by hydration before we assert its collapsed layout.
  const hydration = gate();
  let heldScripts = 0;
  await page.route("**/_next/static/**/*.js", async (route) => {
    heldScripts += 1;
    await hydration.ready;
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: "commit" });
    await expect.poll(() => heldScripts).toBeGreaterThan(0);
    for (const name of names) {
      const toggle = discovery.getByRole("button", {
        name: `Expand ${name}`,
        exact: true,
      });
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      const panel = page
        .getByRole("region", { name, exact: true })
        .locator(`[id="${await toggle.getAttribute("aria-controls")}"]`);
      await expect(panel).toHaveAttribute("inert", "");
      await expect(panel).toHaveAttribute("aria-hidden", "true");
      await expect(panel).toBeHidden();
      expect((await panel.boundingBox())?.height ?? 0).toBe(0);
    }
    await page.screenshot({
      path: testInfo.outputPath("discovery-before-hydration.png"),
    });
  } finally {
    hydration.release();
  }
  await expect(
    page.getByRole("button", { name: "Find a wave…", exact: true })
  ).toBeEnabled({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  for (const name of names) {
    await expect(
      discovery.getByRole("button", { name: `Expand ${name}`, exact: true })
    ).toHaveAttribute("aria-expanded", "false");
  }
  await page.screenshot({
    path: testInfo.outputPath("discovery-restored-closed.png"),
  });
  await discovery
    .getByRole("button", { name: "Expand Active Votes", exact: true })
    .click();
  await expect(
    discovery.getByRole("button", {
      name: "Collapse Active Votes",
      exact: true,
    })
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    discovery.getByRole("button", {
      name: "Expand Worth Checking Out",
      exact: true,
    })
  ).toHaveAttribute("aria-expanded", "false");
});

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
    // Single-candidate requests belong to the footer until it shows its
    // trigger. A footer that remounts while the page settles aborts and
    // repeats its request, so do not count requests. Later single requests
    // are quick-vote refreshes.
    let footerPending = true;
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
      const footer = !isBatch && footerPending;
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
      footerPending = false;
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
      footerPending = true;
      await page.reload({ waitUntil: "domcontentloaded" });
      await trigger.waitFor();
      footerPending = false;
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
    missMessages(count: number) {
      for (let index = 0; index < count; index++) {
        const serial = (drops[0]?.serial_no ?? 151) + 1;
        drops.unshift({
          ...template,
          id: `00000000-0000-4000-8000-${String(serial + 9000).padStart(12, "0")}`,
          serial_no: serial,
          created_at: 1714000000000 + serial * 60000,
          content: `Shared link fixture post ${serial}`,
        });
      }
    },
    post: (serial: number) =>
      page
        .getByRole("region", {
          name: "Wave chat file upload area",
        })
        .getByText(`Shared link fixture post ${serial}`, { exact: true }),
    /**
     * Sends a stored post as a full socket frame. Like the server, the frame
     * carries none of the viewer's own context.
     */
    async frame(serial: number) {
      const drop = drops.find((candidate) => candidate.serial_no === serial);
      if (!drop) throw new Error(`Missing fixture post ${serial}`);
      await expect.poll(() => sockets.length).toBeGreaterThan(0);
      // Socket frames carry the v1 drop shape.
      const frame = {
        id: drop.id,
        serial_no: drop.serial_no,
        drop_type: "CHAT",
        wave: { id: WAVE, name: feed.wave.name, picture: null },
        author: {
          id: drop.author.id,
          handle: drop.author.handle ?? null,
          pfp: drop.author.pfp ?? null,
          level: drop.author.level,
          classification: drop.author.classification,
          primary_address: drop.author.primary_address,
          banner1_color: null,
          banner2_color: null,
          cic: 0,
          rep: 0,
          tdh: 0,
          archived: false,
          active_main_stage_submission_ids: [],
          winner_main_stage_drop_ids: [],
          artist_of_prevote_cards: [],
          profile_wave_id: null,
          is_wave_creator: false,
        },
        created_at: drop.created_at,
        updated_at: null,
        title: null,
        parts: [
          {
            part_id: 1,
            content: drop.content,
            media: [],
            attachments: [],
            quoted_drop: null,
          },
        ],
        parts_count: 1,
        referenced_nfts: [],
        mentioned_users: [],
        mentioned_groups: [],
        mentioned_waves: [],
        metadata: [],
        rating: 0,
        realtime_rating: 0,
        rating_prediction: 0,
        top_raters: [],
        raters_count: 0,
        is_signed: false,
        reactions: [],
        boosts: 0,
        hide_link_preview: false,
        nft_links: [],
        viewer_context: { author_blocked: false, drop_hidden: false },
        ...(drop.moderation ? { moderation: drop.moderation } : {}),
      };
      for (const socket of sockets)
        socket.send(JSON.stringify({ type: "DROP_UPDATE", data: frame }));
    },
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

/**
 * Hides the tab as if the reader stepped away: a return resyncs only after
 * the tab was hidden 30 s or more, so the page's clock moves 31 s ahead.
 */
async function hideTabForAWhile(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    const now = Date.now.bind(Date);
    Date.now = () => now() + 31_000;
  });
}

test("resume shows the latest page before missed history and preserves the composer", async ({
  page,
  baseURL,
}, testInfo) => {
  const fixture = await sharedPostFixture(page, baseURL);
  let olderRequests = 0;
  let failHistory = true;
  const history = gate();
  await page.route(`**/api/v2/waves/${WAVE}/drops?**`, async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("search_strategy") ===
      "FIND_OLDER"
    ) {
      olderRequests++;
      await history.ready;
      if (failHistory) {
        failHistory = false;
        return route.fulfill({
          status: 400,
          json: { message: "History unavailable" },
        });
      }
    }
    return route.fallback();
  });
  await page.goto(`/waves/${WAVE}`, { waitUntil: "domcontentloaded" });
  await expect(fixture.post(151)).toBeInViewport({ timeout: 30000 });
  const composer = page.getByRole("textbox", { name: "Write a message" });
  await composer.fill("Keep this unsent draft");
  await hideTabForAWhile(page);
  fixture.missMessages(1000);
  try {
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(fixture.post(1151)).toBeAttached({ timeout: 10000 });
    await expect(composer).toHaveText("Keep this unsent draft");
    // A blocked history request must not keep the current conversation stale.
    await expect(fixture.post(1151)).toBeInViewport();
    const gap = page.getByRole("button", { name: /missed messages/ }).last();
    await gap.scrollIntoViewIfNeeded();
    await expect.poll(() => olderRequests).toBeGreaterThan(0);
    await expect(gap).toBeDisabled();
    await page.screenshot({
      path: testInfo.outputPath("resume-missed-history.png"),
    });
    history.release();
    await expect(gap).toContainText(
      "Could not load missed messages. Try again"
    );
    await gap.click();
    await expect(fixture.post(1101)).toBeAttached();
    await expect(
      page.getByRole("status").filter({ hasText: "Missed messages loaded" })
    ).toBeAttached();
    await expect(composer).toHaveText("Keep this unsent draft");
    await expectNoHorizontalOverflow(page);
  } finally {
    history.release();
  }
});

test("live posts arrive without a request each and a lost one is repaired after the burst", async ({
  page,
  baseURL,
}, testInfo) => {
  // Sandbox packs run the staging configuration, where this flag is on. A
  // local run of the production configuration sets it to "false", and this
  // case has nothing to check there.
  test.skip(
    process.env["NEXT_PUBLIC_FEATURE_CHAT_GAP_SYNC"] === "false",
    "Gap-only chat sync is off in this run."
  );
  const fixture = await sharedPostFixture(page, baseURL);
  const newestFetches: { readonly search: string; readonly at: number }[] = [];
  const readMarkers: number[] = [];
  let counting = false;
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!counting) return;
    if (
      url.pathname.endsWith(`/api/v2/waves/${WAVE}/drops`) &&
      url.searchParams.get("search_strategy") === "FIND_NEWER"
    ) {
      newestFetches.push({ search: url.search, at: Date.now() });
    }
    if (
      request.method() === "POST" &&
      url.pathname.endsWith(`/notifications/wave/${WAVE}/read`)
    ) {
      readMarkers.push(Date.now());
    }
  });
  await page.goto(`/waves/${WAVE}`, { waitUntil: "domcontentloaded" });
  await expect(fixture.post(151)).toBeInViewport({ timeout: 30000 });
  counting = true;

  // Ten posts arrive back to back; the frame for post 157 is lost. The
  // product's timers are replayed over the recorded send times, so a slow
  // runner changes what the schedule allows, not what the test proves.
  fixture.missMessages(10);
  const sentAt: number[] = [];
  for (let serial = 152; serial <= 161; serial++) {
    if (serial === 157) continue;
    await fixture.frame(serial);
    sentAt.push(Date.now());
  }
  for (let serial = 152; serial <= 161; serial++) {
    if (serial === 157) continue;
    await expect(fixture.post(serial)).toBeAttached();
  }
  const schedule = simulateGapSyncBurst(sentAt);
  const { maxWaitMs, toleranceMs } = GAP_SYNC_TIMING;

  // The socket is trusted: no post fetches the newest posts. Every check is
  // a timer's, as many as the schedule allows, and the last one runs after
  // the last frame, no earlier than scheduled (less delivery tolerance). It
  // fetches everything since the last verified post and repairs the lost
  // frame. For back-to-back frames that is one check, 5 s after the last.
  await expect(fixture.post(157)).toBeAttached({ timeout: maxWaitMs });
  const earliestTrailingAt = schedule.trailingCheckAt.min - toleranceMs;
  await expect
    .poll(() => newestFetches.at(-1)?.at ?? 0, { timeout: maxWaitMs })
    .toBeGreaterThanOrEqual(earliestTrailingAt);
  expect(newestFetches.length).toBeGreaterThanOrEqual(schedule.checks.min);
  expect(newestFetches.length).toBeLessThanOrEqual(schedule.checks.max);
  expect(newestFetches[0]!.search).toContain("serial_no_limit=151");

  // The received posts are marked read once per window, not one by one,
  // plus at most one for the repaired post.
  await expect
    .poll(() => readMarkers.length, { timeout: 10000 })
    .toBeGreaterThanOrEqual(schedule.readWindows.min);
  expect(readMarkers.length).toBeLessThanOrEqual(schedule.readWindows.max + 1);
  const burstStartedAt = sentAt[0] ?? 0;
  await testInfo.attach("gap-sync-requests", {
    body: JSON.stringify({
      received: 9,
      sentAtMs: sentAt.map((at) => at - burstStartedAt),
      schedule,
      newestFetchesAtMs: newestFetches.map(
        (fetch) => fetch.at - burstStartedAt
      ),
      readMarkers: readMarkers.length,
    }),
    contentType: "application/json",
  });
});

test("resume preserves an older reading position while loading the latest page", async ({
  page,
  baseURL,
}) => {
  const fixture = await sharedPostFixture(page, baseURL);
  await page.goto(`/waves/${WAVE}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(fixture.post(151)).toBeInViewport({ timeout: 30000 });
  // Offscreen placeholders hydrate as they enter view and replace the text
  // node, so reacquire the locator until the reader's position has settled.
  await expect(async () => {
    await fixture.post(120).scrollIntoViewIfNeeded({ timeout: 1000 });
    await expect(fixture.post(120)).toBeInViewport({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await expect(
    page.getByRole("button", { name: "Scroll to bottom", exact: true })
  ).toBeVisible();
  await hideTabForAWhile(page);
  fixture.missMessages(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(fixture.post(1151)).toBeAttached({ timeout: 10000 });
  await expect(fixture.post(120)).toBeInViewport();
  await page
    .getByRole("button", { name: "Scroll to bottom", exact: true })
    .click();
  await expect(fixture.post(1151)).toBeInViewport();
});

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
  const composer = page.getByRole("textbox", { name: "Write a message" });
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
for (const surface of [
  { name: "wave", path: `/waves/${WAVE}` },
  { name: "DM", path: "/messages/00000000-0000-4000-8000-000000000532" },
]) {
  test(`docks the Android ${surface.name} composer after resize-first keyboard events`, async ({
    baseURL,
    context,
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Uses the Android bridge in the mobile Chromium sandbox"
    );
    await installSurfaceSimulation(context, "capacitor-android-sim", baseURL);
    await page.route("**/api/open-graph**", (route) =>
      route.fulfill({ json: {} })
    );
    await page.setViewportSize({ width: 412, height: 840 });
    await page.goto(surface.path, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const composer = page
      .getByRole("textbox", { name: "Write a message" })
      .last();
    await expect(composer).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await composer.fill("Keyboard check.");
    const readBottom = () =>
      composer.evaluate((element) => element.getBoundingClientRect().bottom);
    const initialBottom = await readBottom();
    for (const keyboardHeight of [320, 280]) {
      const viewportHeight = 840 - keyboardHeight;
      await page.setViewportSize({ width: 412, height: viewportHeight });
      // Run the real resize fallback before native bridge delivery. No CSS
      // keyboard values are injected: this exercises the hook and its consumers.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          })
      );
      await emitKeyboardEvent(page, "keyboardWillShow", keyboardHeight);
      await emitKeyboardEvent(page, "keyboardDidShow", keyboardHeight);
      await expect(page.locator("html")).toHaveCSS(
        "--native-keyboard-inset-bottom",
        "0px"
      );
      await expect.poll(readBottom).toBeGreaterThan(viewportHeight - 24);
      await expect.poll(readBottom).toBeLessThanOrEqual(viewportHeight);
      await expect(composer).toBeInViewport();
      const latestMessage =
        surface.name === "DM"
          ? page
              .getByText(
                "Synthetic local-only direct message body for Playwright.",
                { exact: true }
              )
              .first()
          : page
              .getByRole("link", {
                name: "https://example.com/6529-composer-preview",
                exact: true,
              })
              .first();
      await expect(latestMessage).toBeInViewport();
      await expectNoHorizontalOverflow(page);
      await dismissNextDevTools(page);
      await page.screenshot({
        path: testInfo.outputPath(
          `android-keyboard-open-${keyboardHeight}.png`
        ),
      });
      await emitKeyboardEvent(page, "keyboardWillHide");
      await emitKeyboardEvent(page, "keyboardDidHide");
      await page.setViewportSize({ width: 412, height: 840 });
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-native-keyboard-visible"
      );
      await expect.poll(readBottom).toBeCloseTo(initialBottom, 0);
      await expect(composer).toContainText("Keyboard check.");
    }
    await page.screenshot({
      path: testInfo.outputPath("android-keyboard-closed.png"),
    });
    await expectNoUnsafeSandboxMutations(baseURL);
  });
}

async function emitKeyboardEvent(
  page: Page,
  eventName: string,
  keyboardHeight = 0
) {
  await page.waitForFunction((eventName) => {
    const runtime = globalThis as typeof globalThis & {
      __playwrightKeyboardListeners?: string[];
    };
    return runtime.__playwrightKeyboardListeners?.includes(eventName);
  }, eventName);
  const delivered = await page.evaluate(
    ({ eventName, keyboardHeight }) => {
      return !globalThis.dispatchEvent(
        new CustomEvent(`playwright:${eventName}`, {
          detail: { keyboardHeight },
          cancelable: true,
        })
      );
    },
    { eventName, keyboardHeight }
  );
  expect(delivered, `Native callback received ${eventName}`).toBe(true);
}

test("announcement replies preserve the unread badge and top-level timestamp", async ({
  page,
  baseURL,
}, testInfo) => {
  const origin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(
    `${origin}/api/v2/waves/${WAVE}/drops?limit=1`
  );
  expect(response.ok()).toBe(true);
  const feed = (await response.json()) as ApiWaveDropsFeedV2;
  const template = feed.drops[0];
  if (!template) throw new Error("Missing announcement fixture");
  const now = Date.now();
  const announcement = {
    ...feed.wave,
    id: ANNOUNCEMENTS,
    name: "Announcements",
    has_competition: false,
    replies_collapsed: true,
    last_drop_time: now,
    has_subwaves: false,
    context_profile_context: {
      ...feed.wave.context_profile_context,
      unread_drops: 0,
      subscribed: true,
      muted: false,
      pinned: false,
    },
  };
  let latest: ApiWaveDropsFeedV2["drops"][number] = {
    ...template,
    id: "announcement-root",
    created_at: now - 2 * 3600000,
    serial_no: 500,
  };
  delete latest.reply_to_drop;
  let incoming: ApiWaveDropsFeedV2["drops"][number] = {
    ...latest,
    id: "announcement-reply",
    author: {
      ...template.author,
      id: "another-reader",
      handle: "someone-else",
    },
    created_at: now,
    serial_no: 501,
    reply_to_drop: { id: latest.id },
  };
  await page.route("**/api/settings", (route) =>
    route.fulfill({ json: { announcements_wave_id: ANNOUNCEMENTS } })
  );
  await page.route("**/api/v2/waves?**", (route) =>
    route.fulfill({ json: { data: [announcement], page: 1, next: false } })
  );
  await page.route(/\/api\/v2\/waves\/(?:joined|all)(?:\?|$)/, (route) =>
    route.fulfill({
      json: {
        data: [announcement],
        next_cursor: null,
        snapshot_expires_at: now + 900000,
      },
    })
  );
  await page.route(`**/api/v2/waves/${ANNOUNCEMENTS}/drops?**`, (route) =>
    route.fulfill({ json: { wave: announcement, drops: [latest] } })
  );
  await page.route("**/api/v2/drops?**", (route) =>
    route.fulfill({
      json: { data: [{ ...incoming, wave: announcement }], next: false },
    })
  );
  const sockets: WebSocketRoute[] = [];
  await page.routeWebSocket(
    (url) => url.port === new URL(origin).port,
    (socket) => {
      sockets.push(socket);
      socket.onMessage((message) => {
        if (JSON.parse(String(message)).type === "AUTHENTICATE")
          socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
      });
    }
  );
  await page.goto("/waves", { waitUntil: "domcontentloaded" });
  const row = page
    .getByRole("region", { name: "Announcement waves", exact: true })
    .filter({ visible: true });
  await expect(row.getByText("2h", { exact: true })).toBeVisible();
  const avatar = row.getByTestId("sidebar-wave-avatar");
  await expect(avatar.getByText("1", { exact: true })).toHaveCount(0);
  await expect.poll(() => sockets.length).toBeGreaterThan(0);
  const send = () => {
    for (const socket of sockets)
      socket.send(
        JSON.stringify({
          type: "DROP_UPDATE_REF",
          data: {
            update_type: "DROP_UPDATE",
            wave_id: ANNOUNCEMENTS,
            drop_id: incoming.id,
            serial_no: incoming.serial_no,
            author_id: "another-reader",
          },
        })
      );
  };
  const replyResolved = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v2/drops?") &&
      res.request().url().includes(incoming.id)
  );
  send();
  await replyResolved;
  await expect(row.getByText("2h", { exact: true })).toBeVisible();
  await expect(avatar.getByText("1", { exact: true })).toHaveCount(0);
  // A reload must not restore the reply-inclusive overview time.
  sockets.length = 0;
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(row.getByText("2h", { exact: true })).toBeVisible();
  incoming = {
    ...incoming,
    id: "announcement-new-root",
    created_at: now - 60000,
    serial_no: 502,
  };
  delete incoming.reply_to_drop;
  latest = incoming;
  await expect.poll(() => sockets.length).toBeGreaterThan(0);
  send();
  await expect(row.getByText("1m", { exact: true })).toBeVisible();
  await expect(avatar.getByText("1", { exact: true })).toBeVisible();
  // Full updates must refresh the time immediately too, without a reload or poll.
  latest = {
    ...latest,
    id: "announcement-full-root",
    created_at: Date.now(),
    serial_no: 503,
  };
  for (const socket of sockets)
    socket.send(
      JSON.stringify({
        type: "DROP_UPDATE",
        data: {
          id: latest.id,
          wave: { id: ANNOUNCEMENTS },
          serial_no: 503,
          author: { id: "another-reader", handle: "someone-else" },
          created_at: latest.created_at,
          drop_type: "CHAT",
          parts: [],
          parts_count: 1,
        },
      })
    );
  await expect(row.getByText("Just now", { exact: true })).toBeVisible({
    timeout: 5000,
  });
  await expect(avatar.getByText("2", { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("announcement-sidebar.png"),
  });
});
