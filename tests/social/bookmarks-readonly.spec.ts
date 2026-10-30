import { expect, test } from "../testHelpers";

test("bookmarks page keeps saved messages behind authentication @smoke", async ({
  page,
}) => {
  await page.goto("/bookmarks");
  await expect(
    page.getByRole("heading", { name: "Bookmarks", exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Only you can see your bookmarks.")
  ).toBeVisible();
  await expect(
    page.getByText("Connect your profile to view your bookmarks.")
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open in conversation" })
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});
