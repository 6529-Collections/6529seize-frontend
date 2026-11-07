import { expect, test } from "../testHelpers";
import {
  installChatPerfFixture,
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
