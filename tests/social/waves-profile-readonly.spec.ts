import type { Page } from "@playwright/test";

import { expect, test } from "../testHelpers";
import {
  expectProfileShell,
  expectProfileTabLinks,
  gotoReady,
  PROFILE_HANDLE,
} from "./profileReadonlyHelpers";

const PROFILE_TAB_PATHS = [
  {
    path: `/${PROFILE_HANDLE}/curations`,
    title: /curations|waves|punk6529/i,
    activeTab: "Curation",
  },
  {
    path: `/${PROFILE_HANDLE}/collected`,
    title: /collected|punk6529/i,
    activeTab: "Collected",
  },
  {
    path: `/${PROFILE_HANDLE}/xtdh`,
    title: /xtdh|punk6529/i,
    activeTab: /xTDH/,
  },
];

async function getFirstWaveId(page: Page) {
  await gotoReady(page, "/waves");

  const waveList = page.getByRole("region", {
    name: /All recent waves list|Regular waves list/,
  });
  await expect(waveList).toBeVisible({ timeout: 15000 });
  const firstWaveLink = waveList.locator('a[href^="/waves/"]').first();
  await expect(firstWaveLink).toBeVisible({ timeout: 15000 });
  const href = await firstWaveLink.getAttribute("href");
  const pathname = href ? new URL(href, page.url()).pathname : "";
  const match = pathname.match(/^\/waves\/([^/]+)$/);

  expect(
    match,
    `Expected first wave href to use /waves/{id}; got ${href}`
  ).not.toBeNull();
  return match?.[1] ?? "";
}

test.describe("Waves and profile read-only coverage @surface @medium @large @readonly", () => {
  test("renders the public Waves landing without write interaction", async ({
    page,
  }) => {
    await gotoReady(page, "/waves");

    await expect(page).toHaveURL((url) => url.pathname === "/waves");
    await expect(page).toHaveTitle(/Waves/i);

    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await expect(
        page.locator("main").getByText("Waves").first()
      ).toBeVisible();
      await expect(
        page.getByRole("region", {
          name: /All recent waves list|Regular waves list/,
        })
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Latest From Profile Waves",
        })
      ).toBeVisible();
      await expect(
        page.getByText(
          "Drops 6529 users are featuring from their own profile waves."
        )
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Profile Waves Feed" })
      ).toHaveAttribute("href", "/waves");
    }
  });

  test("handles legacy wave query links without mutation", async ({ page }) => {
    const waveId = await getFirstWaveId(page);

    await gotoReady(page, `/waves?wave=${waveId}&serialNo=1`);

    const url = new URL(page.url());
    if (url.pathname === "/waves") {
      await expect(url.searchParams.get("wave")).toBe(waveId);
    } else {
      await expect(url.pathname).toBe(`/waves/${waveId}`);
      const serialNo = url.searchParams.get("serialNo");
      if (serialNo !== null) {
        await expect(serialNo).toBe("1");
      }
    }
  });

  test("renders the stable public profile shell read-only", async ({
    page,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}`);

    await expect(page).toHaveURL(
      (url) => url.pathname === `/${PROFILE_HANDLE}`
    );
    await expect(page).toHaveTitle(new RegExp(PROFILE_HANDLE, "i"));
    await expectProfileShell(page);
    await expectProfileTabLinks(page);
  });

  for (const tab of PROFILE_TAB_PATHS) {
    test(`renders ${tab.path} read-only`, async ({ page }) => {
      await gotoReady(page, tab.path);

      await expect(page).toHaveURL((url) => url.pathname === tab.path);
      await expect(page).toHaveTitle(tab.title);
      await expectProfileShell(page, tab.activeTab);
      await expectProfileTabLinks(page);
    });
  }
});
