import type { Page } from "@playwright/test";

import { expect } from "../testHelpers";
import { gotoReady, RESPONSE_TIMEOUT_MS } from "./routeReadiness";

/**
 * Whether the build under test still shows xTDH figures. xTDH is retired
 * when identities move to the 6529 Network: from the switch-on the site shows
 * no xTDH figures or controls. The freeze day before it keeps the figures,
 * so it reads as `live`.
 */
export type XtdhRetirement = "live" | "retired";

/**
 * Reads the retirement from the app itself, so specs assert both branches
 * without a copy of the freeze time: opens `/xtdh` in a second tab of the
 * same context and looks for the retirement notice. The caller's page stays
 * where it is.
 */
export async function readXtdhRetirement(page: Page): Promise<XtdhRetirement> {
  const probe = await page.context().newPage();
  try {
    await gotoReady(probe, "/xtdh");
    // The notice is the page's xTDH region; it carries data-xtdh-retirement.
    const notice = probe.getByRole("region", { name: "xTDH", exact: true });
    const figures = probe.getByRole("heading", {
      level: 1,
      name: "xTDH Network Overview",
    });
    await expect(notice.or(figures).first()).toBeVisible({
      timeout: RESPONSE_TIMEOUT_MS,
    });
    const retired =
      (await notice.isVisible()) &&
      (await notice.getAttribute("data-xtdh-retirement")) === "retired";
    return retired ? "retired" : "live";
  } finally {
    await probe.close();
  }
}
