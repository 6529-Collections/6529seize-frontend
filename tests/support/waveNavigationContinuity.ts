import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  getActiveWaveIdFromUrl,
  getWavePathRoute,
} from "../../helpers/navigation.helpers";

// Capture the interactive pane after hydration. The search control then switches
// between a button and input without changing the sidebar's identity.
export async function retainDesktopWaveSidebar(page: Page) {
  const control = page
    .getByRole("button", { name: "Find a wave…", exact: true })
    .or(page.getByRole("searchbox", { name: "Find a wave…", exact: true }))
    .filter({ visible: true });
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  const paneAncestor =
    "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' tw-h-full ') and contains(concat(' ', normalize-space(@class), ' '), ' tw-border-r ')][1]";
  const buttonPane = page
    .getByRole("button", { name: "Find a wave…", exact: true })
    .filter({ visible: true })
    .locator(paneAncestor);
  const inputPane = page
    .getByRole("searchbox", { name: "Find a wave…", exact: true })
    .filter({ visible: true })
    .locator(paneAncestor);
  const pane = buttonPane.or(inputPane);
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
  const targetUrl = new URL(wavePath, page.url());
  const targetWaveId = getActiveWaveIdFromUrl({
    pathname: targetUrl.pathname,
    searchParams: targetUrl.searchParams,
  });
  if (!targetWaveId)
    throw new Error(`Expected a wave destination, received ${wavePath}`);
  const monitor = await page.evaluateHandle(
    ({ targetPath, targetTitle, targetWaveId }) => {
      // Accessible names collapse whitespace; API names can have trailing spaces.
      const normalizeName = (value: string | null | undefined) =>
        (value ?? "")
          .replace(/[\u200b\u00ad]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      const expectedTitle = normalizeName(targetTitle);
      const isVisible = (element: Element) => {
        const style = getComputedStyle(element);
        return (
          element.getClientRects().length > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      };
      let frames = 0;
      let targetHeaderSeen = false;
      const unexpectedViews = new Set<string>();
      let frameId = 0;
      const sample = () => {
        const targetMounted = Array.from(
          document.querySelectorAll("h1, button[aria-label]")
        ).some(
          (heading) =>
            (normalizeName(heading.textContent) === expectedTitle ||
              normalizeName(heading.getAttribute("aria-label")) ===
                `About ${expectedTitle}`) &&
            isVisible(heading)
        );
        targetHeaderSeen ||= targetMounted;
        if (
          location.pathname === targetPath ||
          location.pathname.startsWith(`${targetPath}/competitions`) ||
          (location.pathname === "/waves" &&
            new URLSearchParams(location.search).get("wave") === targetWaveId)
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
      const read = () => ({
        frames,
        unexpectedViews: Array.from(unexpectedViews),
        targetHeaderSeen,
        pathname: location.pathname,
        queryWaveId: new URLSearchParams(location.search).get("wave"),
      });
      return {
        read,
        stop: () => {
          cancelAnimationFrame(frameId);
          return read();
        },
      };
    },
    {
      targetPath: getWavePathRoute(targetWaveId),
      targetTitle: waveTitle,
      targetWaveId,
    }
  );
  return async () => {
    let result = await monitor.evaluate((state) => state.read());
    try {
      // AppHeader can follow the ready content during a native view transition.
      // Keep sampling early wrong views until a target header frame is observed;
      // use the ordinary expect deadline rather than a longer journey timeout.
      await expect
        .poll(() => monitor.evaluate((state) => state.read()), {
          message: "Expected to observe the returned wave rendering",
        })
        .not.toMatchObject({ frames: 0 });
    } finally {
      try {
        result = await monitor.evaluate((state) => state.stop());
      } finally {
        await monitor.dispose();
      }
    }
    expect(
      result.frames,
      `Expected to observe the returned wave rendering: ${JSON.stringify(result)}`
    ).toBeGreaterThan(0);
    expect(
      result.unexpectedViews,
      "The remembered Leaderboard must open without a visible Chat or Competitions detour"
    ).toEqual([]);
  };
}
