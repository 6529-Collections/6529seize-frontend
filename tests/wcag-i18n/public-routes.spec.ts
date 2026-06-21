import { type Page } from "@playwright/test";
import {
  expect,
  expectAxeClean,
  expectKeyboardFocusVisibleWithinTabs,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
  withLocale,
} from "../testHelpers";

const THE_MEMES_ROUTE = "/the-memes";
const THE_MEMES_STRESS_ROUTE = `${withLocale(
  THE_MEMES_ROUTE,
  "fr-FR"
)}&sort=age&sort_dir=asc`;
const SORTING_REGION_NAME = "Tri des memes";
const THE_MEMES_EMPTY_STATE_PATTERN = /Aucun meme/i;

test.describe("WCAG and i18n public route evidence @wcag @i18n @medium @large", () => {
  test("The Memes route has no WCAG 2.2 A/AA axe violations @wcag @medium @large", async ({
    page,
  }) => {
    await page.goto(THE_MEMES_STRESS_ROUTE, { waitUntil: "domcontentloaded" });
    await waitForTheMemesRouteReady(page);

    await expect(page.locator("h1", { hasText: "The Memes" })).toBeVisible();
    await expectAxeClean(page, { route: THE_MEMES_STRESS_ROUTE });
  });

  test("The Memes locale stress route keeps readable layout bounds @i18n @medium @large", async ({
    page,
  }) => {
    await page.goto(THE_MEMES_STRESS_ROUTE, { waitUntil: "domcontentloaded" });
    await waitForTheMemesRouteReady(page);

    await expect(page).toHaveTitle(/The Memes/);
    await expect(
      page.getByRole("region", { name: SORTING_REGION_NAME })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const cardLinks = page.locator('main a[href*="/the-memes/"]');
    if ((await cardLinks.count()) > 0) {
      await expect(cardLinks.first()).toHaveAttribute("href", /locale=fr-FR/);
    }
  });

  test("The Memes route exposes visible keyboard focus @wcag @keyboard @medium @large", async ({
    page,
  }) => {
    await page.goto(THE_MEMES_STRESS_ROUTE, { waitUntil: "domcontentloaded" });
    await waitForTheMemesRouteReady(page);

    const focused = await expectKeyboardFocusVisibleWithinTabs(page);

    expect(focused.tagName).not.toBe("");
  });
});

async function waitForTheMemesRouteReady(page: Page) {
  await waitForRouteReady(page);
  await expect(
    page.getByRole("region", { name: SORTING_REGION_NAME })
  ).toBeVisible();
  await expect
    .poll(
      async () => {
        const hasCards =
          (await page.locator('main a[href*="/the-memes/"]').count()) > 0;
        if (hasCards) {
          return "cards";
        }

        const hasEmptyState = await page
          .getByText(THE_MEMES_EMPTY_STATE_PATTERN)
          .isVisible()
          .catch(() => false);
        if (hasEmptyState) {
          return "empty";
        }

        const statusVisible = await page
          .getByRole("status")
          .isVisible()
          .catch(() => false);
        return statusVisible ? "loading" : "waiting";
      },
      {
        message: "Expected The Memes route to settle with cards or empty state",
        timeout: 45000,
      }
    )
    .toMatch(/^(cards|empty)$/);
}
