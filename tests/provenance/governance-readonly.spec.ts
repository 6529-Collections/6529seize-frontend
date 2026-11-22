import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { expectAxeClean } from "../support/a11yAssertions";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

// The unlinked provenance governance page reads the Sepolia test registry and
// its Safe from the browser. Without a wallet it builds and decodes SafeTxs;
// signing and proposing need a wallet and are covered by Jest with mocks.
const PATH = "/provenance/governance";
const MOBILE_PROJECT = "web-mobile-chromium";

test.describe("provenance governance", () => {
  test.describe.configure({ timeout: 180_000 });

  test("reads the pinned Safe and builds a high-impact SafeTx on its own", async ({
    page,
  }, testInfo) => {
    await gotoDocumentWithTransientRetry(page, PATH);
    await waitForRouteReady(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Registry governance" })
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/u
    );
    await expect(page.getByText("Matches the pinned Safe")).toBeVisible({
      timeout: 60_000,
    });

    await page.getByLabel("Literal").fill("E2E_TYPE");
    await page.getByRole("button", { name: "Add call" }).click();
    await page.getByLabel("Call").selectOption("freeze");
    await page.getByRole("button", { name: "Add call" }).click();
    await page.getByRole("button", { name: "Build Safe transactions" }).click();

    const cards = page.getByTestId("governance-safetx");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(1).getByText("High impact")).toBeVisible();
    await expect(
      cards.nth(1).getByText(/Freezing cannot be undone/u)
    ).toBeVisible();
    await expect(cards.nth(0).getByText("registerRecordType")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Connect a wallet to sign" }).first()
    ).toBeVisible();

    await expectAxeClean(page);
    if (testInfo.project.name === MOBILE_PROJECT) {
      await expectNoHorizontalOverflow(page);
    }
  });
});
