import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

const PROFILE_HANDLE = "punk6529";

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

async function expectProfileShell(
  page: Page,
  activeTab: string | RegExp = "Identity"
) {
  const profileSections = page.getByRole("navigation", {
    name: "Profile sections",
  });

  await expect(profileSections).toBeVisible();
  await expect(
    page.locator("main").getByText(PROFILE_HANDLE, { exact: true }).first()
  ).toBeVisible();
  await expect(
    profileSections.getByRole("link", { name: activeTab })
  ).toHaveAttribute("aria-current", "page");
}

test.describe("Profile deep-link read-only coverage @surface @medium @readonly", () => {
  test("keeps public profile query links readable without mutation", async ({
    page,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}?source=e2e&view=legacy`);

    await expect(page).toHaveURL((url) => {
      return (
        url.pathname === `/${PROFILE_HANDLE}` &&
        url.searchParams.get("source") === "e2e" &&
        url.searchParams.get("view") === "legacy"
      );
    });
    await expectProfileShell(page);
  });

  test("redirects legacy waves links to the public curation/profile shell with query state intact", async ({
    page,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}/waves?source=e2e&serialNo=1`);

    await expect(page).toHaveURL((url) => {
      return (
        [`/${PROFILE_HANDLE}`, `/${PROFILE_HANDLE}/curations`].includes(
          url.pathname
        ) &&
        url.searchParams.get("source") === "e2e" &&
        url.searchParams.get("serialNo") === "1"
      );
    });

    if (new URL(page.url()).pathname.endsWith("/curations")) {
      await expectProfileShell(page, "Curation");
    } else {
      await expectProfileShell(page);
    }
  });

  for (const legacyPath of ["groups", "followers"]) {
    test(`redirects legacy ${legacyPath} links back to the public profile shell`, async ({
      page,
    }) => {
      await gotoReady(page, `/${PROFILE_HANDLE}/${legacyPath}?source=e2e`);

      await expect(page).toHaveURL((url) => {
        return (
          url.pathname === `/${PROFILE_HANDLE}` &&
          !url.searchParams.has("source")
        );
      });
      await expectProfileShell(page);
    });
  }
});
