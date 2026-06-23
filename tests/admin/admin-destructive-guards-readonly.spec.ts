import type { Locator, Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  gotoDocumentWithTransientRetry,
  gotoReadyWithApiResponse,
} from "../support/routeReadiness";

const NEXTGEN_ADMIN_ACTIONS: readonly (string | RegExp)[] = [
  "Create Collection",
  "Airdrop Tokens",
  "Update Images and Attributes",
  "Set Final Supply",
  "Initialize Burn",
  "Initialize External Burn/Swap",
  "Mint & Auction",
  "Set Splits",
  "Propose Primary Addresses and Percentages",
  "Propose Secondary Addresses and Percentages",
  "Accept Addresses and Percentages",
  "Pay Artist",
  "Global Admins",
  "Function Admins",
  "Collection Admins",
  "Add Randomizer",
  "Set Data",
  "Set Costs",
  "Upload Allowlist",
  "Set Phases",
  "Update Info",
  "Update Base URI",
  "Update Script By Index",
  "Change Metadata View",
  "Sign Collection",
];

const DROP_FORGE_WRITE_ACTIONS: readonly (string | RegExp)[] = [
  /^Back to Drop Forge$/,
  /^View Claim/,
  /^Complete$/,
  /^Completed$/,
  /^Review$/,
  /^Publish$/,
  /^Save$/,
  /^Refresh$/,
  /^Transaction$/,
  /^Run Transaction$/,
  /^Update$/,
];

async function gotoReady(page: Page, path: string) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page, { readySelector: "main" });
  await expectNoHorizontalOverflow(page);
}

async function expectNoMainButtons(
  page: Page,
  labels: readonly (string | RegExp)[]
) {
  const main = page.locator("main");
  for (const label of labels) {
    await expect(main.getByRole("button", { name: label })).toHaveCount(0);
  }
}

async function expectNoMainLinks(
  page: Page,
  labels: readonly (string | RegExp)[]
) {
  const main = page.locator("main");
  for (const label of labels) {
    await expect(main.getByRole("link", { name: label })).toHaveCount(0);
  }
}

async function expectAnyVisible(
  candidates: readonly Locator[],
  description: string
) {
  for (const candidate of candidates) {
    if (
      await candidate
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false)
    ) {
      return;
    }
  }

  expect(false, `Expected one visible ${description}`).toBe(true);
}

async function expectDropForgeDenied(
  page: Page,
  route: { path: string; heading: string }
) {
  await gotoReady(page, route.path);

  await expect(page).toHaveURL((url) => url.pathname === route.path);
  await expect(
    page.getByRole("heading", { level: 1, name: route.heading })
  ).toBeVisible();
  await expect(page.getByText("You have no power here")).toBeVisible({
    timeout: 8000,
  });
  await expectNoMainButtons(page, DROP_FORGE_WRITE_ACTIONS);
  await expectNoMainLinks(page, [
    /^Craft Claims$/,
    /^Launch Claims$/,
    ...DROP_FORGE_WRITE_ACTIONS,
  ]);
}

async function gotoGroupsReady(page: Page) {
  const response = await gotoReadyWithApiResponse(
    page,
    "/network/groups",
    (url) => url.pathname === "/api/groups"
  );
  const groups = (await response.json()) as unknown;
  expect(Array.isArray(groups)).toBe(true);

  if (Array.isArray(groups) && groups.length > 0) {
    await expect(
      page
        .locator("main")
        .getByRole("button", { name: /^Open / })
        .first()
    ).toBeVisible({ timeout: 30000 });
  }

  await expectNoHorizontalOverflow(page);
}

test.describe("Admin and destructive route guards @surface @medium @large @readonly", () => {
  test("keeps the NextGen manager fail-closed without admin authority", async ({
    page,
  }) => {
    await gotoReady(page, "/nextgen/manager");

    await expect(page).toHaveURL((url) => url.pathname === "/nextgen/manager");
    await expect(page).toHaveTitle(/NextGen Admin/i);
    await expect(
      page.getByRole("heading", { level: 1, name: "NextGen Admin" })
    ).toBeVisible();
    await expectAnyVisible(
      [
        page.getByRole("button", { name: "Connect" }),
        page.getByRole("heading", {
          level: 4,
          name: "ONLY ADMIN WALLETS CAN USE THIS dAPP.",
        }),
      ],
      "NextGen admin permission boundary"
    );
    await expectNoMainButtons(page, NEXTGEN_ADMIN_ACTIONS);
  });

  test("keeps Drop Forge routes fail-closed without wallet authority", async ({
    page,
  }) => {
    for (const route of [
      { path: "/drop-forge", heading: "Drop Forge" },
      { path: "/drop-forge/craft", heading: "Craft Claims" },
      { path: "/drop-forge/launch", heading: "Launch Claims" },
    ]) {
      await expectDropForgeDenied(page, route);
    }
  });

  test("keeps public Groups browse free of owner and voting controls", async ({
    page,
  }) => {
    await gotoGroupsReady(page);

    await expect(page).toHaveURL((url) => url.pathname === "/network/groups");
    await expect(
      page.getByRole("heading", { level: 1, name: "Groups" })
    ).toBeVisible();
    await expect(page.getByLabel("By Identity")).toBeVisible();
    await expect(page.getByLabel("By Group Name")).toBeVisible();
    await expectNoMainButtons(page, [
      "Create New",
      "My groups",
      "Rep all",
      "NIC all",
      "Open options",
      "Edit",
      "Clone",
      "Delete",
    ]);
  });
});
