import type { Page } from "@playwright/test";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
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
    // Keep external analytics code outside the strict loopback mutation sandbox.
    await page.route("https://www.googletagmanager.com/gtag/js?**", (route) =>
      route.fulfill({ contentType: "application/javascript", body: "" })
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
      metadata: [{ data_key: "title", data_value: "Loading fixture artwork" }],
      reactions: [],
      context_profile_context: { rating: 0, max_rating: 1000, min_rating: 0 },
      rating: 0,
      raters_count: 0,
      top_raters: [],
      boosts: 0,
      moderation: { status: "VISIBLE", can_view: true },
    };
    let fail = false;
    const content = gate();
    await page.route("**/api/waves/*/undiscovered-drop**", async (route) => {
      const footer = !new URL(route.request().url()).pathname.endsWith(
        "/undiscovered-drops"
      );
      if (!footer) await content.ready;
      await route.fulfill(
        fail && !footer
          ? { status: 400, json: { error: "Fixture error" } }
          : {
              json: {
                ...(new URL(route.request().url()).pathname.endsWith(
                  "/undiscovered-drops"
                )
                  ? { drops: [drop] }
                  : { drop }),
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
      await page.screenshot({
        path: testInfo.outputPath("quick-vote-loading.png"),
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
      if (!touch) {
        await trigger.click();
        await dialog.click({ position: { x: 5, y: 5 } });
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
      }
      fail = true;
      await page.reload({ waitUntil: "domcontentloaded" });
      await trigger.click();
      await expect(
        dialog.getByRole("button", { name: "Try again" })
      ).toBeVisible();
      expect(await close.boundingBox()).toEqual(before);
      await close.click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    } finally {
      content.release();
    }
  });
}
