import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  isCapacitorSimulationProject,
  isMobileSurfaceProject,
} from "../support/surfaceSimulation";

test.describe("The Memes Page @smoke @medium @large", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/the-memes", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
  });

  test("should load with correct title and heading", async ({
    page,
  }, testInfo) => {
    await expect(page).toHaveTitle("The Memes | Collections");
    await expectNoHorizontalOverflow(page);

    if (isMobileSurfaceProject(testInfo.project.name)) {
      await expect(
        page.getByRole("button", { name: "Collection: The Memes" })
      ).toBeVisible();
      return;
    }

    await expect(page.locator("h1", { hasText: "The Memes" })).toBeVisible();
  });

  test("sort options keep pills on mobile and native apps and use underlines on desktop web", async ({
    page,
  }, testInfo) => {
    const age = page.getByRole("button", { name: "Sort by Age", exact: true });
    const edition = page.getByRole("button", {
      name: "Sort by Edition Size",
      exact: true,
    });
    const volume = page.getByRole("button", {
      name: "Volume: All Time",
      exact: true,
    });
    // The initial URL normalization completes once the season filters are ready.
    await expect(page).toHaveURL(/sort=age/);
    const isNative = isCapacitorSimulationProject(testInfo.project.name);
    if (isNative) {
      await expect(page.locator("body")).toHaveClass(/capacitor-native/);
    }

    for (const width of [390, 1023, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const editorial = width >= 1024 && !isNative;
      await expect(age).toHaveAttribute("aria-pressed", "true");
      await expect(age).toHaveCSS(
        "background-color",
        editorial ? "rgba(0, 0, 0, 0)" : "rgb(236, 236, 238)"
      );
      await expect(age).toHaveCSS(
        "color",
        editorial ? "rgb(255, 255, 255)" : "rgb(19, 19, 22)"
      );
      await expect(edition).toHaveCSS("color", "rgb(147, 147, 159)");
      await expect(volume).toHaveCSS("color", "rgb(147, 147, 159)");
      await expect(volume).toHaveCSS(
        "background-color",
        editorial ? "rgba(0, 0, 0, 0)" : "rgb(28, 28, 33)"
      );
      await expect(edition).toHaveCSS(
        "background-color",
        editorial ? "rgba(0, 0, 0, 0)" : "rgb(28, 28, 33)"
      );
      await expect
        .poll(() =>
          age.evaluate(
            (element) => getComputedStyle(element, "::after").backgroundColor
          )
        )
        .toBe(editorial ? "rgb(82, 139, 255)" : "rgba(0, 0, 0, 0)");
      if (editorial) {
        expect(
          await age.evaluate((element) => ({
            color: getComputedStyle(element, "::after").backgroundColor,
            height: getComputedStyle(element, "::after").height,
          }))
        ).toEqual({ color: "rgb(82, 139, 255)", height: "1px" });
      }
      await expectNoHorizontalOverflow(page);
    }

    await edition.press("Enter");
    await expect(edition).toHaveAttribute("aria-pressed", "true");
    await expect(age).toHaveAttribute("aria-pressed", "false");
    await expect(page).toHaveURL(/sort=edition_size/);
    await expect(edition).toBeFocused();

    // TEMP diagnostics for the Playwright 1.64.1 RSC hang; reverted before merge.
    const diagStart = Date.now();
    const diagLog: string[] = [];
    const diagNote = (line: string) =>
      diagLog.push(`${Date.now() - diagStart}ms ${line}`);
    let diagVolumeRequest: import("@playwright/test").Request | undefined;
    page.on("request", (request) => {
      if (!request.url().includes("_rsc=")) return;
      if (request.url().includes("volume_days_7")) diagVolumeRequest = request;
      diagNote(`request ${request.url()}`);
    });
    page.on("response", (response) => {
      if (response.url().includes("_rsc="))
        diagNote(`response ${response.status()} ${response.url()}`);
    });
    page.on("requestfinished", (request) => {
      if (request.url().includes("_rsc="))
        diagNote(`finished ${request.url()}`);
    });
    page.on("requestfailed", (request) => {
      if (request.url().includes("_rsc="))
        diagNote(`failed ${request.failure()?.errorText} ${request.url()}`);
    });
    page.on("websocket", (socket) => {
      diagNote(`ws open ${socket.url()}`);
      socket.on("close", () => diagNote(`ws close ${socket.url()}`));
    });
    page.on("console", (message) =>
      diagNote(`console ${message.type()} ${message.text().slice(0, 200)}`)
    );
    page.on("pageerror", (error) =>
      diagNote(`pageerror ${error.message.slice(0, 200)}`)
    );

    await volume.press("Enter");
    await page.getByRole("menuitem", { name: "7 Days", exact: true }).click();
    const selectedVolume = page.getByRole("button", {
      name: "Volume: 7 Days",
      exact: true,
    });
    try {
      await expect(page).toHaveURL(/sort=volume_days_7/);
    } catch (error) {
      if (diagVolumeRequest) {
        const headers = await diagVolumeRequest.allHeaders();
        const nodeStart = Date.now();
        const nodeResult = await page.request
          .get(diagVolumeRequest.url(), { headers, timeout: 20_000 })
          .then(
            async (response) =>
              `${response.status()} ${(await response.body()).length}B`,
            (nodeError: Error) => `ERR ${nodeError.message.slice(0, 160)}`
          );
        diagNote(`node replay ${nodeResult} in ${Date.now() - nodeStart}ms`);
        const pageResult = await page
          .evaluate(
            async ({ url, requestHeaders }) => {
              const started = performance.now();
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 20_000);
              try {
                const response = await fetch(url, {
                  headers: requestHeaders,
                  signal: controller.signal,
                });
                const body = await response.text();
                return `${response.status} ${body.length}B in ${Math.round(performance.now() - started)}ms`;
              } catch (fetchError) {
                return `ERR ${String(fetchError).slice(0, 160)} after ${Math.round(performance.now() - started)}ms`;
              } finally {
                clearTimeout(timer);
              }
            },
            {
              url: diagVolumeRequest.url(),
              requestHeaders: Object.fromEntries(
                Object.entries(headers).filter(
                  ([name]) => !name.startsWith(":") && name !== "cookie"
                )
              ),
            }
          )
          .catch(
            (evalError: Error) => `ERR ${evalError.message.slice(0, 160)}`
          );
        diagNote(`page replay ${pageResult}`);
      } else {
        diagNote("no volume RSC request observed");
      }
      console.log(`[rsc-diagnostics]\n${diagLog.join("\n")}`);
      throw error;
    }
    await expect(selectedVolume).toHaveAttribute("aria-pressed", "true");
    await expect(selectedVolume).toHaveAttribute("aria-expanded", "false");
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const editorial = width >= 1024 && !isNative;
      await expect(selectedVolume).toHaveCSS(
        "background-color",
        editorial ? "rgba(0, 0, 0, 0)" : "rgb(236, 236, 238)"
      );
      await expect
        .poll(() =>
          selectedVolume.evaluate(
            (element) => getComputedStyle(element, "::after").backgroundColor
          )
        )
        .toBe(editorial ? "rgb(82, 139, 255)" : "rgba(0, 0, 0, 0)");
    }
  });

  test("phone cards stay square and sorting stays reachable while browsing", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isMobileSurfaceProject(testInfo.project.name),
      "Phone layout contract"
    );
    const firstCard = page
      .getByRole("link", { name: /View .+, card #/ })
      .first();
    await expect(firstCard).toBeVisible();
    const frame = page
      .getByRole("link", { name: /View .+, card #/ })
      .first()
      .locator(":scope > div")
      .first();
    await expect
      .poll(async () => {
        const box = await frame.boundingBox();
        return box ? Math.abs(box.width - box.height) : Infinity;
      })
      .toBeLessThan(1);

    await page.evaluate(() => globalThis.scrollTo(0, 600));
    const sortBar = page.getByRole("region", { name: "Meme sorting" });
    await expect.poll(async () => (await sortBar.boundingBox())?.y).toBe(0);
    await expectNoHorizontalOverflow(page);

    // Selecting an offscreen option must bring it into the horizontal strip.
    const volume = page.getByRole("button", {
      name: "Volume: All Time",
      exact: true,
    });
    await volume.click();
    await page.getByRole("menuitem", { name: "7 Days", exact: true }).click();
    await expect(page).toHaveURL(/sort=volume_days_7/);
    await expect(
      page.getByRole("button", { name: "Volume: 7 Days", exact: true })
    ).toBeInViewport();

    const portraitViewport = page.viewportSize();
    if (!portraitViewport)
      throw new Error("Expected a configured phone viewport");
    for (const width of [640, 844, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 390 });
      await expect(sortBar).toHaveCSS("position", "static");
      await expect
        .poll(async () => {
          const direction = await page
            .getByRole("button", { name: "Sort ascending", exact: true })
            .boundingBox();
          const selectedSort = await page
            .getByRole("button", { name: "Volume: 7 Days", exact: true })
            .boundingBox();
          return direction && selectedSort
            ? Math.abs(
                direction.y +
                  direction.height / 2 -
                  (selectedSort.y + selectedSort.height / 2)
              )
            : Infinity;
        })
        .toBeLessThan(1);
      await expectNoHorizontalOverflow(page);
    }
    await page.setViewportSize(portraitViewport);
    await expect(
      page.getByRole("button", { name: "Volume: 7 Days", exact: true })
    ).toBeInViewport({ ratio: 1 });
  });

  test("desktop sort fades follow horizontal overflow", async ({
    page,
  }, testInfo) => {
    test.skip(
      isMobileSurfaceProject(testInfo.project.name),
      "Desktop scroll-driven fade contract"
    );
    const row = page
      .getByRole("button", { name: "Sort by Age", exact: true })
      .locator("..");
    const supportsScrollTimeline = await page.evaluate(() =>
      CSS.supports("animation-timeline", "scroll(self inline)")
    );
    const overflow = () =>
      row.evaluate((element) => element.scrollWidth - element.clientWidth);

    // Wait for URL normalization and fonts before testing manual scrolling.
    await expect(page).toHaveURL(/sort=age&sort_dir=asc/);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.setViewportSize({ width: 820, height: 900 });
    // Let resize observers finish keeping the selected option in view first.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
    await expect.poll(overflow).toBeGreaterThan(0);
    await expect(row).toHaveCSS("--fade-l", "0px");
    await expect(row).toHaveCSS(
      "--fade-r",
      supportsScrollTimeline ? "32px" : "0px"
    );

    await row.evaluate((element) => element.scrollTo(element.scrollWidth, 0));
    await expect
      .poll(() => row.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        row.evaluate((element) => {
          const style = getComputedStyle(element);
          return ["--fade-l", "--fade-r"].map((property) =>
            Math.round(Number.parseFloat(style.getPropertyValue(property)))
          );
        })
      )
      .toEqual([supportsScrollTimeline ? 32 : 0, 0]);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(overflow).toBe(0);
    await expect(row).toHaveCSS("--fade-l", "0px");
    await expect(row).toHaveCSS("--fade-r", "0px");
    await expectNoHorizontalOverflow(page);
  });

  test("phone collection filters use sheets and restore trigger focus", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isMobileSurfaceProject(testInfo.project.name),
      "Phone sheet contract"
    );
    await expect(page).toHaveURL(/sort=age&sort_dir=asc/);
    for (const [triggerName, title] of [
      ["Collection: The Memes", "Collection"],
      ["Year: All Years", "Year"],
      ["Season: All Seasons", "Season"],
      ["Volume: All Time", "Volume"],
    ] as const) {
      const trigger = page.getByRole("button", {
        name: triggerName,
        exact: true,
      });
      await trigger.click();
      const heading = page.getByRole("heading", { name: title, exact: true });
      await expect(heading).toBeVisible();
      const close = page.getByRole("button", {
        name: "Close panel",
        exact: true,
      });
      await expect(close).toBeVisible();
      // Measure both elements in one frame while the sheet is entering.
      await expect
        .poll(() =>
          heading.evaluate((element) => {
            const closeButton = element
              .closest('[role="dialog"]')
              ?.querySelector('[aria-label="Close panel"]');
            return closeButton
              ? Math.abs(
                  element.getBoundingClientRect().y -
                    closeButton.getBoundingClientRect().y
                )
              : Infinity;
          })
        )
        .toBeLessThan(24);
      await expect(
        page.getByRole("dialog").locator("[data-enter]")
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(heading).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test("phone collection titles keep consistent type and collection-link spacing", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isMobileSurfaceProject(testInfo.project.name),
      "Phone collection header contract"
    );
    const measureHeader = async () => {
      const title = page.getByRole("button", { name: /^Collection:/ });
      await expect(title).toBeVisible();
      return title.evaluate((element) => {
        const link = element
          .closest("header")
          ?.querySelector('a[href^="/collect"]');
        const titleBox = element.getBoundingClientRect();
        const linkBox = link?.getBoundingClientRect();
        return {
          fontSize: getComputedStyle(element).fontSize,
          gap: linkBox ? linkBox.y - titleBox.bottom : null,
          leftOffset: linkBox ? linkBox.x - titleBox.x : null,
        };
      });
    };
    await expect(page).toHaveURL(/sort=age&sort_dir=asc/);
    const memesHeader = await measureHeader();
    const phoneViewport = page.viewportSize();
    if (!phoneViewport) throw new Error("Expected a configured phone viewport");
    const lfg = page.getByRole("button", { name: "LFG: Start the Show!" });
    const measureLfgGap = () =>
      lfg.evaluate((element) => {
        const link = element
          .closest("header")
          ?.querySelector('a[href^="/collect"]');
        return link
          ? element.getBoundingClientRect().y -
              link.getBoundingClientRect().bottom
          : Infinity;
      });
    await page.setViewportSize({ ...phoneViewport, width: 320 });
    await expect.poll(measureLfgGap).toBeGreaterThanOrEqual(0);
    await expect.poll(measureLfgGap).toBeLessThanOrEqual(8);
    await expectNoHorizontalOverflow(page);
    await page.setViewportSize(phoneViewport);
    await expect.poll(measureLfgGap).toBeLessThan(0);
    await page.getByRole("button", { name: "Collection: The Memes" }).click();
    await page
      .getByRole("menuitem", { name: "6529 Gradient", exact: true })
      .click();
    await expect(page).toHaveURL(/\/6529-gradient/);
    await waitForRouteReady(page);
    expect(await measureHeader()).toEqual(memesHeader);
    expect(memesHeader).toEqual({ fontSize: "20px", gap: 0, leftOffset: 0 });
    await expectNoHorizontalOverflow(page);
  });
});
