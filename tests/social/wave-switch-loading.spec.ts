import type { Page, Request } from "@playwright/test";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { expectAxeClean } from "../support/a11yAssertions";
import { installSurfaceSimulation } from "../support/surfaceSimulation";

const SOURCE = "00000000-0000-4000-8000-000000000529";
const TARGET = "00000000-0000-4000-8000-000000000533";
const NAME = "Sandbox Notifications Wave";
const SOURCE_NAME = "Local Composer Sandbox Wave";

useLocalSandboxMutationGuard(
  test,
  "PLAYWRIGHT_AUTH_SANDBOX",
  "Requires the local sandbox."
);
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "wait" });
});

async function installWaveList(page: Page, baseURL: string | undefined) {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  const response = await page.request.get(
    `${getSandboxApiOrigin(baseURL)}/api/v2/waves`
  );
  expect(response.ok()).toBe(true);
  const body = await response.json();
  const first = body.data[0];
  await page.route("**/api/v2/waves?**", (route) =>
    route.fulfill({
      json: { ...body, data: [first, { ...first, id: TARGET, name: NAME }] },
    })
  );
}

async function monitorTargetPaints(page: Page) {
  const monitor = await page.evaluateHandle(
    ({ target, name }) => {
      let frames = 0;
      let empty = 0;
      let pending = 0;
      let frame = 0;
      const sample = () => {
        if (location.pathname === `/waves/${target}`) {
          frames++;
          const pane = document.querySelector(
            '[data-testid="wave-content"], [data-testid="wave-pending"]'
          );
          if (
            !pane ||
            pane.getBoundingClientRect().height === 0 ||
            !document.body.textContent?.includes(name)
          )
            empty++;
          if (pane?.getAttribute("data-testid") === "wave-pending") pending++;
        }
        frame = requestAnimationFrame(sample);
      };
      frame = requestAnimationFrame(sample);
      return {
        read: () => ({ frames, empty, pending }),
        stop: () => cancelAnimationFrame(frame),
      };
    },
    { target: TARGET, name: NAME }
  );
  return async () => {
    try {
      await expect
        .poll(() => monitor.evaluate((value) => value.read().frames))
        .toBeGreaterThan(0);
      return await monitor.evaluate((value) => {
        value.stop();
        return value.read();
      });
    } finally {
      await monitor.dispose();
    }
  };
}

for (const app of [false, true]) {
  test(`keeps cold and cached wave switches visible (${app ? "app" : "web"})`, async ({
    page,
    baseURL,
  }, testInfo) => {
    // Capacitor uses the mobile layout; desktop web is exercised separately.
    test.skip(
      app && testInfo.project.name !== "web-mobile-chromium",
      "The native simulation uses the mobile viewport."
    );
    await installWaveList(page, baseURL);
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        baseURL
      );
    const mobile = testInfo.project.name === "web-mobile-chromium";
    const chat = page.getByRole("region", {
      name: "Wave chat file upload area",
    });
    const openList = async () => {
      if (mobile)
        await page
          .getByRole("button", { name: app ? "Back" : "Go back", exact: true })
          .click();
    };
    const choose = (name: string) =>
      page
        .getByRole("link", { name, exact: true })
        .filter({ visible: true })
        .first()
        .click();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`**/api/waves/${TARGET}`, async (route) => {
      await gate;
      await route.fallback();
    });
    try {
      await page.goto(`/waves/${SOURCE}?tab=chat`);
      await expect(chat).toBeVisible({ timeout: 60000 });
      await dismissNextDevTools(page);
      await openList();
      const request = page.waitForRequest(`**/api/waves/${TARGET}`);
      const coldPaints = await monitorTargetPaints(page);
      await choose(NAME);
      await request;
      const pending = page.getByTestId("wave-pending");
      await expect(pending).toBeVisible();
      await expect(pending.getByRole("status")).toHaveText(`Loading ${NAME}…`);
      await expect(chat).toHaveCount(0);
      await expectAxeClean(page, { include: ['[data-testid="wave-pending"]'] });
      await expectNoHorizontalOverflow(page);
      const bounds = await pending.boundingBox();
      const pendingHeader = app
        ? null
        : await pending
            .getByRole("heading")
            .locator("xpath=ancestor::div[contains(@class, 'tw-border-b')][1]")
            .boundingBox();
      const pendingName = app
        ? null
        : await pending.getByRole("heading").locator("span").boundingBox();
      // Hold the real query pending across painted frames; an endpoint-only
      // assertion misses the original all-black interval.
      const emptyFrames = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const start = performance.now();
            let empty = 0;
            const sample = () => {
              const pane = document.querySelector(
                '[data-testid="wave-pending"]'
              );
              if (!pane || pane.getBoundingClientRect().height === 0) empty++;
              if (performance.now() - start < 300)
                requestAnimationFrame(sample);
              else resolve(empty);
            };
            requestAnimationFrame(sample);
          })
      );
      expect(emptyFrames).toBe(0);
      await dismissNextDevTools(page);
      await page.screenshot({
        path: testInfo.outputPath("cold-wave-pending.png"),
      });
      release();
      await expect(chat).toBeVisible();
      await expect(pending).toHaveCount(0);
      const ready = await page.getByTestId("wave-content").boundingBox();
      expect(ready?.x).toBe(bounds?.x);
      expect(ready?.width).toBe(bounds?.width);
      expect(ready?.height).toBe(bounds?.height);
      if (pendingHeader) {
        const readyHeader = await page
          .getByTestId("wave-content")
          .getByRole("heading")
          .first()
          .locator("xpath=ancestor::div[contains(@class, 'tw-border-b')][1]")
          .boundingBox();
        expect(readyHeader?.height).toBe(pendingHeader.height);
      }
      if (pendingName) {
        const readyName = await page
          .getByTestId("wave-content")
          .getByRole("heading")
          .first()
          .getByRole("button")
          .boundingBox();
        expect(readyName?.x).toBe(pendingName.x);
        expect(readyName?.y).toBe(pendingName.y);
        expect(readyName?.height).toBe(pendingName.height);
      }
      await page.screenshot({
        path: testInfo.outputPath("cold-wave-ready.png"),
      });
      expect((await coldPaints()).empty).toBe(0);

      // A repeat visit must use cached data immediately, even if the network is
      // unavailable. No timer or minimum duration may force the pending shell.
      await openList();
      await choose(SOURCE_NAME);
      await expect(chat).toBeVisible();
      await openList();
      await page.route(`**/api/waves/${TARGET}`, (route) => route.abort());
      const cachedPaints = await monitorTargetPaints(page);
      await choose(NAME);
      await expect(chat).toBeVisible();
      await expect(pending).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      expect(await cachedPaints()).toMatchObject({ empty: 0, pending: 0 });
    } finally {
      release();
    }
  });
}

