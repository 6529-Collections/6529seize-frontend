import type { Locator, Page } from "@playwright/test";
import type { ApiWave } from "../../generated/models/ApiWave";
import { ApiDropModerationStatus } from "../../generated/models/ApiDropModerationStatus";
import { ApiWaveSubscriptionTargetAction } from "../../generated/models/ApiWaveSubscriptionTargetAction";
import {
  captureSafeScreenshot,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  expectNoUnsafeSandboxMutations,
  getSandboxApiOrigin,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const PREVIEW_ID = "00000000-0000-4000-8000-000000000533";
const CHAT_DROP_ID = "00000000-0000-4000-8000-000000000530";
const WAVE_NAME = "Follow The Repo";

async function installPreview(
  page: Page,
  baseURL: string | undefined,
  name = WAVE_NAME,
  following = true,
  sharedHref?: string
) {
  const response = await page.request.get(
    `${getSandboxApiOrigin(baseURL)}/api/waves/${WAVE_ID}`
  );
  expect(response.ok()).toBe(true);
  const wave: ApiWave = await response.json();
  const href = sharedHref ?? `${baseURL}/waves/${PREVIEW_ID}`;
  const preview: ApiWave = {
    ...wave,
    id: PREVIEW_ID,
    name,
    subscribed_actions: following
      ? [ApiWaveSubscriptionTargetAction.DropCreated]
      : [],
  };
  wave.description_drop.parts = [
    {
      part_id: 1,
      content: href,
      media: [],
      attachments: [],
      quoted_drop: null,
    },
  ];
  wave.description_drop.moderation = {
    status: ApiDropModerationStatus.Visible,
    can_view: true,
  };
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route(`**/api/waves/${WAVE_ID}`, (route) =>
    route.fulfill({ json: wave })
  );
  await page.route(`**/api/waves/${PREVIEW_ID}`, (route) =>
    route.fulfill({ json: preview })
  );
  await page.route(`**/api/v2/waves/${WAVE_ID}/drops?*`, async (route) => {
    const upstream = await route.fetch();
    const data = await upstream.json();
    data.drops = data.drops.map((drop: { id: string }) =>
      drop.id === CHAT_DROP_ID ? { ...drop, content: href } : drop
    );
    await route.fulfill({ response: upstream, json: data });
  });
}

async function expectReadablePreview(card: Locator) {
  const title = card.getByText(WAVE_NAME, { exact: true });
  await expect(title).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  const following = card.getByRole("button", {
    name: "Following",
    exact: true,
  });
  await expect(following).toBeVisible();
  const readLayout = async () => {
    const titleBox = await title.evaluate((el) => {
      const { y, height } = el.getBoundingClientRect();
      return {
        y,
        height,
        width: el.clientWidth,
        contentWidth: el.scrollWidth,
        lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
      };
    });
    const followBox = await following.evaluate((el) => {
      const { y, width, height } = el.getBoundingClientRect();
      return { y, width, height };
    });
    return { titleBox, followBox };
  };
  let layout = await readLayout();
  // Hydration may replace the preview after a visibility check. Measure
  // laid-out nodes before applying the same title and control constraints.
  await expect
    .poll(
      async () => {
        layout = await readLayout();
        return (
          layout.titleBox.height > 0 &&
          Number.isFinite(layout.titleBox.lineHeight) &&
          layout.followBox.width > 0 &&
          layout.followBox.height > 0
        );
      },
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    )
    .toBe(true);
  const { titleBox, followBox } = layout;
  // The short name should fit in full on one line, regardless of font metrics.
  expect(titleBox.contentWidth).toBeLessThanOrEqual(titleBox.width);
  expect(titleBox.height).toBeLessThanOrEqual(titleBox.lineHeight);
  expect(followBox.width).toBeGreaterThanOrEqual(80);
  expect(followBox.height).toBeGreaterThanOrEqual(24);
  await expect(title).toHaveCSS("white-space", "nowrap");
  return { titleBox, followBox };
}

test.describe("Embedded wave preview sandbox @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Wave previews require the isolated mock API runner."
  );

  test("keeps a shared NFT preview readable without marketplace actions on iOS", async ({
    page,
    baseURL,
  }) => {
    const listing = "https://manifold.xyz/@creator/id/123";
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      baseURL
    );
    await installPreview(page, baseURL, WAVE_NAME, true, listing);
    await page.route("**/api/nft-link?*", (route) =>
      route.fulfill({
        json: {
          is_enrichable: true,
          validation_error: null,
          data: {
            name: "Sample listing",
            price: "1",
            price_currency: "ETH",
            media_uri: `${baseURL}/6529.png`,
          },
        },
      })
    );
    await page.goto(`/waves/${WAVE_ID}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const chat = page.getByRole("region", {
      name: "Wave chat file upload area",
    });
    const card = chat.getByTestId("manifold-item-card");
    await expect(
      card.getByText("Sample listing", { exact: true })
    ).toBeVisible();
    await expect(card.getByTestId("manifold-item-media")).toBeVisible();
    await expect(card.getByRole("link")).toHaveCount(0);
    await expect(card.getByRole("button")).toHaveCount(0);
    await expect(card).not.toHaveAttribute("tabindex");
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps names readable in description cards and chat at narrow and wide widths", async ({
    page,
    baseURL,
  }, testInfo) => {
    await installPreview(page, baseURL);
    await page.goto(`/waves/${WAVE_ID}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const card = page
      .getByRole("region", { name: "Wave chat file upload area" })
      .getByRole("link", {
        name: `View wave ${WAVE_NAME}`,
        exact: true,
      })
      .locator("..");
    await expectReadablePreview(card);

    if (testInfo.project.name === "web-desktop-chromium") {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const details = page.getByRole("complementary", { name: "Wave details" });
      if (!(await details.isVisible())) {
        await page
          .getByRole("button", { name: "Show right sidebar", exact: true })
          .click();
      }
      const sidebarCard = page
        .getByRole("complementary", { name: "Wave details" })
        .getByRole("link", {
          name: `View wave ${WAVE_NAME}`,
          exact: true,
        })
        .locator("..");
      const { titleBox, followBox } = await expectReadablePreview(sidebarCard);
      expect(followBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
      await captureSafeScreenshot(
        page,
        testInfo,
        "wave-preview-desktop-sidebar"
      );
    } else {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await expectReadablePreview(card);
        await expectNoHorizontalOverflow(page);
      }
      await captureSafeScreenshot(page, testInfo, "wave-preview-mobile-chat");
    }
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("contains long unbroken names and preserves an independent follow action", async ({
    page,
    baseURL,
  }, testInfo) => {
    const name = "Wave".repeat(40);
    await installPreview(page, baseURL, name, false);
    await page.route(`**/api/waves/${PREVIEW_ID}/subscriptions`, (route) =>
      route.fulfill({ json: { actions: ["DROP_CREATED"] } })
    );
    await page.goto(`/waves/${WAVE_ID}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const card = page
      .getByRole("region", { name: "Wave chat file upload area" })
      .getByRole("link", { name: `View wave ${name}`, exact: true })
      .locator("..");
    const title = card.getByText(name, { exact: true });
    await expect(title).toBeVisible();
    await expect(title).toHaveCSS("text-overflow", "ellipsis");
    await expect(title).toHaveCSS("white-space", "nowrap");
    await expect
      .poll(() =>
        title.evaluate(
          (el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth
        )
      )
      .toBe(true);
    await expectNoHorizontalOverflow(page);
    const route = page.url();
    const follow = card.getByRole("button", { name: "Follow", exact: true });
    if (testInfo.project.name === "web-mobile-chromium") {
      await follow.tap();
    } else {
      await follow.focus();
      await page.keyboard.press("Enter");
    }
    await expect(
      card.getByRole("button", { name: "Following", exact: true })
    ).toBeVisible();
    expect(page.url()).toBe(route);
    await captureSafeScreenshot(page, testInfo, "long-wave-preview");
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});
