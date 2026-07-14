import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

const SYNTHETIC_EMPTY_WALLET = "0x000000000000000000000000000000000000dEaD";

const DELEGATION_ACTIONS = [
  "Register Delegation",
  "Register Consolidation",
  "Register Delegation Manager",
] as const;

const ARTICLE_ROUTES = [
  {
    path: "/delegation/wallet-architecture",
    heading: "Wallet Architecture",
    title: "Wallet Architecture | 6529.io",
  },
  {
    path: "/delegation/delegation-faq",
    heading: "Delegation FAQ",
    title: "Delegation FAQ | 6529.io",
  },
  {
    path: "/delegation/consolidation-use-cases",
    heading: "Consolidation Use Cases",
    title: "Consolidation Use Cases | 6529.io",
  },
  {
    path: "/delegation/delegation-faq/use-cases-overview",
    heading: "Which Use Cases are Supported?",
    title: "Which Use Cases are Supported? | 6529.io",
  },
] as const;

const WRITE_GUARD_ROUTES = [
  {
    path: "/delegation/register-delegation?collection=0x33FD426905F149f8376e227d0C9D3340AaD17aF1&use_case=2",
    heading: "Connect Wallet to Register a Delegation",
  },
  {
    path: "/delegation/register-consolidation",
    heading: "Connect Wallet to Register a Consolidation",
  },
  {
    path: "/delegation/register-sub-delegation",
    heading: "Connect Wallet to Register a Delegation Manager",
  },
  {
    path: "/delegation/assign-primary-address",
    heading: "Connect Wallet to Assign a Primary Address",
  },
] as const;

const COLLECTION_ROUTES = [
  {
    path: "/delegation/any-collection",
    heading: "Any Collection",
    intro: "Records here apply across every supported delegation collection.",
  },
  {
    path: "/delegation/the-memes",
    heading: "The Memes",
    intro: "Records here apply only to The Memes collection.",
  },
  {
    path: "/delegation/meme-lab",
    heading: "Meme Lab",
    intro: "Records here apply only to Meme Lab.",
  },
  {
    path: "/delegation/6529-gradient",
    heading: "6529 Gradient",
    intro: "Records here apply only to 6529 Gradient.",
  },
] as const;

async function gotoReady(page: Page, path: string) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
  await expect(page).not.toHaveTitle("404 | PAGE NOT FOUND");
}

async function expectHeading(page: Page, name: string) {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

function pageMain(page: Page) {
  return page.locator("main").first();
}

test.describe("Delegation read-only coverage @surface @medium @large @readonly", () => {
  test("Delegation Center exposes disconnected-safe choices and references", async ({
    page,
  }) => {
    await gotoReady(page, "/delegation/delegation-center");

    await expect(page).toHaveTitle("Delegation Center | 6529.io");
    await expectHeading(page, "Delegation Center");
    await expect(
      page.getByText("These actions do not transfer NFTs.")
    ).toBeVisible();

    for (const action of DELEGATION_ACTIONS) {
      await expect(
        page.getByRole("button", { name: action, exact: true })
      ).toBeVisible();
    }

    await expect(
      page.getByRole("heading", { name: "Manage by Collection" })
    ).toBeVisible();
    for (const collection of [
      "Any Collection",
      "The Memes",
      "Meme Lab",
      "6529 Gradient",
    ]) {
      await expect(
        page.getByRole("button", { name: collection, exact: true })
      ).toBeVisible();
    }

    await expect(page.getByRole("link", { name: "Etherscan" })).toHaveAttribute(
      "href",
      /^https:\/\/(?:sepolia\.)?etherscan\.io\/address\/0x[a-fA-F0-9]{40}$/
    );
    await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/nftdelegation"
    );
  });

  for (const article of ARTICLE_ROUTES) {
    test(`article route renders ${article.heading}`, async ({ page }) => {
      await gotoReady(page, article.path);

      await expect(page).toHaveTitle(article.title);
      if (article.path.includes("/delegation-faq/")) {
        await expect(
          page.getByRole("navigation", { name: "Breadcrumb" })
        ).toBeVisible();
      }
      await expectHeading(page, article.heading);
      await expect(
        page.getByText("Loading delegation article...")
      ).toBeHidden();
    });
  }

  test("Wallet Checker validates malformed input", async ({ page }) => {
    await gotoReady(page, "/delegation/wallet-checker");

    await expect(page).toHaveTitle("Wallet Checker | 6529.io");
    await expectHeading(page, "Wallet Checker");
    await expect(
      page.getByText(
        "This is read-only and does not require wallet connection."
      )
    ).toBeVisible();

    const input = page.getByLabel("Wallet address or ENS name");
    await input.fill("not-a-wallet");
    await expect(
      page.getByRole("alert").filter({
        hasText: "Enter a valid Ethereum address or ENS name.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Check Wallet" })
    ).toBeDisabled();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(input).toHaveValue("");
  });

  test("Wallet Checker returns a public empty state", async ({ page }) => {
    await gotoReady(
      page,
      `/delegation/wallet-checker?address=${SYNTHETIC_EMPTY_WALLET}`
    );
    await expect(page.getByText("Checking delegation records...")).toBeHidden({
      timeout: 20000,
    });
    // The loading indicator may not have appeared yet when the assertion above
    // runs, so give the delegation lookup the same budget here.
    await expect(
      page.getByText(
        "No delegation, delegation manager, or consolidation records found for this wallet."
      )
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByRole("heading", { name: "Delegations (0)" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Delegation Managers (0)" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Consolidations (0)" })
    ).toBeVisible();
    await expect(page.getByText("No delegations found")).toBeVisible();
    await expect(page.getByText("No delegation managers found")).toBeVisible();
    await expect(page.getByText("No consolidations found")).toBeVisible();
  });

  for (const route of WRITE_GUARD_ROUTES) {
    test(`write route is wallet-gated: ${route.heading}`, async ({ page }) => {
      await gotoReady(page, route.path);
      const main = pageMain(page);

      await expectHeading(page, route.heading);
      await expect(
        main.getByRole("button", { name: "Connect Wallet" })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: /^Register|^Assign/ })
      ).toHaveCount(0);
    });
  }

  for (const route of COLLECTION_ROUTES) {
    test(`collection scope is wallet-gated: ${route.heading}`, async ({
      page,
    }) => {
      await gotoReady(page, route.path);
      const main = pageMain(page);

      await expectHeading(page, route.heading);
      await expect(page.getByText(route.intro)).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: `Connect Wallet to Manage ${route.heading}`,
        })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: "Back to Delegation Center" })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: "Connect Wallet" })
      ).toBeVisible();
    });
  }
});
