import { expect, test } from "../testHelpers";
import { expectUrlState } from "../support/urlState";
import {
  expectProfileShell,
  gotoReady,
  PROFILE_HANDLE,
} from "../social/profileReadonlyHelpers";

test("keeps the profile shell and scroll while the last tab click wins", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, `/${PROFILE_HANDLE}`);
  await expectProfileShell(page);
  const navigation = page.getByRole("navigation", {
    name: "Profile sections",
  });
  // The underline is positioned after hydration; SSR alone isn't interactive.
  await expect(
    page
      .getByRole("navigation", { name: "Profile sections" })
      .locator('span[aria-hidden="true"]')
  ).toHaveCSS("opacity", "1");
  const main = await page.getByRole("main").last().elementHandle();
  const navElement = await navigation.elementHandle();
  const content = page
    .getByRole("main")
    .last()
    .locator("[data-profile-tab-content]");
  await page.evaluate(() =>
    globalThis.scrollTo({ top: 200, behavior: "instant" })
  );
  const originalScroll = await page.evaluate(() => globalThis.scrollY);
  expect(originalScroll).toBeGreaterThan(0);

  let releaseCollected: () => void = () => undefined;
  const collectedReady = new Promise<void>((resolve) => {
    releaseCollected = resolve;
  });
  const collectedUrl = `**/${PROFILE_HANDLE}/collected?*`;
  const heldRequests: Promise<void>[] = [];
  await page.route(collectedUrl, async (route) => {
    const request = collectedReady.then(() => route.continue());
    heldRequests.push(request);
    await request;
  });
  const visited: string[] = [];
  const recordNavigation = () => visited.push(new URL(page.url()).pathname);
  page.on("framenavigated", recordNavigation);
  try {
    await navigation
      .getByRole("link", { name: "Collected", exact: true })
      .click();
    await expect(content).toHaveAttribute("aria-busy", "true");
    await expect(
      navigation.getByRole("link", { name: "Collected", exact: true })
    ).toHaveAttribute("aria-current", "page");
    expect(await page.evaluate(() => globalThis.scrollY)).toBe(originalScroll);

    const xtdh = navigation.getByRole("link", { name: /xTDH/ });
    await xtdh.click();
    await expect(xtdh).toHaveAttribute("aria-current", "page");
    await expectUrlState(
      page,
      (url) =>
        url.pathname === `/${PROFILE_HANDLE}/xtdh` &&
        url.searchParams.get("tab") === "granted"
    );
    await expect(content).toHaveAttribute("aria-busy", "false");
    expect(visited).not.toContain(`/${PROFILE_HANDLE}/collected`);
    expect(
      await page
        .getByRole("main")
        .last()
        .evaluate((current, previous) => current === previous, main)
    ).toBe(true);
    expect(
      await navigation.evaluate(
        (current, previous) => current === previous,
        navElement
      )
    ).toBe(true);
    await expect
      .poll(() =>
        page.evaluate(
          (before) =>
            Math.abs(
              globalThis.scrollY -
                Math.min(
                  before,
                  document.documentElement.scrollHeight - innerHeight
                )
            ),
          originalScroll
        )
      )
      .toBeLessThanOrEqual(2);
    if (!isMobile) await expect(xtdh).toBeFocused();
  } finally {
    releaseCollected();
    await Promise.all(heldRequests);
    page.off("framenavigated", recordNavigation);
    await page.unroute(collectedUrl);
  }
  await page.goBack();
  await expect(navigation).toBeVisible({ timeout: 15000 });
  await expectProfileShell(page);
  await expect
    .poll(() => page.evaluate(() => globalThis.scrollY))
    .toBe(originalScroll);
});
