import type { Page, Request } from "@playwright/test";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { expectAxeClean } from "../support/a11yAssertions";
import { gateSidebarHydration } from "../support/sidebarHydration";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import { expectUrlState } from "../support/urlState";

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
  // Assertions and explicit gates have finished. Let page disposal cancel any
  // remaining bundle handlers instead of draining background work here.
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("opens a public wave on a quiet chat frame before hydration", async ({
  page,
}, testInfo) => {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  const hydration = await gateSidebarHydration(page);
  const loadingFrames = page
    .getByTestId("wave-chat-loading")
    .filter({ visible: true });
  // The covered interactive chat can have its own loader in the DOM. Select
  // the exposed frame by its accessible heading rather than document order.
  const loading = loadingFrames.filter({
    has: page.getByRole("heading", { name: SOURCE_NAME, exact: true }),
  });
  const preview = page.getByRole("region", {
    name: SOURCE_NAME,
    includeHidden: true,
  });
  try {
    await page.goto(`/waves/${SOURCE}?tab=chat`, { waitUntil: "commit" });
    await hydration.waitForDownloads();
    await expect(loading).toBeVisible();
    // The same semantic feed is in the server response, but must never be
    // painted as a temporary alternate chat in a JavaScript-enabled browser.
    await expect(
      preview.getByRole("article", { includeHidden: true })
    ).toHaveCount(1);
    await expect(
      preview.getByRole("link", { includeHidden: true })
    ).toHaveAttribute("href", new RegExp(`/waves/${SOURCE}\\?drop=`));
    await expect(preview).toBeHidden();
    await expect(
      loading.getByRole("heading", { name: SOURCE_NAME })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("wave-before-hydration.png"),
    });
  } finally {
    hydration.release();
  }
  await expect(
    page.getByRole("region", { name: "Wave chat file upload area" })
  ).toBeVisible({ timeout: 60000 });
  await expect(loadingFrames).toHaveCount(0);
  await expect(
    page.getByText("No waves in this collection yet", { exact: true })
  ).toBeHidden();
});

