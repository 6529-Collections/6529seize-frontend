import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// The sidebar's list/search children can change while its scroll pane stays
// mounted. Retain the pane itself to catch a route replacing the wave shell.
export async function retainDesktopWaveSidebar(page: Page) {
  const pane = page
    .getByRole("region", {
      name: /All recent waves list|Regular waves list|Search results · All waves/,
    })
    .filter({ visible: true })
    .locator(
      "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' tw-h-full ') and contains(concat(' ', normalize-space(@class), ' '), ' tw-border-r ')][1]"
    );
  await expect(pane).toBeVisible();
  const retainedPane = await pane.elementHandle();
  expect(retainedPane).not.toBeNull();
  return {
    expectRetained: async () => {
      expect(
        await retainedPane!.evaluate((element) => element.isConnected),
        "The desktop wave sidebar must keep the same DOM node across wave navigation"
      ).toBe(true);
      await expect(pane).toBeVisible();
      expect(
        await pane.evaluate(
          (element, retained) => element === retained,
          retainedPane
        ),
        "The currently visible sidebar must be the original wave pane"
      ).toBe(true);
    },
    dispose: () => retainedPane!.dispose(),
  };
}

// Sample animation frames throughout the return journey, including the first
// target-wave frame. Endpoint assertions alone miss a painted Chat/Competitions
// redirect before the remembered Leaderboard becomes visible.
export async function monitorRememberedLeaderboard(
  page: Page,
  wavePath: string,
  waveTitle: string
) {
  const monitor = await page.evaluateHandle(
    ({ targetPath, targetTitle }) => {
      const isVisible = (element: Element) => {
        const style = getComputedStyle(element);
        return (
          element.getClientRects().length > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      };
      let frames = 0;
      const unexpectedViews = new Set<string>();
      let frameId = 0;
      const sample = () => {
        const targetMounted = Array.from(
          document.querySelectorAll("h1, button[aria-label]")
        ).some(
          (heading) =>
            (heading.textContent?.trim() === targetTitle ||
              heading.getAttribute("aria-label") === `About ${targetTitle}`) &&
            isVisible(heading)
        );
        if (
          location.pathname === targetPath ||
          location.pathname.startsWith(`${targetPath}/competitions`)
        ) {
          if (targetMounted) frames += 1;
          for (const section of document.querySelectorAll(
            '[role="tab"][aria-selected="true"], nav[aria-label="Wave sections"] button[aria-current="true"]'
          )) {
            const label = section.textContent?.trim() ?? "";
            if (
              isVisible(section) &&
              /^(Chat|Competitions)(?:\s|$)/.test(label)
            ) {
              unexpectedViews.add(label);
            }
          }
          const chat = document.querySelector(
            '[role="region"][aria-label="Wave chat file upload area"]'
          );
          if (chat && isVisible(chat)) unexpectedViews.add("Wave chat content");
        }
        frameId = requestAnimationFrame(sample);
      };
      frameId = requestAnimationFrame(sample);
      return {
        getFrameCount: () => frames,
        stop: () => {
          cancelAnimationFrame(frameId);
          return { frames, unexpectedViews: Array.from(unexpectedViews) };
        },
      };
    },
    { targetPath: wavePath, targetTitle: waveTitle }
  );
  return async () => {
    // Content can become ready before the app header and its next painted frame.
    // Keep sampling until the target wave is observed, including any detour.
    await expect
      .poll(() => monitor.evaluate((state) => state.getFrameCount()), {
        message: "Expected to observe the returned wave rendering",
        timeout: 30000,
      })
      .toBeGreaterThan(0);
    const result = await monitor.evaluate(async (state) => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
      return state.stop();
    });
    await monitor.dispose();
    expect(
      result.frames,
      "Expected to observe the returned wave rendering"
    ).toBeGreaterThan(0);
    expect(
      result.unexpectedViews,
      "The remembered Leaderboard must open without a visible Chat or Competitions detour"
    ).toEqual([]);
  };
}
