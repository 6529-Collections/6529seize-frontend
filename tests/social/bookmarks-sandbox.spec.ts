import { expect, test } from "@playwright/test";

test("private bookmarks survive proxy changes and isolate account switches @local-only", async ({
  page,
  baseURL,
}, testInfo) => {
  expect(new URL(baseURL ?? "").hostname).toBe("127.0.0.1");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort()
  );
  await page.goto("/bookmarks");
  const menu = page.getByRole("region", { name: "Message menu" });
  const accountMenu = page.getByRole("complementary", { name: "Account menu" });
  await expect(
    accountMenu.getByRole("link", { name: "Bookmarks" })
  ).toHaveCount(0);
  await menu.getByRole("button", { name: "Bookmark", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    accountMenu.getByRole("link", { name: "Bookmarks" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open in conversation" })
  ).toHaveAttribute("href", "/waves/wave-one?serialNo=12");
  await page.getByRole("button", { name: "Toggle proxy" }).click();
  await expect(page.getByText("Proxy: active")).toBeVisible();
  await expect(
    accountMenu.getByRole("link", { name: "Bookmarks" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch account" }).click();
  await expect(page.getByText("Owner: bob")).toBeVisible();
  await expect(
    accountMenu.getByRole("link", { name: "Bookmarks" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "No bookmarks yet" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch account" }).click();
  await expect(
    page.getByRole("link", { name: "Open in conversation" })
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("bookmarks.png"),
    fullPage: true,
  });
  await page
    .getByRole("article")
    .getByRole("button", { name: "Remove bookmark" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "No bookmarks yet" })
  ).toBeVisible();
  await expect(
    accountMenu.getByRole("link", { name: "Bookmarks" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Bookmarks", exact: true })
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  expect(errors).toEqual([]);
});
