import { writeFile } from "node:fs/promises";
import os from "node:os";
import { expect, test } from "../testHelpers";
import { useLocalSandboxMutationGuard } from "../support/localSandbox";
import {
  installWaveListScrollFixture,
  sidebarScrollMetrics,
} from "../support/waveListScroll";

// Preserve the native scrollbar in browser automation, including screenshots.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });
useLocalSandboxMutationGuard(
  test,
  "PLAYWRIGHT_AUTH_SANDBOX",
  "Requires the local sandbox."
);
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

for (const collection of ["All", "Pinned", "Joined"]) {
  test(`Windows scrollbar is visible, dark and usable in ${collection}`, async ({
    page,
    baseURL,
    browser,
    headless,
  }, testInfo) => {
    expect(process.platform).toBe("win32");
    await installWaveListScrollFixture(page, baseURL);
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
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
    await page.mouse.move(1100, 20);
    const initial = await sidebarScrollMetrics(list);
    const evidence = {
      platform: process.platform,
      release: os.release(),
      osVersion: os.version(),
      browserVersion: browser.version(),
      channel: testInfo.project.use.channel,
      colorScheme: testInfo.project.use.colorScheme,
      headless,
      initialScrollbar: initial,
    };
    const evidencePath = testInfo.outputPath("windows-browser-evidence.json");
    await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
    await testInfo.attach("windows-browser-evidence", {
      path: evidencePath,
      contentType: "application/json",
    });
    await page.screenshot({
      path: testInfo.outputPath("scrollbar-before-scrolling.png"),
    });
    expect(initial.top).toBe(0);
    expect(initial.width).toBe("thin");
    expect(initial.gutter).toBeGreaterThan(0);
    expect(initial.color).toBe("rgb(132, 132, 144) rgb(38, 39, 43)");

    const scale = initial.height / initial.scrollHeight;
    const thumbY = initial.viewportTop + (initial.height / 2) * scale;
    await page.mouse.move(initial.right - 3, thumbY);
    await page.mouse.down();
    await page.mouse.move(initial.right - 3, thumbY + 1000 * scale, {
      steps: 8,
    });
    await page.mouse.up();
    await expect
      .poll(async () => (await sidebarScrollMetrics(list)).top)
      .toBeGreaterThan(initial.top + 500);
    const dragged = await sidebarScrollMetrics(list);
    await page.mouse.click(
      dragged.right - 3,
      dragged.viewportTop + dragged.height - 20
    );
    await expect
      .poll(async () => (await sidebarScrollMetrics(list)).top)
      .toBeGreaterThan(dragged.top);
    await page.mouse.move(1100, 20);
    await page.screenshot({
      path: testInfo.outputPath("scrollbar-after-drag-and-track-click.png"),
    });
  });
}