async function installWaveList(
  page: Page,
  baseURL: string | undefined,
  emptyDescription = false
) {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  const response = await page.request.get(
    `${getSandboxApiOrigin(baseURL)}/api/v2/waves`
  );
  expect(response.ok()).toBe(true);
  const body = await response.json();
  const first = body.data[0];
  const description = emptyDescription
    ? ""
    : (first.description_drop?.contents ??
      first.description_drop?.content ??
      "");
  await page.route(/\/api\/v2\/waves(?:\/all)?(?:\?|$)/, (route) =>
    route.fulfill({
      json: {
        ...body,
        data: [
          first,
          {
            ...first,
            id: TARGET,
            name: NAME,
            ...(emptyDescription
              ? { description_drop: { contents: "", media: [] } }
              : {}),
          },
        ],
        next_cursor: null,
        snapshot_expires_at: Date.now() + 900000,
      },
    })
  );
  return description;
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
          // Native entry keeps the real source list visible until the incoming
          // conversation commits. Every frame must show that list or the target pane.
          const pane = Array.from(
            document.querySelectorAll(
              '[data-testid="wave-content"], [data-testid="wave-pending"], [data-phone-navigation-screen="waves"][aria-hidden="false"]'
            )
          ).find((element) => {
            const style = getComputedStyle(element);
            return (
              element.getBoundingClientRect().height > 0 &&
              style.visibility === "visible" &&
              Number(style.opacity) > 0 &&
              (
                element.closest(
                  "[data-phone-navigation-screen], [data-phone-wave-page]"
                ) ?? element
              ).textContent?.includes(name)
            );
          });
          if (!pane) empty++;
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

for (const { app, emptyDescription } of [
  { app: false, emptyDescription: false },
  { app: true, emptyDescription: false },
  { app: false, emptyDescription: true },
]) {
  test(`keeps cold and cached wave switches visible (${app ? "app" : "web"})${emptyDescription ? " without a description" : ""}`, async ({
    page,
    baseURL,
  }, testInfo) => {
    // Capacitor uses the mobile layout; desktop web is exercised separately.
    test.skip(
      app && testInfo.project.name !== "web-mobile-chromium",
      "The native simulation uses the mobile viewport."
    );
    const description = await installWaveList(page, baseURL, emptyDescription);
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
      const response = await route.fetch();
      const wave = await response.json();
      // Both responses describe the same wave. Keep the full response aligned
      // with the overview instead of inheriting the sandbox's empty parts.
      await route.fulfill({
        response,
        json: {
          ...wave,
          description_drop: {
            ...wave.description_drop,
            parts: [
              { ...wave.description_drop.parts[0], content: description },
            ],
          },
        },
      });
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
          .locator("header")
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
    await page.route(/\/api\/v2\/waves(?:\/all)?(?:\?|$)/, (route) =>
      route.fulfill({
        json: {
          data: [{ ...overview, id, name, is_dm_wave: true }],
          page: 1,
          next: false,
          next_cursor: null,
          snapshot_expires_at: Date.now() + 900000,
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

for (const app of [false, true]) {
  const title = app
    ? "shows a centered unread subwave chevron in the app"
    : "keeps the subwave title in place when parent navigation arrives";
  test(title, async ({ page, baseURL }, testInfo) => {
    // Capacitor simulation runs in the phone project. The web case covers desktop.
    test.skip(
      app && testInfo.project.name !== "web-mobile-chromium",
      "Native simulation uses the mobile viewport."
    );
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        baseURL
      );
    const apiOrigin = getSandboxApiOrigin(baseURL);
    const overviewResponse = await page.request.get(
      `${apiOrigin}/api/v2/waves`
    );
    const { data }: { data: ApiWaveOverview[] } = await overviewResponse.json();
    const parentOverview = data[0];
    if (!parentOverview) throw new Error("Missing parent wave in the sandbox");
    const parent = {
      ...parentOverview,
      has_subwaves: true,
      context_profile_context: {
        ...parentOverview.context_profile_context,
        followed_subwaves_count: 1,
        subwave_unread_drops: 2,
      },
    };
    const child = {
      ...parentOverview,
      id: TARGET,
      name: NAME,
      parent_wave: parent,
      context_profile_context: {
        ...parentOverview.context_profile_context,
        subscribed: true,
        unread_drops: 2,
      },
      // The full child fixture below has no description text.
      description_drop: { contents: "", media: [] },
    };
    const waveResponse = await page.request.get(
      `${apiOrigin}/api/waves/${TARGET}`
    );
    const wave = await waveResponse.json();
    await page.route("**/api/open-graph**", (route) =>
      route.fulfill({ json: {} })
    );
    await page.route(/\/api\/v2\/waves(?:\/all)?(?:\?|$)/, (route) =>
      route.fulfill({
        json: {
          data: [parent],
          page: 1,
          next: false,
          next_cursor: null,
          snapshot_expires_at: Date.now() + 900000,
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
      const parentLink = page
        .getByRole("link", { name: parent.name, exact: true })
        .filter({ visible: true })
        .first();
      const expand = page
        .getByRole("button", {
          name: `Expand ${parent.name} subwaves`,
          expanded: false,
        })
        .filter({ visible: true })
        .first();
      const collapse = page
        .getByRole("button", {
          name: `Collapse ${parent.name} subwaves`,
          expanded: true,
        })
        .filter({ visible: true })
        .first();
      const childLink = page
        .getByRole("link", { name: NAME, exact: true })
        .filter({ visible: true })
        .first();
      await expect(expand).toBeVisible();
      await expect(expand).toHaveAccessibleDescription("2 new in subwaves");
      await expect(
        expand.getByTestId("sidebar-subwave-unread-dot")
      ).toBeVisible();
      await expect(childLink).toBeHidden();
      if (testInfo.project.name === "web-desktop-chromium") {
        const chevronBounds = await expand.boundingBox();
        const linkBounds = await parentLink.boundingBox();
        expect(chevronBounds!.x + chevronBounds!.width).toBeLessThan(
          linkBounds!.x
        );
        await parentLink.click();
        const isParentRoute = (url: URL) => url.pathname === `/waves/${SOURCE}`;
        await expectUrlState(page, isParentRoute);
        await expect(childLink).toBeVisible();
        await collapse.press("Space");
        await expect(childLink).toBeHidden();
        await expectUrlState(page, isParentRoute);
      }
      if (testInfo.project.name === "web-mobile-chromium") {
        await expect(expand).toHaveCSS("width", "44px");
        await expect(expand).toHaveCSS("height", "44px");
        await expect(expand).toHaveCSS("border-top-width", "0px");
        await expect
          .poll(() =>
            expand.evaluate((button) => {
              const avatar = button.parentElement?.querySelector(
                '[data-testid="sidebar-wave-avatar"]'
              )?.firstElementChild;
              const surface = button.firstElementChild;
              if (!avatar || !surface) return null;
              const chevronBounds = button.getBoundingClientRect();
              const avatarBounds = avatar.getBoundingClientRect();
              const chevronCenter = chevronBounds.y + chevronBounds.height / 2;
              const avatarCenter = avatarBounds.y + avatarBounds.height / 2;
              return {
                centered: Math.abs(chevronCenter - avatarCenter) <= 1,
                surfaceShadow: getComputedStyle(surface).boxShadow,
              };
            })
          )
          .toEqual({ centered: true, surfaceShadow: "none" });
        const waveListUrl = page.url();
        await expand.tap();
        await expect(childLink).toBeVisible();
        await expect(page).toHaveURL(waveListUrl);
      } else {
        await expand.click();
      }
      await expect(collapse).toBeVisible();
      await expect(
        collapse.getByTestId("sidebar-subwave-unread-dot")
      ).toHaveCount(0);
      if (app) {
        await collapse.tap();
        await expect(childLink).toBeHidden();
        await expect(
          expand.getByTestId("sidebar-subwave-unread-dot")
        ).toBeVisible();
        await expectNoHorizontalOverflow(page);
        return;
      }
      await childLink.click();
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
      const ready = page
        .getByTestId("wave-content")
        .getByRole("heading")
        .first();
      await expect(ready).toHaveText(NAME);
      const readyHeader = await page
        .getByTestId("wave-content")
        .locator("header")
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
}

for (const app of [false, true]) {
  test(`keeps deep-linked drop loading over the wave (${app ? "app" : "web"})`, async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      app && testInfo.project.name !== "web-mobile-chromium",
      "Native simulation uses the mobile viewport."
    );
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        baseURL
      );
    const dropId = "ux-unavailable-drop";
    await page.route("**/api/open-graph**", (route) =>
      route.fulfill({ json: {} })
    );
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/v2/drops?**", async (route) => {
      if (
        !new URL(route.request().url()).searchParams
          .get("ids")
          ?.split(",")
          .includes(dropId)
      )
        return route.fallback();
      await gate;
      return route.fulfill({
        status: 404,
        json: { error: "Drop unavailable" },
      });
    });
    try {
      await page.goto(`/waves/${SOURCE}?drop=${dropId}`, {
        waitUntil: "domcontentloaded",
      });
      const pending = page
        .getByTestId("single-drop-loading")
        .filter({ visible: true })
        .first();
      await expect(pending).toBeVisible({ timeout: 60000 });
      await expect(
        pending.getByRole("status", { name: "Loading…" })
      ).toBeVisible();
      // The route fallback can paint before the interactive query mounts.
      // Its Close control identifies the actual pending detail surface.
      const loadingClose = pending.getByRole("button", { name: "Close panel" });
      await expect(loadingClose).toBeVisible();
      const viewportWidth = page.viewportSize()?.width ?? 1280;
      await expect(loadingClose).toHaveCSS(
        "border-top-width",
        viewportWidth >= 640 ? "0px" : "1px"
      );
      await expect(
        pending.getByRole("button", { name: "Close panel" }).locator("svg")
      ).toBeVisible();
      const uncoveredFrames = await page.evaluate(
        () =>
          new Promise<string[]>((resolve) => {
            const started = performance.now();
            const uncovered: string[] = [];
            const sample = () => {
              // Auth restoration can also mount a route loader inside the
              // inert wave. Measure the foreground panel, not that hidden copy.
              const pane = Array.from(
                document.querySelectorAll('[data-testid="single-drop-loading"]')
              ).find(
                (candidate) =>
                  candidate.checkVisibility() &&
                  !candidate.closest('[inert], [aria-hidden="true"]')
              );
              const bounds = pane?.getBoundingClientRect();
              const top =
                bounds &&
                document.elementFromPoint(
                  bounds.x + bounds.width / 2,
                  bounds.y + bounds.height / 2
                );
              if (!pane || !bounds?.height || !top || !pane.contains(top)) {
                uncovered.push(
                  JSON.stringify({
                    bounds,
                    hit: top?.outerHTML.slice(0, 300),
                    viewportHit: document
                      .elementFromPoint(innerWidth / 2, innerHeight / 2)
                      ?.outerHTML.slice(0, 300),
                    panels: Array.from(
                      document.querySelectorAll(
                        '[data-testid="single-drop-loading"]'
                      )
                    ).map((node) => ({
                      visible: node.checkVisibility(),
                      hiddenAncestor: node
                        .closest('[inert], [aria-hidden="true"]')
                        ?.outerHTML.slice(0, 300),
                    })),
                  })
                );
              }
              if (performance.now() - started < 250)
                requestAnimationFrame(sample);
              else resolve(uncovered);
            };
            requestAnimationFrame(sample);
          })
      );
      expect(uncoveredFrames).toEqual([]);
      await expectNoHorizontalOverflow(page);
      release();
      // Preserve the application's automatic retry budget (three retries with
      // exponential backoff) before expecting the terminal recovery state.
      await expect(pending.getByRole("alert")).toHaveText(
        "This content could not be loaded.",
        { timeout: 15000 }
      );
      const close = pending.getByRole("button", { name: "Close panel" });
      await expect(close).toBeFocused();
      // Closing client-owned detail must not wait on another server render.
      const routeReads: string[] = [];
      await page.route(`**/waves/${SOURCE}**`, async (route) => {
        if (new URL(route.request().url()).searchParams.has("_rsc")) {
          routeReads.push(route.request().url());
          return route.abort();
        }
        return route.fallback();
      });
      await page.keyboard.press("Escape");
      await expect(page).not.toHaveURL(/drop=/);
      await expect(pending).toHaveCount(0);
      expect(routeReads).toEqual([]);
    } finally {
      release();
    }
  });
}
