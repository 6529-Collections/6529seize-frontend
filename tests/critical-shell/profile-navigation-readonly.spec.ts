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
  const outgoingHeight = await content.evaluate(
    (container) => container.firstElementChild!.getBoundingClientRect().height
  );
  // Observe the first pending frame: an eventual hidden assertion misses flashes.
  const firstPendingFrame = content.evaluate(
    (container) =>
      new Promise<{
        opacity: string;
        inert: boolean;
        height: number;
        skeletonOpacity: string;
        skeletonDelay: string;
      }>((resolve) => {
        const observer = new MutationObserver(() => {
          if (container.getAttribute("aria-busy") !== "true") return;
          observer.disconnect();
          requestAnimationFrame(() => {
            const outgoing = container.firstElementChild as HTMLElement;
            const skeleton = getComputedStyle(container.lastElementChild!);
            resolve({
              opacity: getComputedStyle(outgoing).opacity,
              inert: outgoing.inert,
              height: outgoing.getBoundingClientRect().height,
              skeletonOpacity: skeleton.opacity,
              skeletonDelay: skeleton.animationDelay,
            });
          });
        });
        observer.observe(container, {
          attributes: true,
          attributeFilter: ["aria-busy"],
        });
      })
  );
  try {
    await navigation
      .getByRole("link", { name: "Collected", exact: true })
      .click();
    expect(await firstPendingFrame).toEqual({
      opacity: "0",
      inert: true,
      height: outgoingHeight,
      skeletonOpacity: "0",
      skeletonDelay: "0.1s",
    });
    await expect(content).toHaveAttribute("aria-busy", "true");
    await expect(
      navigation.getByRole("link", { name: "Collected", exact: true })
    ).toHaveAttribute("aria-current", "page");
    expect(await page.evaluate(() => globalThis.scrollY)).toBe(originalScroll);
    // A slow navigation reveals the placeholder while the response is held.
    await expect(
      page
        .getByRole("main")
        .last()
        .locator("[data-profile-tab-content] > div")
        .last()
    ).toHaveCSS("opacity", "1");

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
    const destination = page
      .getByRole("main")
      .last()
      .locator("[data-profile-tab-content] > div")
      .first();
    await expect(destination).toHaveCSS("opacity", "1");
    await expect(destination).not.toHaveAttribute("inert");
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
