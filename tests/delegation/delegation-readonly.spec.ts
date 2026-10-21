import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  gotoDocumentWithTransientRetry,
  RESPONSE_TIMEOUT_MS,
} from "../support/routeReadiness";

const SYNTHETIC_EMPTY_WALLET = "0x000000000000000000000000000000000000dEaD";

const DELEGATION_ACTIONS = [
  "Delegation",
  "Consolidation",
  "Delegation Manager",
] as const;

const ARTICLE_ROUTES = [
  {
    path: "/safe-collecting/tap-guide",
    heading: "The Three Address Protocol",
    title: "The Three Address Protocol (TAP) | 6529.io",
  },
  {
    path: "/safe-collecting/faq",
    heading: "FAQ",
    title: "FAQ | 6529.io",
  },
  {
    path: "/safe-collecting/consolidation-use-cases",
    heading: "Consolidation Use Cases",
    title: "Consolidation Use Cases | 6529.io",
  },
  {
    path: "/safe-collecting/faq/use-cases-overview",
    heading: "Which Use Cases are Supported?",
    title: "Which Use Cases are Supported? | 6529.io",
  },
] as const;

const WRITE_GUARD_ROUTES = [
  {
    path: "/safe-collecting/register-delegation?collection=0x33FD426905F149f8376e227d0C9D3340AaD17aF1&use_case=2",
    heading: "Connect Wallet to Register a Delegation",
  },
  {
    path: "/safe-collecting/register-consolidation",
    heading: "Connect Wallet to Register a Consolidation",
  },
  {
    path: "/safe-collecting/register-sub-delegation",
    heading: "Connect Wallet to Register a Delegation Manager",
  },
  {
    path: "/safe-collecting/assign-primary-address",
    heading: "Connect Wallet to Assign a Primary Address",
  },
] as const;

const COLLECTION_ROUTES = [
  {
    path: "/safe-collecting/any-collection",
    heading: "Any Collection",
    intro: "Records here apply across every supported delegation collection.",
  },
  {
    path: "/safe-collecting/the-memes",
    heading: "The Memes",
    intro: "Records here apply only to The Memes collection.",
  },
  {
    path: "/safe-collecting/meme-lab",
    heading: "Meme Lab",
    intro: "Records here apply only to Meme Lab.",
  },
  {
    path: "/safe-collecting/6529-gradient",
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

async function expectWalletCanonical(page: Page, address = "") {
  const canonical = new URL("/safe-collecting/wallet-checker", page.url());
  if (address) {
    canonical.searchParams.set("address", address.toLowerCase());
  }
  const socialUrls = page.locator('meta[property="og:url"]');
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('link[rel="canonical"]'), (link) =>
          link.getAttribute("href")
        )
      )
    )
    .toEqual([canonical.toString()]);
  await expect(socialUrls).toHaveCount(1);
  await expect(socialUrls).toHaveAttribute("content", canonical.toString());
}

