import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import { gotoReady, PROFILE_HANDLE } from "./profileReadonlyHelpers";
import {
  isCapacitorSimulationProject,
  isMobileWebProject,
} from "../support/surfaceSimulation";

const collectedPath = `/${PROFILE_HANDLE}/collected`;
const memesContract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";

test.describe("Collected browsing @surface @medium @large @readonly", () => {
  test("keeps selected filters visible, opens the existing picker and clears filters", async ({
    page,
  }, testInfo) => {
    await gotoReady(
      page,
      `${collectedPath}?collection=memes&szn=1&seized=not_seized&source=e2e`
    );
    await expect(
      page.getByRole("heading", { name: `${PROFILE_HANDLE}’s collection` })
    ).toBeVisible();
    const stats = page.getByRole("button", {
      name: "Collection stats",
      exact: true,
    });
    await expect(stats).toHaveAttribute("aria-expanded", "false");
    const filters = page.getByRole("region", { name: "Browse artwork" });
    await expect(
      filters.getByRole("button", { name: "Holdings: Not held", exact: true })
    ).toBeVisible();
    await filters
      .getByRole("button", { name: "Collection: The Memes", exact: true })
      .click();
    if (
      isMobileWebProject(testInfo.project.name) ||
      isCapacitorSimulationProject(testInfo.project.name)
    ) {
      await expect(page.getByRole("dialog")).toBeVisible();
    }
    await page.getByRole("button", { name: "Gradients", exact: true }).click();
    await expect(page).toHaveURL(/collection=gradients/);
    await expect(
      filters.getByRole("button", {
        name: "Collection: Gradients",
        exact: true,
      })
    ).toBeVisible();
    await filters.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL((url) => url.search === "?source=e2e");
    await expectNoHorizontalOverflow(page);
    await stats.click();
    await expect(
      page.getByText("For your connected wallet", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Hide collection stats" })
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("keeps Network numbers and pagination inside narrow content and preserves page history", async ({
    page,
  }) => {
    await page.route("**/api/xtdh/tokens?*", async (route) => {
      const pageNumber = Number(
        new URL(route.request().url()).searchParams.get("page") ?? 1
      );
      await route.fulfill({
        json: {
          page: pageNumber,
          next: pageNumber < 3,
          data: [
            {
              contract: memesContract,
              token: pageNumber,
              xtdh: 123456789.9,
              xtdh_rate: 9876543.2,
            },
            {
              contract: memesContract,
              token: pageNumber + 10,
              xtdh: 23456789.1,
              xtdh_rate: 8765432.1,
            },
          ],
        },
      });
    });
    await gotoReady(page, `${collectedPath}?collection=network&page=2`);
    const cards = page.getByRole("list", { name: "Collected network cards" });
    await expect(cards.getByRole("listitem")).toHaveCount(2);
    await expect(
      cards.getByText("123,456,789.9", { exact: true })
    ).toBeVisible();
    const next = page.getByRole("button", { name: "Next", exact: true });
    await next.scrollIntoViewIfNeeded();
    const listBox = await cards.boundingBox();
    const nextBox = await next.boundingBox();
    expect(nextBox!.y).toBeGreaterThanOrEqual(listBox!.y + listBox!.height);
    expect(nextBox!.height).toBeGreaterThanOrEqual(44);
    for (const node of await cards.locator("dd").all()) {
      expect(
        await node.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1
        )
      ).toBe(true);
    }
    await expectNoHorizontalOverflow(page);
    await next.click();
    await expect(page).toHaveURL(/page=3/);
    await page.goBack();
    await expect(page).toHaveURL(/page=2/);
    await expect(cards.getByRole("listitem")).toHaveCount(2);
  });

  test("distinguishes failed requests from empty results and keeps recovery controls", async ({
    page,
  }) => {
    let failing = true;
    await page.route("**/api/xtdh/tokens?*", (route) =>
      route.fulfill(
        failing
          ? {
              status: 503,
              json: { message: "Collection temporarily unavailable" },
            }
          : { json: { page: 1, next: false, data: [] } }
      )
    );
    await gotoReady(page, `${collectedPath}?collection=network`);
    await expect(page.getByRole("alert")).toContainText(
      "Artwork could not be loaded",
      { timeout: 20000 }
    );
    await expect(
      page.getByRole("button", { name: "Clear filters" })
    ).toBeVisible();
    failing = false;
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "No network tokens found" })
    ).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("returns to the selected artwork with collection filters intact", async ({
    page,
  }, testInfo) => {
    await gotoReady(page, `${collectedPath}?collection=memes&szn=1`);
    const cards = page.getByRole("list", {
      name: "Collected cards",
      exact: true,
    });
    const card = cards.getByRole("listitem").nth(3);
    await card.scrollIntoViewIfNeeded();
    const cardId = await card.getAttribute("id");
    const link = card.getByRole("link");
    await link.click();
    await expect(page).toHaveURL(/\/the-memes\/\d+\?returnTo=/);
    if (isCapacitorSimulationProject(testInfo.project.name)) {
      await page.getByRole("button", { name: "Back", exact: true }).click();
    } else if (isMobileWebProject(testInfo.project.name)) {
      await page.getByTestId("back-to-profile-collected").click();
    } else {
      await page.goBack();
    }
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === collectedPath &&
        url.searchParams.get("collection") === "memes" &&
        url.searchParams.get("szn") === "1"
    );
    const restored = page.locator(`[id="${cardId}"]`);
    await expect(restored).toBeInViewport();
    if (
      isMobileWebProject(testInfo.project.name) ||
      isCapacitorSimulationProject(testInfo.project.name)
    ) {
      await expect(restored.getByRole("link")).toBeFocused();
    }
    await page.screenshot({
      path: testInfo.outputPath("collected-return.png"),
    });
  });
});
