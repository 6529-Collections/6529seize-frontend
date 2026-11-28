import AxeBuilder from "@axe-core/playwright";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import { devices, type Locator, type Page } from "@playwright/test";
import {
  captureSafeScreenshot,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WAVE = "00000000-0000-4000-8000-000000000529";
const NAME =
  "A profile wave with a long name for artwork and quiet conversations";

type Bounds = { x: number; y: number; width: number; height: number };

function expectPointerInside(before: Bounds | null, after: Bounds | null) {
  if (!before || !after)
    throw new Error("The disclosure must retain layout bounds");
  const x = before.x + before.width / 2;
  const y = before.y + before.height / 2;
  expect(x).toBeGreaterThanOrEqual(after.x);
  expect(x).toBeLessThanOrEqual(after.x + after.width);
  expect(y).toBeGreaterThanOrEqual(after.y);
  expect(y).toBeLessThanOrEqual(after.y + after.height);
}

async function expectFloatingCloseButton(card: Locator) {
  const close = card.getByRole("button", { name: "Close", exact: true });
  await expect(close).toBeVisible();
  await expect(close).toBeInViewport();
  const surface = card.locator(".mobile-wrapper-dialog > div").last();
  const closeBox = await close.boundingBox();
  const surfaceBox = await surface.boundingBox();
  if (!closeBox || !surfaceBox)
    throw new Error("Sheet and close button must have layout bounds");
  expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(surfaceBox.y);
  return close;
}

async function installPreview(
  page: Page,
  baseURL: string | undefined,
  {
    count = 2,
    tiles = 4,
    banner = false,
    link = false,
    state = "ready",
    dropCount = 1,
    description = "A quiet place for artwork and conversation. Long descriptions remain readable beside the artwork without running into the close button. This description continues so the sheet exercises its three-line limit.",
  }: {
    count?: number;
    tiles?: number;
    banner?: boolean;
    link?: boolean;
    state?: "ready" | "loading" | "error";
    description?: string;
    dropCount?: number;
  } = {}
) {
  const origin = getSandboxApiOrigin(baseURL);
  const wave: ApiWave = await (
    await page.request.get(`${origin}/api/waves/${WAVE}`)
  ).json();
  const feed: ApiWaveDropsFeedV2 = await (
    await page.request.get(`${origin}/api/v2/waves/${WAVE}/drops?limit=50`)
  ).json();
  const template = feed.drops[0];
  if (!template) throw new Error("Missing chat fixture");
  const preview = {
    ...wave,
    name: NAME,
    author: {
      ...wave.author,
      banner1_color: banner ? "#7c4c30" : null,
      banner2_color: banner ? "#37545e" : null,
    },
    description_drop: {
      ...wave.description_drop,
      parts: [
        {
          ...wave.description_drop.parts[0],
          part_id: 1,
          content: description,
          media: [],
          attachments: [],
          quoted_drop: null,
        },
      ],
    },
  };
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route("https://d3lqz0a4bldqgf.cloudfront.net/**", (route) =>
    route.fulfill({
      path: "public/artwork-documentation/examples/an-alteration.png",
      contentType: "image/png",
    })
  );
  await page.routeWebSocket(
    (url) => url.port === new URL(origin).port,
    (socket) => {
      socket.onMessage((message) => {
        if (JSON.parse(String(message)).type === "AUTHENTICATE")
          socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
      });
    }
  );
  await page.route(`**/api/waves/${WAVE}`, (route) =>
    route.fulfill({ json: preview })
  );
  await page.route("**/api/profiles/*/wave", (route) =>
    route.fulfill({
      json: { profile_wave_id: WAVE, profile_curation_id: "preview" },
    })
  );
  await page.route(`**/api/v2/waves/${WAVE}/drops?*`, (route) =>
    route.fulfill({
      json: {
        ...feed,
        drops: Array.from({ length: dropCount }, (_, i) => ({
          ...template,
          id: `00000000-0000-4000-8000-${String(530 + i).padStart(12, "0")}`,
          serial_no: i + 1,
          created_at: template.created_at + i * 1000,
          author: {
            ...template.author,
            badges: {
              ...template.author.badges,
              profile_wave_id: WAVE,
              profile_wave_name: NAME,
            },
          },
        })),
      },
    })
  );
  await page.route(
    `**/api/v2/waves/${WAVE}/curations/preview/drops?*`,
    async (route) => {
      if (state === "loading") return;
      return route.fulfill({
        json: {
          page: 1,
          next: false,
          data: Array.from({ length: tiles }, (_, i) => ({
            ...template,
            id: `preview-${i}`,
            content: link
              ? "An artwork reference https://example.com/preview-art"
              : `Artwork caption ${i + 1} with enough text to wrap over two lines`,
            media: link
              ? []
              : [
                  {
                    url: "https://d3lqz0a4bldqgf.cloudfront.net/drops/preview-artwork.png",
                    mime_type: "image/png",
                  },
                ],
          })),
        },
      });
    }
  );
  await page.route("**/api/waves?*", async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("author") !== "playwright"
    )
      return route.fallback();
    if (state === "loading") return;
    if (state === "error")
      return route.fulfill({
        status: 400,
        json: { error: "Fixture read unavailable" },
      });
    const cursor = new URL(route.request().url()).searchParams.get(
      "serial_no_less_than"
    );
    const waves = Array.from({ length: count }, (_, i) => ({
      ...wave,
      id: `created-${i}`,
      name: `Created wave ${i + 1}`,
      serial_no: count - i,
    }));
    return route.fulfill({
      json: waves
        .filter((item) => cursor === null || item.serial_no < Number(cursor))
        .slice(0, 20),
    });
  });
  await page.goto(`/waves/${WAVE}`, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(
    page.getByRole("textbox", { name: "Write a message" }).last()
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page.locator(`button[data-wave-id="${WAVE}"]`).first();
}

test.describe("Profile-wave badge preview @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Requires the isolated API fixture."
  );

  test("keeps the hover disclosure under the pointer when expanding", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Mouse interaction contract"
    );
    await page.setViewportSize({ width: 1600, height: 1100 });
    const badge = await installPreview(page, baseURL);
    await badge.hover();
    const card = page.getByRole("dialog", { name: `Wave details for ${NAME}` });
    const toggle = card.getByRole("button", { name: "Show all waves" });
    await expect(toggle).toBeVisible();
    await toggle.hover();
    const before = await toggle.boundingBox();
    await toggle.click();
    await expect(
      card.getByText("Created wave 2", { exact: true })
    ).toBeVisible();
    const after = await card
      .getByRole("button", { name: "Hide waves" })
      .boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    if (!before || !after)
      throw new Error("The disclosure must have layout bounds");
    expect(
      Math.abs(after.x + after.width - before.x - before.width)
    ).toBeLessThanOrEqual(2);
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(2);
    // The shorter Hide label changes width, but the original click remains
    // inside the control and the preview column stays fixed.
    expect(before.x + before.width / 2).toBeGreaterThanOrEqual(after.x);
    expect(before.x + before.width / 2).toBeLessThanOrEqual(
      after.x + after.width
    );
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, testInfo, "profile-wave-hover-expanded");
    await card.getByRole("button", { name: "Hide waves" }).click();
    await expect(
      card.getByRole("region", { name: "Created waves" })
    ).toHaveCount(0);
    await expect(
      card.getByRole("link", { name: "Open profile wave" })
    ).toHaveAttribute("href", `/waves/${WAVE}?curation=preview`);
  });

  test("fits a short touch sheet and scrolls the whole long preview", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, "Touch interaction contract");
    const badge = await installPreview(page, baseURL);
    await badge.tap();
    const card = page.getByRole("dialog");
    await expect(
      card.getByRole("link", { name: "Open profile wave" })
    ).toBeVisible();
    await card.getByRole("button", { name: "Show all waves" }).tap();
    const section = card.getByRole("region", { name: "Created waves" });
    await expect(
      section.getByText("Created wave 2", { exact: true })
    ).toBeVisible();
    // The only scrolling owner is the shared dialog; previews and rows must
    // remain in its content flow instead of being squeezed into inner panes.
    expect(await section.locator(".tw-overflow-y-auto").count()).toBe(0);
    const close = await expectFloatingCloseButton(card);
    await expect(
      section.getByRole("link", { name: "Show all brain activity" })
    ).toHaveAttribute("href", "/playwright/brain");
    await expectNoHorizontalOverflow(page);
    const scroller = card.locator(".tw-overflow-y-auto");
    await expect(scroller).toHaveCount(1);
    await scroller.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight })
    );
    await expect(
      section.getByText("Created wave 2", { exact: true })
    ).toBeInViewport();
    await expectFloatingCloseButton(card);
    await captureSafeScreenshot(page, testInfo, "profile-wave-sheet-expanded");
    await close.tap();
    await expect(card).toHaveCount(0);
    await expect(badge).toBeFocused();
  });

  test("uses the sheet on a compact desktop and hover at the desktop breakpoint", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Non-touch viewport interaction contract"
    );
    await page.setViewportSize({ width: 513, height: 900 });
    const badge = await installPreview(page, baseURL, { tiles: 1 });
    await expect(badge).toHaveAttribute("aria-haspopup", "dialog");
    await badge.click();
    const sheet = page.getByRole("dialog");
    const openWave = sheet.getByRole("link", { name: "Open profile wave" });
    await expect(openWave).toHaveAttribute(
      "href",
      `/waves/${WAVE}?curation=preview`
    );
    await sheet.getByRole("button", { name: "Show all waves" }).click();
    await expect(
      sheet.getByText("Created wave 2", { exact: true })
    ).toBeVisible();
    const openBounds = await openWave.boundingBox();
    const toggleBounds = await sheet
      .getByRole("button", { name: "Hide waves" })
      .boundingBox();
    if (!openBounds || !toggleBounds)
      throw new Error("Sheet actions must have layout bounds");
    expect(openBounds.height).toBe(44);
    expect(openBounds.width).toBe(513 - 32);
    expect(toggleBounds.y).toBeGreaterThanOrEqual(
      openBounds.y + openBounds.height
    );
    const close = await expectFloatingCloseButton(sheet);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, testInfo, "profile-wave-compact-desktop");
    await close.click();
    await expect(sheet).toHaveCount(0);
    await expect(badge).toBeFocused();

    await page.setViewportSize({ width: 1023, height: 900 });
    await expect(badge).toHaveAttribute("aria-haspopup", "dialog");
    await badge.press("Enter");
    await expectFloatingCloseButton(sheet);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(badge).toBeFocused();

    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(badge).not.toHaveAttribute("aria-haspopup", "dialog");
    await badge.hover();
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Open profile wave" })
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "Close", exact: true })
    ).toHaveCount(0);
  });

  for (const tiles of [0, 1]) {
    test(`fits short content with ${tiles} preview tiles`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(!testInfo.project.use.hasTouch, "Touch sheet geometry");
      await page.setViewportSize({ width: 390, height: 844 });
      const badge = await installPreview(page, baseURL, {
        tiles,
        count: 1,
        banner: tiles === 1,
        description: "A quiet place for art.",
      });
      await badge.tap();
      const card = page.getByRole("dialog");
      await card.getByRole("button", { name: "Show all waves" }).tap();
      await expect(
        card.getByText("Created wave 1", { exact: true })
      ).toBeVisible();
      const scroller = card.locator(".tw-overflow-y-auto");
      await expect(scroller).toHaveCount(1);
      const sizes = await scroller.evaluate((element) => ({
        height: element.clientHeight,
        content: element.scrollHeight,
      }));
      expect(sizes.content).toBeLessThanOrEqual(sizes.height + 1);
      const row = await card
        .getByRole("link", { name: /Created wave 1/ })
        .boundingBox();
      const bounds = await scroller.boundingBox();
      if (!row || !bounds)
        throw new Error("Short sheet content must have layout bounds");
      // Only the requested 20px section padding should follow the final row.
      expect(bounds.y + bounds.height - row.y - row.height).toBeLessThanOrEqual(
        24
      );
      await expectNoHorizontalOverflow(page);
      await expectFloatingCloseButton(card);
      if (tiles === 0 && testInfo.project.name === "web-mobile-chromium") {
        const accessibility = await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(accessibility.violations).toEqual([]);
      }
      await captureSafeScreenshot(
        page,
        testInfo,
        `profile-wave-short-${tiles}`
      );
    });
  }

  test("keeps long created-wave lists reachable in the sheet", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, "Touch scrolling contract");
    const badge = await installPreview(page, baseURL, { tiles: 1, count: 25 });
    await badge.tap();
    const card = page.getByRole("dialog");
    await card.getByRole("button", { name: "Show all waves" }).tap();
    await expect(
      card.getByText("Created wave 20", { exact: true })
    ).toBeVisible();
    const scroller = card.locator(".tw-overflow-y-auto");
    await expect(scroller).toHaveCount(1);
    await scroller.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight })
    );
    await expect(
      card.getByText("Created wave 25", { exact: true })
    ).toBeVisible();
    await scroller.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight })
    );
    await expect(
      card.getByText("Created wave 25", { exact: true })
    ).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  });

  for (const state of ["loading", "empty", "error"] as const) {
    test(`retains the ${state} state and navigation actions`, async ({
      page,
      baseURL,
    }, testInfo) => {
      const badge = await installPreview(page, baseURL, {
        tiles: 0,
        count: 0,
        state: state === "empty" ? "ready" : state,
      });
      if (testInfo.project.use.hasTouch) await badge.tap();
      else await badge.hover();
      const card = page.getByRole("dialog");
      await card.getByRole("button", { name: "Show all waves" }).click();
      const messages = {
        loading: "Loading waves...",
        empty: "No waves created yet.",
        error: "Unable to load waves right now. Please try again.",
      };
      await expect(
        card.getByText(messages[state], { exact: true })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        card.getByRole("link", { name: "Open profile wave" })
      ).toBeVisible();
      await expect(
        card.getByRole("link", { name: "Show all brain activity" })
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test("keeps the desktop card edge fixed when a second column cannot fit", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop viewport edge contract"
    );
    await page.setViewportSize({ width: 1024, height: 900 });
    const badge = await installPreview(page, baseURL, { tiles: 1, count: 25 });
    await badge.hover();
    const card = page.getByRole("dialog");
    const toggle = card.getByRole("button", { name: "Show all waves" });
    await expect(toggle).toBeVisible();
    const before = await card.boundingBox();
    const pointerTarget = await toggle.boundingBox();
    await toggle.click();
    await expect(
      card.getByText("Created wave 2", { exact: true })
    ).toBeVisible();
    const after = await card.boundingBox();
    const hide = await card
      .getByRole("button", { name: "Hide waves" })
      .boundingBox();
    expectPointerInside(pointerTarget, hide);
    if (!before || !after)
      throw new Error("The hover card must have layout bounds");
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(2);
    expect(after.x + after.width).toBeLessThanOrEqual(1024);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, testInfo, "profile-wave-narrow-desktop");
    await expect(
      card.getByRole("button", { name: "Hide waves" })
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      card.getByRole("button", { name: "Show all waves" })
    ).toBeFocused();
    await page.keyboard.press("Space");
    await expect(
      card.getByRole("button", { name: "Hide waves" })
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(card).toHaveCount(0);
    await expect(badge).toBeFocused();
  });

  test("keeps the footer steady below a badge near the top", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop anchor orientation contract"
    );
    await page.setViewportSize({ width: 1600, height: 1100 });
    const badge = await installPreview(page, baseURL, {
      tiles: 0,
      count: 20,
      dropCount: 8,
    });
    await badge.evaluate((element) =>
      element.scrollIntoView({ block: "start" })
    );
    const badgeBounds = await badge.boundingBox();
    expect(badgeBounds?.y).toBeLessThan(550);
    await badge.hover();
    const card = page.getByRole("dialog");
    const toggle = card.getByRole("button", { name: "Show all waves" });
    await expect(toggle).toBeVisible();
    const before = await toggle.boundingBox();
    await toggle.click();
    await expect(
      card.getByText("Created wave 2", { exact: true })
    ).toBeVisible();
    expectPointerInside(
      before,
      await card.getByRole("button", { name: "Hide waves" }).boundingBox()
    );
    const bounds = await card.boundingBox();
    if (!bounds) throw new Error("The card must retain layout bounds");
    expect(bounds.y).toBeGreaterThanOrEqual(8);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(1092);
    await expectNoHorizontalOverflow(page);
  });

  test("retains the external link preview", async ({
    page,
    baseURL,
  }, testInfo) => {
    const badge = await installPreview(page, baseURL, { tiles: 1, link: true });
    if (testInfo.project.use.hasTouch) await badge.tap();
    else await badge.hover();
    const card = page.getByRole("dialog");
    await expect(
      card.getByRole("link", { name: /example.com/ })
    ).toHaveAttribute("href", "https://example.com/preview-art");
    await expect(
      card.getByRole("link", { name: "Open profile wave" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test.describe("iPad touch at a desktop width", () => {
    test.use({
      userAgent: devices["iPad Pro 11"].userAgent,
      viewport: devices["iPad Pro 11"].viewport,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    test("opens the sheet instead of a hover card", async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "One tablet representative"
      );
      const badge = await installPreview(page, baseURL, { tiles: 1 });
      await badge.tap();
      const card = page.getByRole("dialog").filter({
        has: page.getByRole("button", { name: "Close", exact: true }),
      });
      await expect(
        card.getByRole("button", { name: "Close", exact: true })
      ).toBeVisible();
      await card.getByRole("button", { name: "Show all waves" }).tap();
      await expect(
        card.getByText("Created wave 2", { exact: true })
      ).toBeVisible();
      await expect(card.locator(".tw-overflow-y-auto")).toHaveCount(1);
      await expectFloatingCloseButton(card);
      await captureSafeScreenshot(page, testInfo, "profile-wave-ipad");
    });
  });
});
