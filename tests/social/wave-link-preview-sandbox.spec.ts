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

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const PREVIEW_ID = "00000000-0000-4000-8000-000000000533";
const WAVE_NAME = "Follow The Repo";

async function installPreview(
  page: Page,
  baseURL: string | undefined,
  name = WAVE_NAME,
  following = true
) {
  const response = await page.request.get(
    `${getSandboxApiOrigin(baseURL)}/api/waves/${WAVE_ID}`
  );
  expect(response.ok()).toBe(true);
  const wave: ApiWave = await response.json();
  const href = `${baseURL}/waves/${PREVIEW_ID}`;
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
    data.drops = data.drops.map((drop: { content: string }) => ({
      ...drop,
      content: href,
    }));
    await route.fulfill({ response: upstream, json: data });
  });
}

async function expectReadablePreview(card: Locator) {
  const title = card.getByText(WAVE_NAME, { exact: true });
  await expect(title).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  const titleBox = await title.boundingBox();
  const following = card.getByRole("button", {
    name: "Following",
    exact: true,
  });
  const followBox = await following.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(followBox).not.toBeNull();
  // This name fits in the sidebar when it can use the available card width.
  expect(titleBox!.width).toBeGreaterThan(125);
  expect(titleBox!.height).toBeLessThanOrEqual(28);
  expect(followBox!.width).toBeGreaterThanOrEqual(80);
  expect(followBox!.height).toBeGreaterThanOrEqual(24);
  await expect(title).toHaveCSS("white-space", "nowrap");
}

test.describe("Embedded wave preview sandbox @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Wave previews require the isolated mock API runner."
  );

  test("keeps names readable in description cards and chat at narrow and wide widths", async ({
    page,
    baseURL,
  }, testInfo) => {
    await installPreview(page, baseURL);
    await page.goto(`/waves/${WAVE_ID}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const chat = page.getByRole("region", {
      name: "Wave chat file upload area",
    });
    const card = chat
      .locator("div.tw-group")
      .filter({
        has: page.getByRole("link", {
          name: `View wave ${WAVE_NAME}`,
          exact: true,
        }),
      })
      .last();
    await expectReadablePreview(card);

    if (testInfo.project.name === "web-desktop-chromium") {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const details = page.getByRole("complementary", { name: "Wave details" });
      if (!(await details.isVisible())) {
        await page
          .getByRole("button", { name: "Show right sidebar", exact: true })
          .click();
      }
      const sidebarCard = details
        .locator("div.tw-group")
        .filter({
          has: page.getByRole("link", {
            name: `View wave ${WAVE_NAME}`,
            exact: true,
          }),
        })
        .last();
      await expectReadablePreview(sidebarCard);
      const titleBox = await sidebarCard
        .getByText(WAVE_NAME, { exact: true })
        .boundingBox();
      const followBox = await sidebarCard
        .getByRole("button", { name: "Following", exact: true })
        .boundingBox();
      expect(followBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height);
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
    expect(await title.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true
    );
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
