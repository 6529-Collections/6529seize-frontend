import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { isMobileSurfaceProject } from "../support/surfaceSimulation";

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
    const frame = firstCard.locator(":scope > div").first();
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
      await expect(page.locator('[role="dialog"] [data-enter]')).toHaveCount(0);
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
