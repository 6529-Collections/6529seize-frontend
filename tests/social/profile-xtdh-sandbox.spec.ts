import type { Page } from "@playwright/test";
import {
  test,
  expect,
  expectNoHorizontalOverflow,
  captureSafeScreenshot,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WALLET = "0x0000000000000000000000000000000000000529";
const CONTRACT = "0x0000000000000000000000000000000000000002";
const PROFILE_ID = "00000000-0000-4000-8000-000000000531";

async function seedOwner(page: Page) {
  const jwt = [
    Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url"),
    Buffer.from(JSON.stringify({ sub: WALLET, exp: 2000000000 })).toString(
      "base64url"
    ),
    "",
  ].join(".");
  await page.addInitScript(
    ({ address, token, profileId }) => {
      document.cookie = "essential-cookies-consent=true; path=/";
      document.cookie = "performance-cookies-consent=false; path=/";
      localStorage.setItem("6529-wallet-active-address", address);
      localStorage.setItem(
        "6529-wallet-accounts",
        JSON.stringify([
          {
            address,
            jwt: token,
            role: null,
            refreshToken: null,
            authSessionVersion: "v2",
            profileId,
            profileHandle: "playwright",
          },
        ])
      );
    },
    { address: WALLET, token: jwt, profileId: PROFILE_ID }
  );
}

async function installFixtures(page: Page, api: string) {
  await page.route(`${api}/api/xtdh/stats/*`, (route) =>
    route.fulfill({
      json: {
        generation_rate: 13421.9,
        incoming_rate: 303.9,
        unused_rate: 7309.9,
        outgoing_rate: 6112,
        outgoing_total: 12345,
        outgoing_collections_count: 3,
        outgoing_tokens_count: 12,
        incoming_total: 5000,
        generated_total: 20000,
        multiplier: 1,
      },
    })
  );
  await page.route(`${api}/api/xtdh/grants?**`, (route) => {
    const status =
      new URL(route.request().url()).searchParams.get("status") ?? "GRANTED";
    const pending = status.includes("PENDING");
    return route.fulfill({
      json: {
        count: 2,
        next: false,
        page: 1,
        data: Array.from({ length: 2 }, (_, index) => ({
          id: `design-grant-${index}`,
          grantor: {
            id: PROFILE_ID,
            handle: "playwright",
            primary_address: WALLET,
          },
          target_chain: "ETHEREUM_MAINNET",
          target_contract: CONTRACT,
          target_token_mode: "INCLUDE",
          target_tokens_count: 2,
          target_collection_name: "Design collection",
          created_at: 1760000000000,
          updated_at: 1760000000000,
          valid_from: 1760000000000,
          valid_to: index ? null : 1950000000000,
          rate: 747,
          error_details: null,
          status: pending ? "PENDING" : "GRANTED",
          is_irrevocable: false,
          total_granted: 255988,
        })),
      },
    });
  });
  const metadata = {
    address: CONTRACT,
    name: "Design collection",
    tokenType: "ERC721",
    totalSupply: "10021",
  };
  await page.route("**/api/alchemy/contracts", (route) =>
    route.fulfill({
      json: { contracts: [{ address: CONTRACT, chain: "ethereum", metadata }] },
    })
  );
  await page.route("**/api/alchemy/contract?**", (route) =>
    route.fulfill({ json: metadata })
  );
  await page.route(`${api}/api/xtdh/grants/*/tokens?**`, (route) =>
    route.fulfill({ json: { count: 0, data: [], next: false, page: 1 } })
  );
  await page.route(`${api}/api/xtdh/collections?**`, (route) => {
    const name = new URL(route.request().url()).searchParams.get(
      "collection_name"
    );
    return route.fulfill({
      json: {
        count: name ? 0 : 3,
        next: false,
        page: 1,
        data: name
          ? []
          : Array.from({ length: 3 }, (_, index) => ({
              contract: `0x${(index + 2).toString(16).padStart(40, "0")}`,
              xtdh: 5000 + index,
              xtdh_rate: 376.19,
              total_token_count: 12,
              active_token_count: 8,
              total_contributor_count: 3,
              active_contributor_count: 2,
            })),
      },
    });
  });
  await page.route(`${api}/api/xtdh/tokens?**`, (route) =>
    route.fulfill({ json: { count: 0, next: false, page: 1, data: [] } })
  );
}

test.describe("Profile xTDH compact design @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "xTDH owner checks require the isolated mock API."
  );
  test.beforeEach(async ({ page, baseURL }) => {
    await installFixtures(page, getSandboxApiOrigin(baseURL));
  });

  test("keeps owner shortcuts, status filters, disclosures and confirmations available", async ({
    page,
    isMobile,
  }) => {
    await seedOwner(page);
    await page.goto("/playwright/xtdh?tab=granted");
    await expect(page.getByText("Generating", { exact: true })).toBeVisible();
    const granted = page.getByRole("button", { name: "Granted", exact: true });
    await expect(granted).toHaveAttribute("aria-pressed", "true");
    const cards = page
      .getByRole("listitem")
      .filter({ has: page.getByText("Design collection", { exact: true }) });
    await expect(cards).toHaveCount(2);
    const card = cards.first();
    await expect(card.getByText("Last grant", { exact: true })).toBeVisible();
    const fields = await card.getByRole("term").evaluateAll((nodes) =>
      nodes
        .map((node) => ({
          label: node.textContent,
          order: Number(getComputedStyle(node.parentElement!).order),
        }))
        .sort((a, b) => a.order - b.order)
        .map((item) => item.label)
    );
    expect(fields).toEqual(
      isMobile
        ? [
            "TDH rate",
            "Total granted",
            "Tokens granted",
            "Valid from",
            "Token type",
            "Total supply",
            "Floor price",
          ]
        : [
            "Token type",
            "Total supply",
            "Floor price",
            "Tokens granted",
            "TDH rate",
            "Total granted",
            "Valid from",
          ]
    );
    const disclosure = card.getByRole("button", {
      name: "Show 2 tokens",
      exact: true,
    });
    await disclosure.click();
    await expect(
      card.getByRole("button", { name: "Hide 2 tokens", exact: true })
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      card.getByText("No specific token IDs were returned for this grant.")
    ).toBeVisible();
    await card
      .getByRole("button", { name: "Hide 2 tokens", exact: true })
      .click();
    for (const action of ["Stop Grant", "Revoke Grant"]) {
      if (isMobile) {
        await card
          .getByRole("button", { name: "Grant actions", exact: true })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("button", { name: action, exact: true })
          .click();
      } else {
        await card.getByRole("button", { name: action, exact: true }).click();
      }
      const confirmation = page.getByRole("dialog", {
        name: action,
        exact: true,
      });
      await expect(confirmation).toBeVisible();
      await expect(
        confirmation.getByRole("button", { name: action, exact: true })
      ).toBeEnabled();
      await confirmation
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      await expect(confirmation).toHaveCount(0);
    }
    const statusTabs = page.getByRole("tablist", {
      name: "Select tab",
      exact: true,
    });
    await statusTabs
      .getByRole("tab", { name: "Pending 2", exact: true })
      .click();
    await expect(
      statusTabs.getByRole("tab", { name: "Pending 2", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await statusTabs
      .getByRole("tab", { name: "Pending 2", exact: true })
      .press("End");
    await expect(
      statusTabs.getByRole("tab", { name: "Failed", exact: true })
    ).toBeFocused();
    await statusTabs
      .getByRole("tab", { name: "Failed", exact: true })
      .press("Home");
    await page.getByRole("button", { name: "Received", exact: true }).click();
    await page.getByRole("button", { name: "Grant", exact: true }).click();
    await expect(granted).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Create New Grant", exact: true })
    ).toBeVisible();
    await expect(page.getByPlaceholder("0x...")).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await page
      .getByRole("progressbar", { name: "Granted Rate" })
      .scrollIntoViewIfNeeded();
    await captureSafeScreenshot(page, test.info(), "profile-xtdh-owner");
  });

  test("keeps visitor collections searchable and opens their tokens", async ({
    page,
  }) => {
    await page.goto("/playwright/xtdh?tab=received");
    await expect(
      page.getByRole("button", { name: "Received", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Grant", exact: true })
    ).toHaveCount(0);
    const section = page
      .getByRole("heading", { name: "xTDH Collections", exact: true })
      .locator("xpath=ancestor::section[1]");
    const cards = section.getByRole("list").getByRole("button");
    await expect(cards).toHaveCount(3);
    const controls = section.getByRole("region", {
      name: "Sort and search received collections",
    });
    const search = controls.getByPlaceholder("Search collections...");
    await expect(search).toBeEnabled();
    await search.fill("unmatched collection");
    await expect(
      section.getByText("No collections found for “unmatched collection”", {
        exact: true,
      })
    ).toBeVisible();
    await search.clear();
    await expect(cards).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, test.info(), "profile-xtdh-received");
    await cards.first().click();
    await expect(
      page.getByRole("heading", { name: "xTDH Tokens", exact: true })
    ).toBeVisible();
    await expect(page).toHaveURL(/xtdh_received_contract=/);
  });
});
