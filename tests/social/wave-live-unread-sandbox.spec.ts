import { expect, test } from "../testHelpers";
import type { Page } from "@playwright/test";
import {
  installChatPerfFixture,
  PERF_OPEN_WAVE_INDEX,
  PERF_OTHER_WAVE_INDEX,
  perfMessageText,
  perfWaveId,
  perfWaveName,
} from "../support/chatPerfFixture";
import {
  dismissNextDevTools,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

async function setVisibility(page: Page, state: DocumentVisibilityState) {
  await page.evaluate((visibilityState) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibilityState,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}

/**
 * Live unread state in the wave list (WAVES-PLAN 0.2). Wave objects keep the
 * server's unread values; the list reads the live socket counts on top. A
 * message in another wave must still raise that row's badge and point its
 * link at the first unread message (the `divider` parameter).
 */
test.describe("Live wave unread state @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Live unread state requires the isolated local mock API."
  );

  test("keeps chat unread outside Chat without title counts or read requests", async ({
    page,
    baseURL,
  }, testInfo) => {
    const fixture = await installChatPerfFixture(page, baseURL);
    const waveId = perfWaveId(PERF_OPEN_WAVE_INDEX);
    await page.route(`**/api/v3/waves/${waveId}`, (route) =>
      route.fulfill({
        json: {
          id: waveId,
          name: perfWaveName(PERF_OPEN_WAVE_INDEX),
          legacy_primary_competition_id: null,
          permissions: {
            view: true,
            administer: true,
            create_competition: true,
          },
        },
      })
    );
    await page.route(`**/api/v3/waves/${waveId}/default-competition`, (route) =>
      route.fulfill({
        json: {
          competition_id: null,
          evaluated_at: Date.now(),
          next_refresh_at: null,
        },
      })
    );
    await page.route(`**/api/v3/waves/${waveId}/competitions?**`, (route) =>
      route.fulfill({
        json: { data: [], next_cursor: null, has_more: false },
      })
    );
    const reads: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().endsWith(`/notifications/wave/${waveId}/read`)
      ) {
        reads.push(request.url());
      }
    });
    await page.goto(`/waves/${waveId}?tab=competitions`, {
      waitUntil: "domcontentloaded",
    });
    const decisions = page
      .getByRole("tab", { name: "Decisions", exact: true })
      .filter({ visible: true });
    await expect(decisions).toHaveAttribute("aria-selected", "true", {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await fixture.waitForSockets();
    await dismissNextDevTools(page);
    const chat = page
      .getByRole("tab", { name: /^Chat\b/ })
      .filter({ visible: true });
    await page.clock.install();
    await setVisibility(page, "hidden");
    await fixture.send(PERF_OPEN_WAVE_INDEX, 3, 150);
    await expect(chat.getByLabel(/3 unread messages/)).toHaveText("3");
    await expect(page).toHaveTitle(
      `${perfWaveName(PERF_OPEN_WAVE_INDEX)} | Brain`
    );
    await setVisibility(page, "visible");
    await expect(chat.getByLabel(/3 unread messages/)).toHaveText("3");
    await fixture.send(PERF_OPEN_WAVE_INDEX, 1, 0);
    await expect(chat.getByLabel(/4 unread messages/)).toHaveText("4");
    await expect(page).toHaveTitle(
      `${perfWaveName(PERF_OPEN_WAVE_INDEX)} | Brain`
    );
    // Allow the normal debounced read window to pass; none should be queued.
    await page.clock.runFor(3500);
    expect(reads).toHaveLength(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    const screenshot = testInfo.outputPath("chat-unread-badge.png");
    await page.screenshot({ path: screenshot });
    await testInfo.attach("chat-unread-badge.png", { path: screenshot });
    await chat.click();
    await expect(
      page.getByText(perfMessageText(44), { exact: true }).last()
    ).toBeVisible();
    await expect(chat.getByLabel(/unread messages/)).toHaveCount(0);
    await expect.poll(() => reads.length).toBeGreaterThan(0);
    await setVisibility(page, "hidden");
    await fixture.send(PERF_OPEN_WAVE_INDEX, 1, 0);
    await expect(page).toHaveTitle(
      `(1 new message) ${perfWaveName(PERF_OPEN_WAVE_INDEX)} | Brain`
    );
    await setVisibility(page, "visible");
    await expect(page).toHaveTitle(
      `${perfWaveName(PERF_OPEN_WAVE_INDEX)} | Brain`
    );
    await expect(chat.getByLabel(/unread messages/)).toHaveCount(0);
  });

  test("a message in another wave raises its badge and links to the first unread", async ({
    page,
    baseURL,
  }) => {
    const fixture = await installChatPerfFixture(page, baseURL);
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    const row = page
      .getByRole("link", {
        name: perfWaveName(PERF_OTHER_WAVE_INDEX),
        exact: true,
      })
      .first();
    await expect(row).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await dismissNextDevTools(page);
    await fixture.waitForSockets();
    await expect(row).not.toHaveAttribute("href", /divider=/);

    const { firstSerialNo } = await fixture.send(PERF_OTHER_WAVE_INDEX, 3, 150);

    // The row links to the first unread message and shows the live count.
    await expect(row).toHaveAttribute(
      "href",
      new RegExp(
        `${perfWaveId(PERF_OTHER_WAVE_INDEX)}.*divider=${firstSerialNo}`
      )
    );
    await expect(
      page
        .getByTestId("sidebar-wave-avatar")
        .filter({ visible: true })
        .getByText("3", { exact: true })
        .first()
    ).toBeVisible();

    await row.click();
    await expect(page).toHaveURL(new RegExp(perfWaveId(PERF_OTHER_WAVE_INDEX)));
    await expect(
      page.getByText(perfMessageText(firstSerialNo), { exact: true }).last()
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  });
});
