import { expect, test } from "../testHelpers";
import { gotoReady } from "../support/routeReadiness";
import { isCapacitorSimulationProject } from "../support/surfaceSimulation";

const PUBLIC_WAVE_PATH =
  process.env["TARGET_WAVE_PATH"] ??
  (process.env["PLAYWRIGHT_COMPOSER_SANDBOX"] === "1"
    ? "/waves/00000000-0000-4000-8000-000000000529"
    : "/waves/05b14183-e153-4e47-bc66-42a0f49102d4");

test.describe("Native iPad drop actions @surface @medium @readonly", () => {
  test.use({
    hasTouch: true,
    isMobile: false,
    viewport: { width: 1194, height: 834 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  });

  test("keeps the touch action button usable when the WebView reports desktop input", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isCapacitorSimulationProject(testInfo.project.name),
      "Native drop actions are covered only on Capacitor simulation projects"
    );

    await page.addInitScript(() => {
      globalThis.localStorage.setItem("6529-fine-pointer", "1");
    });

    await gotoReady(page, PUBLIC_WAVE_PATH);

    await expect(page.locator("body")).toHaveClass(/capacitor-native/);
    await expect(page.locator("body")).toHaveAttribute(
      "data-fine-pointer",
      "true"
    );
    await expect(page.locator("[data-wave-drop-id]").first()).toBeVisible({
      timeout: 30_000,
    });

    const actionButton = page
      .getByRole("button", { name: "Open drop actions" })
      .first();
    await expect(actionButton).toBeVisible({ timeout: 30_000 });
    await actionButton.click();

    const copyTextAction = page
      .getByRole("button", { name: /copy text/i })
      .first();
    await expect(copyTextAction).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press("Escape");
    await expect(copyTextAction).toBeHidden({ timeout: 10_000 });
  });
});
