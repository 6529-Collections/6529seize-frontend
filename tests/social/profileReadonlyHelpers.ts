import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";
import { readXtdhRetirement } from "../support/xtdhRetirement";

export const PROFILE_HANDLE = "punk6529";

export async function gotoReady(page: Page, path: string) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

function getProfileSections(page: Page) {
  return page.getByRole("navigation", {
    name: "Profile sections",
  });
}

export async function expectProfileShell(
  page: Page,
  activeTab: string | RegExp = "Identity"
) {
  const profileSections = getProfileSections(page);

  await expect(profileSections).toBeVisible();
  await expect(
    page.locator("main").getByText(PROFILE_HANDLE, { exact: true }).first()
  ).toBeVisible();
  await expect(
    profileSections.getByRole("link", { name: activeTab })
  ).toHaveAttribute("aria-current", "page");
}

export async function expectProfileTabLinks(page: Page) {
  const profileSections = getProfileSections(page);

  await expect(
    profileSections.getByRole("link", { name: "Curation" })
  ).toHaveAttribute("href", `/${PROFILE_HANDLE}/curations`);
  await expect(
    profileSections.getByRole("link", { name: "Collected" })
  ).toHaveAttribute("href", `/${PROFILE_HANDLE}/collected`);
  const xtdhTab = profileSections.getByRole("link", { name: /xTDH/ });
  if ((await readXtdhRetirement(page)) === "retired") {
    // From the identity switch-on xTDH is retired and its tab is gone.
    await expect(xtdhTab).toHaveCount(0);
  } else {
    await expect(xtdhTab).toHaveAttribute(
      "href",
      `/${PROFILE_HANDLE}/xtdh?tab=granted`
    );
  }
}

export async function expectPersonalCollectedActionsAbsent(page: Page) {
  await expect(page.getByTestId("collected-purchase-actions")).toHaveCount(0);
  for (const action of ["Manage orders", "Complete my set"]) {
    await expect(
      page.getByRole("link", { name: action, exact: true })
    ).toHaveCount(0);
  }
}
