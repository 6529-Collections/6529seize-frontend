import { expect, test } from "../testHelpers";
import { gotoReady } from "../support/routeReadiness";

test("Desktop version text aligns with the title-strip controls", async ({
  page,
}) => {
  await gotoReady(page, "/about");
  const toolbar = page.getByRole("toolbar", {
    name: "6529 Desktop window title",
  });

  for (const height of [28, 34]) {
    await page.evaluate((stripHeight) => {
      const root = document.documentElement;
      root.setAttribute("data-desktop-titlebar", "overlay");
      root.style.setProperty("--desktop-titlebar-height", `${stripHeight}px`);
      root.style.setProperty("--desktop-app-version", '"0.1.0-rc.2"');
    }, height);

    await expect(toolbar).toBeVisible();
    const geometry = await toolbar.evaluate((strip) => {
      const version = strip.lastElementChild;
      const button = strip.querySelector("button");
      if (!version || !button)
        throw new Error("Title-strip content is missing");
      const text = version.getBoundingClientRect();
      const control = button.getBoundingClientRect();
      return {
        textHeight: text.height,
        centerDifference: Math.abs(
          text.y + text.height / 2 - control.y - control.height / 2
        ),
      };
    });

    expect(geometry.textHeight).toBeGreaterThan(0);
    expect(geometry.centerDifference).toBeLessThanOrEqual(0.5);
  }
});