test.describe("Delegation read-only coverage @surface @medium @large @readonly", () => {
  test("Safe Collecting exposes disconnected-safe choices and references", async ({
    page,
  }) => {
    await gotoReady(page, "/safe-collecting");

    await expect(page).toHaveTitle("Safe Collecting | 6529.io");
    await expectHeading(page, "Safe Collecting");
    await expect(
      page.getByRole("heading", { name: "All tools", exact: true })
    ).toBeVisible();

    for (const action of DELEGATION_ACTIONS) {
      await expect(
        page.getByRole("button", { name: action, exact: true })
      ).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: "Guided Setup", exact: true })
    ).toBeVisible();

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

  test("legacy hub links preserve queries and focus their section after redirect", async ({
    page,
  }) => {
    await gotoReady(
      page,
      "/delegation/delegation-center?utm_source=legacy#safe-setup"
    );
    await expect(page).toHaveURL(
      /\/safe-collecting\?utm_source=legacy#safe-setup$/
    );
    await expectHeading(page, "Safe Collecting");
    await expect(
      page.getByRole("heading", { name: "Set it up", exact: true })
    ).toBeFocused();
    // The canonical link is document metadata with no accessible locator.
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.querySelector('link[rel="canonical"]')?.getAttribute("href")
        )
      )
      .toBe(new URL("/safe-collecting", page.url()).toString());

    const navigation = page.getByRole("navigation", {
      name: "Safe collecting sections",
    });
    for (const [tab, path] of [
      ["TAP Guide", "/safe-collecting/tap-guide"],
      ["FAQ", "/safe-collecting/faq"],
      ["Consolidation Use Cases", "/safe-collecting/consolidation-use-cases"],
    ] as const) {
      await navigation.getByRole("button", { name: tab, exact: true }).click();
      await expect(page).toHaveURL((url) => url.pathname === path);
      await waitForRouteReady(page);
    }
    await navigation
      .getByRole("button", { name: "Wallet Checker", exact: true })
      .click();
    await expect(page).toHaveURL(/\/safe-collecting\/wallet-checker$/);
    await navigation
      .getByRole("button", { name: "Safe Collecting", exact: true })
      .click();
    await expect(page).toHaveURL(/\/safe-collecting$/);
    await expectHeading(page, "Safe Collecting");
  });

  test("legacy FAQ article links reach the canonical article and return to FAQ", async ({
    page,
  }) => {
    await gotoReady(
      page,
      "/delegation/delegation-faq/register-delegation?utm_source=legacy#instructions"
    );
    await expect(page).toHaveURL(
      /\/safe-collecting\/faq\/register-delegation\?utm_source=legacy#instructions$/
    );
    await expectHeading(page, "How to Register a Delegation?");
    const back = page.getByRole("link", { name: "All FAQ topics" });
    await expect(back).toHaveAttribute("href", "/safe-collecting/faq");
    await back.click();
    await expect(page).toHaveURL(/\/safe-collecting\/faq$/);
    await expectHeading(page, "FAQ");
  });

  for (const article of ARTICLE_ROUTES) {
    test(`article route renders ${article.heading}`, async ({ page }) => {
      await gotoReady(page, article.path);

      await expect(page).toHaveTitle(article.title);
      if (article.path.includes("/faq/")) {
        await expect(
          page.getByRole("navigation", { name: "Breadcrumb" })
        ).toHaveCount(0);
        await expect(
          page.getByRole("link", { name: "All FAQ topics" })
        ).toHaveAttribute("href", "/safe-collecting/faq");
      }
      await expectHeading(page, article.heading);
      await expect(
        page.getByText("Loading delegation article...")
      ).toBeHidden();
    });
  }

  test("Wallet Checker validates malformed input", async ({ page }) => {
    await gotoReady(page, "/safe-collecting/wallet-checker");

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
      `/safe-collecting/wallet-checker?address=${SYNTHETIC_EMPTY_WALLET}&utm_source=metadata-regression`
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
    await expectWalletCanonical(page, SYNTHETIC_EMPTY_WALLET);
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("utm_source") === "metadata-regression"
    );

    await page.getByRole("button", { name: "Clear", exact: true }).click();
    const input = page.getByLabel("Wallet address or ENS name");
    await expect(input).toBeVisible();
    await expect(page).toHaveURL((url) => !url.searchParams.has("address"));
    await expectWalletCanonical(page);

    await input.fill(SYNTHETIC_EMPTY_WALLET);
    await page
      .getByRole("button", { name: "Check Wallet", exact: true })
      .click();
    await expect(
      page.getByText(
        "No delegation, delegation manager, or consolidation records found for this wallet."
      )
    ).toBeVisible({ timeout: 20000 });
    await expectWalletCanonical(page, SYNTHETIC_EMPTY_WALLET);
  });

  test("guided instructions wrap full addresses at 375px without signing", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 850 });
    await gotoReady(page, "/safe-collecting/build-consolidation");
    const main = pageMain(page);
    await expect(main.getByText(/^0 of \d+ wallets$/)).toBeVisible({
      timeout: RESPONSE_TIMEOUT_MS,
    });
    await main
      .getByRole("textbox", { name: "Wallet 1 address" })
      .fill("0x0000000000000000000000000000000000000001");
    await main
      .getByRole("textbox", { name: "Wallet 2 address" })
      .fill("0x0000000000000000000000000000000000000002");
    await expect(main.getByText(/^Connect Wallet 1 \(/)).toBeVisible();
    await expect(
      main.getByText("Available once the earlier steps are confirmed.", {
        exact: true,
      })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(
      main.getByRole("button", { name: /^Sign (Step|for) / })
    ).toHaveCount(0);
  });

  test("guided consolidation plans without a wallet and signs nothing", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(page, "/safe-collecting/build-consolidation");
    const main = pageMain(page);

    await expect(page).toHaveTitle("Build a Consolidation | 6529.io");
    await expect(
      main.getByRole("heading", { level: 2, name: "Build a Consolidation" })
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: "How consolidation affects TDH" })
    ).toHaveAttribute("href", "/network/tdh/consolidation");
    await expect(
      main.getByRole("link", { name: "Appoint a Delegation Manager" })
    ).toHaveAttribute("href", "/safe-collecting/register-sub-delegation");

    const firstWallet = main.getByRole("textbox", {
      name: "Wallet 1 address",
    });
    // The settings-backed count only appears after hydration. Editing the
    // server-rendered field earlier can lose the value when React takes over.
    await expect(main.getByText("0 of 4 wallets", { exact: true })).toBeVisible(
      { timeout: RESPONSE_TIMEOUT_MS }
    );
    // Before cutoff the optional counter note uses quiet, small copy. The
    // exact time boundary and absent-policy cases are covered in component tests.
    const openingNote = main.getByText(/^Four-wallet signing opens /);
    if (await openingNote.count()) {
      await expect(openingNote).toHaveCSS("font-size", "12px");
      if (!isMobile) {
        await expect(openingNote).toHaveJSProperty("clientHeight", 20);
      }
    }
    await expect(firstWallet).toHaveAttribute("placeholder", "0x… or ENS");
    await expect(firstWallet).toHaveValue("");
    await firstWallet.fill("not-a-wallet");
    await expect(firstWallet).toHaveAttribute("aria-invalid", "true");
    await expect(
      main.getByText("Enter a valid Ethereum address or a resolvable ENS name.")
    ).toBeVisible();
    await expect(
      main.getByText("Enter at least two valid wallets to see the steps.")
    ).toBeVisible();

    await main.getByRole("button", { name: "Add Wallet" }).click();
    await main.getByRole("button", { name: "Add Wallet" }).click();
    await expect(
      main.getByRole("textbox", { name: "Wallet 4 address" })
    ).toBeVisible();
    await expect(main.getByRole("button", { name: "Add Wallet" })).toHaveCount(
      0
    );
    await expect(
      main.getByText("A consolidation can hold up to 4 wallets.")
    ).toBeVisible();
    // Neither a signer's own step button nor the manager's "Sign for ..."
    // button may appear without a connected wallet.
    await expect(
      main.getByRole("button", { name: /^Sign (Step|for) / })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    const close = main.getByRole("button", { name: "Cancel Consolidation" });
    await close.focus();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(
      tooltip.getByText("Cancel Consolidation", { exact: true })
    ).toHaveCSS("font-size", isMobile ? "13px" : "14px");
    await close.click();
    await expect(page).toHaveURL(/\/safe-collecting\/?$/);
    await expect(
      main.getByRole("heading", { name: "Safe Collecting", exact: true })
    ).toBeVisible();
  });

  for (const route of WRITE_GUARD_ROUTES) {
    test(`write route is wallet-gated: ${route.heading}`, async ({ page }) => {
      await gotoReady(page, route.path);
      const main = pageMain(page);

      // The shell precedes wallet restoration. Keep the disconnected-state
      // requirement, but allow the existing bounded data-readiness budget.
      await expect(
        main.getByRole("heading", { level: 1, name: route.heading })
      ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
      await expect(
        main.getByRole("button", { name: "Connect Wallet" })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: /^Register|^Assign/ })
      ).toHaveCount(0);
      const back = main.getByRole("link", { name: "Back to Safe Collecting" });
      await expect(back).toBeVisible();
      await expect(back).toHaveAttribute("href", "/safe-collecting");
      await back.click();
      await expect(page).toHaveURL(/\/safe-collecting\/?$/);
      await expect(
        main.getByRole("heading", { name: "Safe Collecting", exact: true })
      ).toBeVisible();
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
      ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
      await expect(
        main.getByRole("button", { name: "Back to Safe Collecting" })
      ).toBeVisible();
      await expect(
        main.getByRole("button", { name: "Connect Wallet" })
      ).toBeVisible();
    });
  }
});

// Representative browser cases cover each newly translated guide family.
// Dictionary completeness and interpolation across every locale live in Jest.
for (const guide of [
  {
    locale: "en-GB",
    path: "/network/tdh/consolidation",
    heading: "Combine your wallets",
    link: "How your wallets fit together",
  },
  {
    locale: "fr-FR",
    path: "/safe-collecting",
    heading: "Collectionner en sécurité",
    link: "Configurer vos portefeuilles",
  },
  {
    locale: "es-ES",
    path: "/safe-collecting/tap-guide",
    heading: "El Three Address Protocol",
    link: "Configurar tus carteras",
  },
  {
    locale: "de-DE",
    path: "/network/tdh/consolidation/design",
    heading: "So funktioniert die Wallet-Konsolidierung",
    link: "Leitfaden für Sammler lesen",
  },
] as const) {
  test.describe(`${guide.locale} collecting guide @surface @medium @large @readonly`, () => {
    test.use({ locale: guide.locale });

    test("renders translated guide copy on a narrow screen", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 850 });
      await gotoReady(page, guide.path);
      await expectHeading(page, guide.heading);
      await expect(
        page.getByRole("link", { name: guide.link, exact: true })
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  });
}
