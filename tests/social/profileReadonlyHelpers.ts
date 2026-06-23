import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

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
  await expect(
    profileSections.getByRole("link", { name: /xTDH/ })
  ).toHaveAttribute("href", `/${PROFILE_HANDLE}/xtdh`);
}
