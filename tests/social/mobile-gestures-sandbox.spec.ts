import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import type { Locator, Page } from "@playwright/test";
import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  expectNoUnsafeSandboxMutations,
  getSandboxApiOrigin,
  hideNextDevOverlay,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import { longPressMessage } from "../support/longPressMessage";

const WAVE = "00000000-0000-4000-8000-000000000529";
useLocalSandboxMutationGuard(
  test,
  "PLAYWRIGHT_AUTH_SANDBOX",
  "Requires the local mock API."
);

async function touchDrag(page: Page, target: Locator, dx: number, dy = 0) {
  await target.click({ trial: true });
  const box = await target.boundingBox();
  if (!box) throw new Error("Swipe target must be visible");
  const x = Math.max(50, Math.min(300, box.x + box.width * 0.65));
  const y = box.y + box.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  // Deliver input at frame cadence, as a real finger does, instead of sending
  // the entire drag before the page has processed the initial touch.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  );
  for (let step = 1; step <= 8; step++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + (dx * step) / 8, y: y + (dy * step) / 8 }],
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    );
  }
  return {
    release: async () => {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await client.detach();
    },
    reverse: async () => {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + (dx > 0 ? 10 : -10), y }],
      });
    },
  };
}

async function openWave(page: Page) {
  await page.goto(`/waves/${WAVE}`, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(
    page.getByRole("textbox", { name: "Write a message" }).last()
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await expect(
    page
      .getByRole("tabpanel")
      .locator("[data-wave-drop-id][data-reply-enabled=true]")
      .first()
  ).toBeVisible();
}

async function installMessageFixture(page: Page, baseURL: string | undefined) {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route("**/api/waves/*/curations**", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route("**/api/drops/*/curations**", (route) =>
    route.fulfill({ json: [] })
  );
  const origin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(
    `${origin}/api/v2/waves/${WAVE}/drops?limit=50`
  );
  const feed = (await response.json()) as ApiWaveDropsFeedV2;
  const template = feed.drops[0];
  if (!template) throw new Error("Missing local message fixture");
  const drops = [
    { ...template, content: "Gesture fixture message one" },
    {
      ...template,
      id: "00000000-0000-4000-8000-000000000610",
      serial_no: 2,
      created_at: template.created_at + 1000,
      content: "Gesture fixture message two",
    },
  ].reverse();
  await page.route(`**/api/v2/waves/${WAVE}/drops?**`, (route) =>
    route.fulfill({ json: { ...feed, drops } })
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
}

for (const platform of ["ios", "android"] as const) {
  test.describe(`${platform} gesture browser simulation`, () => {
    test.beforeEach(async ({ context, baseURL, page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "Trusted touch input uses mobile Chromium; native bridge is simulated."
      );
      await installSurfaceSimulation(
        context,
        `capacitor-${platform}-sim`,
        baseURL
      );
      await hideNextDevOverlay(context);
      await page.setViewportSize({ width: 412, height: 840 });
      await installMessageFixture(page, baseURL);
    });

    test("wave-back follows interior touch, reverses and then commits without a second transition", async ({
      page,
      baseURL,
    }, testInfo) => {
      await openWave(page);
      const row = page
        .getByTestId("wave-swipe-surface")
        .locator("[data-wave-drop-id][data-reply-enabled=true]")
        .first();
      const dragging = await touchDrag(page, row, 115);
      await expect
        .poll(() =>
          page
            .getByTestId("wave-swipe-surface")
            .evaluate(
              (element) =>
                new DOMMatrixReadOnly(getComputedStyle(element).transform).m41
            )
        )
        .toBeGreaterThan(80);
      await page.screenshot({
        path: testInfo.outputPath("wave-back-tracking.png"),
      });
      await dragging.reverse();
      await dragging.release();
      await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}`));
      const committed = await touchDrag(page, row, 130);
      await committed.release();
      await expect(page).toHaveURL(/\/waves$/);
      await expect(
        page.getByRole("button", { name: "Find a wave…", exact: true })
      ).toBeVisible();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-wave-navigation-transition"
      );
      await expectNoHorizontalOverflow(page);
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("left swipe starts the existing reply only on release and leaves actions reachable", async ({
      page,
      baseURL,
    }) => {
      await openWave(page);
      const row = page
        .getByTestId("wave-swipe-surface")
        .locator("[data-wave-drop-id][data-reply-enabled=true]")
        .last();
      const timestampPreview = await touchDrag(page, row, -64);
      await expect
        .poll(() =>
          row
            .getByTestId("grouped-drop-swipe-timestamp")
            .evaluate((element) => Number(getComputedStyle(element).opacity))
        )
        .toBeGreaterThan(0.9);
      await timestampPreview.release();
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toHaveCount(0);
      const swipe = await touchDrag(page, row, -120);
      await expect(row).toHaveAttribute("data-reply-ready", "true");
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toHaveCount(0);
      await swipe.release();
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Post a reply" }).last()
      ).toBeFocused();
      await page
        .getByRole("button", { name: "Cancel reply", exact: true })
        .click();
      await expect(
        row.getByRole("button", { name: "Open drop actions", exact: true })
      ).toHaveCount(0);
      await longPressMessage(page, row);
      const sheet = page.getByRole("dialog", {
        name: "Drop actions",
        exact: true,
      });
      await expect(sheet).toBeAttached();
      await expect(
        sheet.getByRole("button", { name: "Reply", exact: true })
      ).toBeVisible();
      await sheet.getByRole("button", { name: "Reply", exact: true }).click();
      await expect(
        page.getByRole("textbox", { name: "Post a reply" }).last()
      ).toBeFocused();
      await expectNoUnsafeSandboxMutations(baseURL);
    });

    test("vertical scrolling does not reply or navigate, including with reduced motion", async ({
      page,
      baseURL,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openWave(page);
      const swipe = await touchDrag(
        page,
        page
          .getByTestId("wave-swipe-surface")
          .locator("[data-wave-drop-id][data-reply-enabled=true]")
          .first(),
        -30,
        -120
      );
      await swipe.release();
      await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}`));
      await expect(
        page.getByRole("button", { name: "Cancel reply", exact: true })
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await expectNoUnsafeSandboxMutations(baseURL);
    });
  });
}

test.describe("web message gesture regression", () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    await hideNextDevOverlay(context);
    await installMessageFixture(page, baseURL);
  });

  test("desktop mouse selection, hover timestamps and reply controls keep their behavior", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop mouse and hover coverage."
    );
    await page.goto(`/waves/${WAVE}`);
    await waitForRouteReady(page);
    await expect(
      page.getByRole("textbox", { name: "Write a message" }).last()
    ).toBeVisible();
    const message = page.getByText("Gesture fixture message two", {
      exact: true,
    });
    await expect(message).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const row = page
      .getByRole("tabpanel")
      .locator("[data-wave-drop-id][data-serial-no]")
      .filter({ has: message });
    await message.click({ trial: true });
    const box = await message.boundingBox();
    if (!box) throw new Error("Desktop message must be visible");
    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + Math.min(box.width - 8, 180),
      box.y + box.height / 2,
      { steps: 8 }
    );
    await page.mouse.up();
    await page.screenshot({
      path: testInfo.outputPath("desktop-selection.png"),
    });
    await expect
      .poll(() => page.evaluate(() => getSelection()?.toString().length ?? 0))
      .toBeGreaterThan(0);
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    await expect(row).not.toHaveAttribute("data-reply-swiping");
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toHaveCount(0);
    await page.evaluate(() => getSelection()?.removeAllRanges());
    await row.hover();
    await expect
      .poll(() =>
        row
          .getByTestId("grouped-drop-hover-timestamp")
          .evaluate((element) => Number(getComputedStyle(element).opacity))
      )
      .toBeGreaterThan(0.9);
    await row
      .getByRole("button", { name: "Reply to drop", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toBeVisible();
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("mobile web keeps right drags in the wave and supports swipe and long-press Reply", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Trusted mobile-web touch coverage."
    );
    await openWave(page);
    const row = page
      .getByRole("tabpanel")
      .locator("[data-wave-drop-id][data-reply-enabled=true]")
      .last();
    const back = await touchDrag(page, row, 130);
    await back.release();
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    const reply = await touchDrag(page, row, -120);
    await reply.release();
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Cancel reply", exact: true })
      .click();
    await expect(
      row.getByRole("button", { name: "Open drop actions", exact: true })
    ).toHaveCount(0);
    await longPressMessage(page, row);
    await page
      .getByRole("dialog", { name: "Drop actions", exact: true })
      .getByRole("button", { name: "Reply", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});
