import type { Page } from "@playwright/test";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";

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
    let first = true;
    let fail = false;
    const content = gate();
    await page.route("**/api/waves/*/undiscovered-drop**", async (route) => {
      const footer = first;
      first = false;
      if (!footer) await content.ready;
      await route.fulfill(
        fail && !footer
          ? { status: 400, json: { error: "Fixture error" } }
          : { json: { drop, total_count: 5, left_to_vote_in_current_round: 3 } }
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
      first = true;
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