test("keeps wave identity on failure and recovers with Retry", async ({
  page,
  baseURL,
}) => {
  await installWaveList(page, baseURL);
  let fail = true;
  await page.route(`**/api/waves/${TARGET}`, async (route) => {
    if (fail)
      await route.fulfill({ status: 403, json: { error: "Unavailable" } });
    else await route.fallback();
  });
  await page.goto("/waves");
  await page
    .getByRole("link", { name: NAME, exact: true })
    .filter({ visible: true })
    .first()
    .click();
  const pending = page.getByTestId("wave-pending");
  await expect(pending.getByRole("heading")).toHaveText(NAME);
  await expect(pending.getByRole("alert")).toHaveText(
    "This wave could not be loaded."
  );
  await expectAxeClean(page, { include: ['[data-testid="wave-pending"]'] });
  const retry = pending.getByRole("button", { name: "Try again", exact: true });
  await retry.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS("outline-style", "solid");
  fail = false;
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Wave chat file upload area" })
  ).toBeVisible();
  await expect(pending).toHaveCount(0);
});

test("keeps the cached wave selected after an abandoned request settles", async ({
  page,
  baseURL,
}, testInfo) => {
  // This race requires two wave links visible together in the desktop sidebar.
  test.skip(
    testInfo.project.name !== "web-desktop-chromium",
    "Rapid sidebar switches use the desktop layout."
  );
  await installWaveList(page, baseURL);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requestStarted!: (request: Request) => void;
  const pendingRequest = new Promise<Request>((resolve) => {
    requestStarted = resolve;
  });
  await page.route(`**/api/waves/${TARGET}`, async (route) => {
    requestStarted(route.request());
    await gate;
    await route.fallback();
  });
  try {
    await page.goto(`/waves/${SOURCE}?tab=chat`);
    await expect(
      page.getByRole("region", { name: "Wave chat file upload area" })
    ).toBeVisible({ timeout: 60000 });
    await page.getByRole("link", { name: NAME, exact: true }).first().click();
    await expect(
      page.getByTestId("wave-pending").getByRole("heading")
    ).toHaveText(NAME);
    // Hold a real request before switching away. Depending on which query
    // consumer started it, navigation may cancel it or let it finish late.
    const request = await pendingRequest;
    const settledResponse = request.response();
    await page
      .getByRole("link", { name: SOURCE_NAME, exact: true })
      .first()
      .click();
    release();
    const response = await settledResponse;
    if (response) {
      expect(response.ok()).toBe(true);
      await response.finished();
    } else expect(request.failure()?.errorText).toBe("net::ERR_ABORTED");
    await expect(page).toHaveURL(new RegExp(`/waves/${SOURCE}$`));
    await expect(
      page.getByTestId("wave-content").getByRole("heading").first()
    ).toHaveText(SOURCE_NAME);
    await expect(page.getByTestId("wave-pending")).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/waves/${TARGET}$`));
    await expect(
      page.getByTestId("wave-content").getByRole("heading").first()
    ).toHaveText(NAME);
    await page.goForward();
    await expect(
      page.getByTestId("wave-content").getByRole("heading").first()
    ).toHaveText(SOURCE_NAME);
  } finally {
    release();
  }
});

for (const name of ["Sandbox Direct Message", "sandboxfriend"]) {
  test(`keeps a cold DM header stable (${name})`, async ({ page, baseURL }) => {
    const id = "00000000-0000-4000-8000-000000000532";
    const apiOrigin = getSandboxApiOrigin(baseURL);
    const overviewResponse = await page.request.get(
      `${apiOrigin}/api/v2/waves`
    );
    const overview = (await overviewResponse.json()).data[0];
    const waveResponse = await page.request.get(`${apiOrigin}/api/waves/${id}`);
    const wave = await waveResponse.json();
    await page.route("**/api/open-graph**", (route) =>
      route.fulfill({ json: {} })
    );
    await page.route("**/api/v2/waves?**", (route) =>
      route.fulfill({
        json: {
          data: [{ ...overview, id, name, is_dm_wave: true }],
          page: 1,
          next: false,
        },
      })
    );
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`**/api/waves/${id}`, async (route) => {
      await gate;
      await route.fulfill({ json: { ...wave, name } });
    });
    try {
      await page.goto("/messages");
      await page
        .getByRole("link", { name, exact: true })
        .filter({ visible: true })
        .first()
        .click();
      const pending = page.getByTestId("wave-pending");
      await expect(pending.getByRole("heading")).toHaveText(name);
      const before = await pending.getByRole("heading").boundingBox();
      release();
      const ready = page
        .getByTestId("wave-content")
        .getByRole("heading")
        .first();
      await expect(ready).toHaveText(name);
      const after = await ready.boundingBox();
      expect(after?.x).toBe(before?.x);
      expect(after?.y).toBe(before?.y);
      expect(after?.height).toBe(before?.height);
    } finally {
      release();
    }
  });
}

test("keeps the subwave title in place when parent navigation arrives", async ({
  page,
  baseURL,
}) => {
  const apiOrigin = getSandboxApiOrigin(baseURL);
  const overviewResponse = await page.request.get(`${apiOrigin}/api/v2/waves`);
  const parent = (await overviewResponse.json()).data[0];
  const child = { ...parent, id: TARGET, name: NAME, parent_wave: parent };
  const waveResponse = await page.request.get(
    `${apiOrigin}/api/waves/${TARGET}`
  );
  const wave = await waveResponse.json();
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route("**/api/v2/waves?**", (route) =>
    route.fulfill({
      json: {
        data: [{ ...parent, has_subwaves: true }],
        page: 1,
        next: false,
      },
    })
  );
  await page.route(`**/api/waves/${SOURCE}/subwaves?**`, (route) =>
    route.fulfill({
      json: {
        data: [child],
        page: 1,
        next: false,
      },
    })
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/waves/${TARGET}`, async (route) => {
    await gate;
    await route.fulfill({ json: { ...wave, parent_wave: parent } });
  });
  try {
    await page.goto("/waves");
    await page
      .getByRole("button", { name: /View.*subwave/ })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByRole("link", { name: NAME, exact: true })
      .filter({ visible: true })
      .first()
      .click();
    const pending = page.getByTestId("wave-pending");
    await expect(pending.getByRole("heading")).toHaveText(NAME);
    const pendingHeader = await pending
      .getByRole("heading")
      .locator("xpath=ancestor::div[contains(@class, 'tw-border-b')][1]")
      .boundingBox();
    const before = await pending
      .getByRole("heading")
      .locator("span")
      .boundingBox();
    release();
    const ready = page.getByTestId("wave-content").getByRole("heading").first();
    await expect(ready).toHaveText(NAME);
    const readyHeader = await page
      .getByTestId("wave-content")
      .getByRole("heading")
      .first()
      .locator("xpath=ancestor::div[contains(@class, 'tw-border-b')][1]")
      .boundingBox();
    expect(readyHeader?.height).toBe(pendingHeader?.height);
    const after = await ready.getByRole("button").boundingBox();
    expect(after?.x).toBe(before?.x);
    expect(after?.y).toBe(before?.y);
    expect(after?.height).toBe(before?.height);
    await expectNoHorizontalOverflow(page);
  } finally {
    release();
  }
});
