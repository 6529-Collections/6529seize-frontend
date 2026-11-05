import type { Locator, Page } from "@playwright/test";

import {
  captureSafeScreenshot,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

import {
  installSubscriptionFixtures,
  subscriptionCoverageFixture,
} from "../support/subscriptionFixtures";
import { ApiSubscriptionCoverageStatus } from "../../generated/models/ApiSubscriptionCoverageStatus";
import { ApiSubscriptionCoverageMode } from "../../generated/models/ApiSubscriptionCoverageMode";
import { isCapacitorSimulationProject } from "../support/surfaceSimulation";

const plan = {
  id: "emma-layout-fixture",
  name: `${"Long distribution plan name ".repeat(4)}${"N".repeat(80)}`,
  description: `${"A description that must wrap inside the plan table. ".repeat(6)}${"D".repeat(120)}`,
  createdAt: Date.UTC(2026, 8, 22),
};

const DEV_AUTH_SKIP_MESSAGE =
  "Authenticated shell E2E requires PLAYWRIGHT_READONLY=1, USE_DEV_AUTH=true, DEV_MODE_WALLET_ADDRESS, DEV_MODE_AUTH_JWT, and PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE.";
const PROFILE_HANDLE = process.env["PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE"] ?? "";
const PROFILE_BASE_PATH = `/${PROFILE_HANDLE}`;
const WALLET_GATE_HEADING =
  "This content is only available to connected wallets.";
const WALLET_GATE_COPY = "Connect your wallet to continue.";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function hasDevAuthConfig() {
  return (
    process.env["PLAYWRIGHT_READONLY"] === "1" &&
    process.env["USE_DEV_AUTH"] === "true" &&
    Boolean(process.env["DEV_MODE_WALLET_ADDRESS"]) &&
    Boolean(process.env["DEV_MODE_AUTH_JWT"]) &&
    Boolean(PROFILE_HANDLE)
  );
}

async function expectSingleLineLabel(locator: Locator) {
  const fits = await locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const style = getComputedStyle(element);
    const lineHeight =
      Number.parseFloat(style.lineHeight) ||
      Number.parseFloat(style.fontSize) * 1.5;
    return range.getBoundingClientRect().height <= lineHeight + 1;
  });
  expect(fits).toBe(true);
}

async function gotoReady(
  page: Page,
  path: string,
  options: { readySelector?: string } = {}
) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page, options);
  await expect(page).toHaveURL((url) => url.pathname === path);
  await expectNoHorizontalOverflow(page);
}

async function expectWalletGateAbsent(page: Page) {
  await expect(
    page.getByRole("heading", { level: 1, name: WALLET_GATE_HEADING })
  ).toHaveCount(0);
  await expect(page.getByText(WALLET_GATE_COPY)).toHaveCount(0);
  await expect(
    page.getByText("You need to set up a profile to continue.")
  ).toHaveCount(0);
  await expect(page.getByText("This content is not available.")).toHaveCount(0);
}

async function isVisible(locator: Locator) {
  return locator
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);
}

async function expectAnyVisible(
  locators: Array<{ readonly label: string; readonly locator: Locator }>,
  description: string
) {
  for (const { locator } of locators) {
    if (await isVisible(locator)) {
      return;
    }
  }

  throw new Error(
    `Expected ${description} to show one of: ${locators
      .map(({ label }) => label)
      .join(", ")}`
  );
}

async function expectProfileShell(page: Page, activeTab: string | RegExp) {
  const profileSections = page.getByRole("navigation", {
    name: "Profile sections",
  });

  await expect(profileSections).toBeVisible();
  await expect(
    page
      .locator("main")
      .getByText(new RegExp(`^${escapeRegExp(PROFILE_HANDLE)}$`, "i"))
      .first()
  ).toBeVisible();
  await expect(
    profileSections.getByRole("link", { name: activeTab })
  ).toHaveAttribute("aria-current", "page");
}

test.describe("Authenticated read-only route shells @auth @medium @readonly", () => {
  test.skip(!hasDevAuthConfig(), DEV_AUTH_SKIP_MESSAGE);

  test("opens EMMA plans directly from a restored session and keeps help public", async ({
    page,
  }) => {
    await page.goto("/emma", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL((url) => url.pathname === "/emma/plans");
    await expect(
      page.getByRole("heading", { name: "EMMA", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true })
    ).toHaveCount(0);
    await page.getByRole("link", { name: "About EMMA" }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/emma/help");
    await expect(
      page.getByRole("heading", { name: /Meet EMMA/ })
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to EMMA" }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/emma/plans");
    await expectNoHorizontalOverflow(page);
  });

  test("renders direct messages without falling back to the wallet gate", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const flashes: string[] = [];
      Object.defineProperty(window, "__authPromptFlashes", { value: flashes });
      const observer = new MutationObserver(() => {
        for (const heading of document.querySelectorAll("h1")) {
          if (
            /only available to connected wallets|need to set up a profile/.test(
              heading.textContent ?? ""
            )
          ) {
            flashes.push(heading.textContent ?? "");
          }
        }
      });
      observer.observe(document, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });
    await gotoReady(page, "/messages", { readySelector: "#messages-content" });
    expect(
      await page.evaluate(() => Reflect.get(window, "__authPromptFlashes"))
    ).toEqual([]);

    await expect(page.locator("#messages-content")).toBeVisible();
    await expectWalletGateAbsent(page);
    await expectAnyVisible(
      [
        {
          label: "desktop conversation placeholder",
          locator: page.getByRole("heading", {
            level: 2,
            name: "Select a Conversation",
          }),
        },
        {
          label: "desktop messages sidebar",
          locator: page.getByText("Messages", { exact: true }).first(),
        },
        {
          label: "empty direct-message list",
          locator: page.getByText(/No (direct )?messages/i).first(),
        },
        {
          label: "create DM action",
          locator: page
            .getByRole("button", { name: /Create DM|New direct message/i })
            .or(page.getByRole("link", { name: "Create DM", exact: true }))
            .first(),
        },
      ],
      "the authenticated messages shell"
    );
  });

  test("opens New message from the messages action and returns without creating a conversation", async ({
    page,
  }, testInfo) => {
    await gotoReady(page, "/messages", { readySelector: "#messages-content" });
    const nativeAction = page.getByRole("link", {
      name: "Create DM",
      exact: true,
    });
    const isNative = isCapacitorSimulationProject(testInfo.project.name);
    const action = isNative
      ? nativeAction
      : page
          .getByRole("button", { name: /^(Create DM|New direct message)$/ })
          .first();
    await action.click();
    await expect(page).toHaveURL((url) =>
      isNative
        ? url.pathname === "/messages/create"
        : url.pathname === "/messages" &&
          url.searchParams.get("create") === "dm"
    );
    await expect(
      page.getByRole("textbox", { name: "To:", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Message", exact: true })
    ).toBeDisabled();
    await expectWalletGateAbsent(page);

    if (isNative) {
      await page.goBack();
    } else {
      await page
        .getByRole("button", { name: "Close new direct message modal" })
        .click();
    }
    await expect(page).toHaveURL(
      (url) => url.pathname === "/messages" && !url.searchParams.has("create")
    );
    await expect(action).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("opens the guided consolidation flow from the own-profile wallet entry", async ({
    page,
  }) => {
    await gotoReady(page, PROFILE_BASE_PATH);
    await expectProfileShell(page, "Identity");
    const statements = page.getByRole("button", { name: /ID Statements/i });
    if (await statements.isVisible()) {
      await statements.click();
    }

    const walletChecker = page.getByRole("link", { name: "Wallet Checker" });
    await expect(walletChecker).toBeVisible();
    await expect(page.getByText(/^\d of 4 addresses$/).first()).toBeVisible();
    const addWallet = page.getByRole("link", {
      name: "Add another wallet",
      exact: true,
    });
    await expect(addWallet).toBeVisible();
    await expect(addWallet).toHaveAttribute(
      "href",
      "/safe-collecting/build-consolidation"
    );
    const walletHeading = page.getByRole("heading", {
      name: `${PROFILE_HANDLE}${PROFILE_HANDLE.endsWith("s") ? "'" : "'s"} Wallet`,
      level: 3,
    });
    const statementsHeading = page.getByRole("heading", {
      name: /ID Statements$/,
      level: 3,
    });
    const addStatement = page.getByRole("button", { name: "Add", exact: true });
    await expect(walletHeading).toBeVisible();
    await expect(statementsHeading).toBeVisible();
    await expect(addStatement).toBeVisible();
    await expect(walletHeading).toHaveCSS("font-size", "18px");
    await expect(statementsHeading).toHaveCSS("font-size", "18px");
    const statementHelp = page.getByRole("button", {
      name: "About identity statements",
      exact: true,
    });
    await expect(statementHelp).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: "About identity statements", exact: true })
        .locator("svg")
    ).toHaveCSS("width", "18px");
    await expect(
      page
        .getByRole("button", { name: "About identity statements", exact: true })
        .locator("svg")
    ).toHaveCSS("height", "18px");
    await expect(statementHelp).toHaveCSS("width", "32px");
    await expect(statementHelp).toHaveCSS("height", "32px");
    const checkerBox = await walletChecker.boundingBox();
    const addWalletBox = await addWallet.boundingBox();
    const statementHeadingBox = await statementsHeading.boundingBox();
    const addStatementBox = await addStatement.boundingBox();
    const helpBox = await statementHelp.boundingBox();
    expect(checkerBox).not.toBeNull();
    expect(addWalletBox).not.toBeNull();
    expect(statementHeadingBox).not.toBeNull();
    expect(addStatementBox).not.toBeNull();
    expect(helpBox).not.toBeNull();
    expect(
      statementHeadingBox!.x + statementHeadingBox!.width
    ).toBeLessThanOrEqual(helpBox!.x);
    expect(helpBox!.x + helpBox!.width).toBeLessThanOrEqual(addStatementBox!.x);
    expect(
      Math.abs(checkerBox!.width - addWalletBox!.width)
    ).toBeLessThanOrEqual(1);
    expect(Math.abs(checkerBox!.y - addWalletBox!.y)).toBeLessThanOrEqual(1);
    expect(addWalletBox!.y).toBeLessThan(statementHeadingBox!.y);
    expect(addStatementBox!.height).toBeLessThan(addWalletBox!.height);
    expect(
      Math.abs(
        statementHeadingBox!.y +
          statementHeadingBox!.height / 2 -
          (addStatementBox!.y + addStatementBox!.height / 2)
      )
    ).toBeLessThanOrEqual(1);
    await expectNoHorizontalOverflow(page);

    await captureSafeScreenshot(page, test.info(), "profile-identity-headings");

    await addStatement.click();
    const addDialog = page.getByRole("dialog");
    await expect(addDialog).toBeVisible();
    await expect(
      addDialog.getByText(
        "Statements are optional and fully and permanently public.",
        { exact: true }
      )
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(addDialog).toBeHidden();
    await expect(addStatement).toBeFocused();
    await addWallet.click();

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === "/safe-collecting/build-consolidation" &&
        url.search === ""
    );
    await expect(
      page.getByRole("heading", { name: "Build a Consolidation", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Before you start" })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Wallet 1 address", exact: true })
    ).toHaveValue(
      new RegExp(
        `^${escapeRegExp(process.env["DEV_MODE_WALLET_ADDRESS"] ?? "")}$`,
        "i"
      )
    );
    await expectNoHorizontalOverflow(page);

    await gotoReady(page, "/safe-collecting/register-consolidation");
    await expect(
      page.getByRole("heading", { name: "Register Consolidation", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Every pair of wallets · both directions",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^Use guided setup/ })
    ).toHaveAttribute("href", "/safe-collecting/build-consolidation");
    await expect(page.getByLabel("Collection", { exact: true })).toHaveValue(
      "0"
    );
    await expect(
      page.getByLabel("Consolidating With", { exact: true })
    ).toHaveValue("");
    await expectNoHorizontalOverflow(page);
  });

  test("renders the own-profile subscriptions shell read-only", async ({
    page,
  }) => {
    const path = `${PROFILE_BASE_PATH}/subscriptions`;

    await gotoReady(page, path);

    await expectProfileShell(page, "Subscriptions");
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Learn more", exact: true })
    ).toHaveAttribute("href", "/about/subscriptions");
    await expect(
      page.getByText("Subscription balance", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Upcoming Drops" })
    ).toBeVisible();
    const settings = page
      .getByRole("region", {
        name: "Minting settings",
        exact: true,
      })
      .or(page.getByRole("dialog", { name: "Minting settings", exact: true }));

    await expect(
      page
        .getByRole("region", { name: "Subscription minting", exact: true })
        .locator("#subscription-overview-actions")
        .getByText("Forecast use", { exact: true })
    ).toBeVisible();
    if (page.viewportSize()!.width < 1024) {
      await page
        .getByRole("button", { name: "Minting settings", exact: true })
        .click();
    }
    await expect(settings).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Airdrop Address" })
    ).toBeVisible();
    await expect(
      settings.getByRole("switch", {
        name: "All eligible editions",
        exact: true,
      })
    ).toBeVisible();
    if (page.viewportSize()!.width < 1024) {
      await settings
        .getByRole("button", { name: "Close", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Subscription History", exact: true })
        .click();
    }
    await expect(
      page.getByRole("heading", { name: "Subscription History", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Redeemed", exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("opens and focuses the top-up dialog from the notification link", async ({
    page,
  }) => {
    await installSubscriptionFixtures(page);
    const path = `${PROFILE_BASE_PATH}/subscriptions`;
    const hash = "#profile-subscriptions-top-up";

    // Existing notification anchors open the dialog after hydration.
    // Read-only: navigates and observes, never submits.
    await page.goto(`${path}${hash}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveURL(
      (url) => url.pathname === path && url.hash === hash
    );

    const topUp = page.getByRole("dialog", { name: "Top up" });
    await expect(topUp).toHaveAttribute("id", hash.slice(1));
    await expect(
      topUp.getByRole("heading", { name: "Top up", exact: true })
    ).toBeFocused();
    await expect(
      topUp.getByRole("heading", { name: "Top up", exact: true })
    ).toBeVisible();
    await expect(
      topUp.getByRole("heading", { name: "Top up", exact: true })
    ).toBeInViewport();
  });

  test("opens the top-up sheet for an owner without selected drops and focuses its deep link", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.setFixedTime(new Date("2026-10-30T00:01:00Z"));
    await installSubscriptionFixtures(page);
    await page.route(
      (url) => url.pathname.includes("/subscriptions/consolidation/coverage/"),
      async (route) => {
        await route.fulfill({
          json: subscriptionCoverageFixture({
            status: ApiSubscriptionCoverageStatus.NoUpcomingSelections,
            mode: ApiSubscriptionCoverageMode.Manual,
            balance_eth: "0",
            mint_capacity: 0,
            allocated_mints: 0,
            fully_funded_drops: 0,
            funded_through: null,
            next_unfunded: null,
            minimum_top_up: null,
            recommended_top_up: null,
          }),
        });
      }
    );
    await page.route(
      (url) => url.pathname.includes("/subscriptions/consolidation/details/"),
      async (route) => {
        await route.fulfill({
          json: {
            balance: 0,
            automatic: false,
            subscribe_all_editions: false,
            subscription_eligibility_count: 1,
            last_update: 0,
          },
        });
      }
    );
    await page.route(
      (url) =>
        url.pathname.includes("/subscriptions/consolidation/upcoming-memes/"),
      async (route) => {
        await route.fulfill({
          json: [568, 569, 570].map((token_id) => ({
            token_id,
            contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
            subscribed: false,
            subscribed_count: 0,
          })),
        });
      }
    );
    await page.goto(
      `${PROFILE_BASE_PATH}/subscriptions#profile-subscriptions-top-up`,
      { waitUntil: "domcontentloaded" }
    );
    await waitForRouteReady(page);
    const topUp = page.getByRole("dialog", { name: "Top up", exact: true });
    await expect(
      page.getByRole("region", { name: "Top up", exact: true })
    ).toHaveCount(0);
    await expect(
      topUp.getByRole("heading", { name: "Top up", exact: true })
    ).toBeFocused();
    await expect(
      topUp.getByRole("heading", { name: "Top up", exact: true })
    ).toBeInViewport();
    const singleCard = page
      .getByRole("dialog", { name: "Top up", exact: true })
      .locator('label[for="subscription-top-up-1"]');
    const singleCardBox = await singleCard.boundingBox();
    const cardLabelBox = await singleCard
      .getByText("1 Card", { exact: true })
      .boundingBox();
    const cardAmountBox = await singleCard
      .getByText("0.06529 ETH", { exact: true })
      .boundingBox();
    expect(singleCardBox).not.toBeNull();
    expect(cardLabelBox).not.toBeNull();
    expect(cardAmountBox).not.toBeNull();
    expect(singleCardBox!.height).toBeLessThanOrEqual(80);
    expect(singleCardBox!.height).toBeGreaterThanOrEqual(44);
    expect(cardAmountBox!.x).toBeGreaterThanOrEqual(
      cardLabelBox!.x + cardLabelBox!.width
    );
    expect(Math.abs(cardAmountBox!.y - cardLabelBox!.y)).toBeLessThanOrEqual(1);
    await topUp.getByRole("radio", { name: "1 Card", exact: true }).check();
    await expect(
      topUp.getByRole("button", { name: "Top up 0.06529 ETH", exact: true })
    ).toBeEnabled();
    await topUp.getByRole("spinbutton", { name: "Other card count" }).fill("2");
    await expect(
      topUp.getByRole("radio", { name: "Other", exact: true })
    ).toBeChecked();
    await expect(
      topUp.getByRole("button", { name: "Top up 0.13058 ETH", exact: true })
    ).toBeEnabled();
    await topUp
      .getByRole("button", {
        name: "Show Deep Time Subscriptions",
        exact: true,
      })
      .click();
    await expect(
      topUp.getByRole("radio", { name: /^Remaining Period/ })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(
      page,
      testInfo,
      "subscriptions-empty-top-up-sheet"
    );
    await page.keyboard.press("Escape");
    await expect(topUp).not.toBeVisible();
    const opener = page.getByRole("button", { name: "Top up", exact: true });
    await opener.click();
    await expect(
      topUp.getByRole("spinbutton", { name: "Other card count" })
    ).toHaveValue("2");
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Refresh balance", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Refresh coverage", exact: true })
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Choose drops", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Upcoming Drops", exact: true })
    ).toBeFocused();
    // Inspect the choices without submitting ETH or changing subscriptions.
  });

  test("subscriptions preserve full details, compact top up and history pagination", async ({
    page,
  }, testInfo) => {
    // Check the inline desktop layout first, then every mobile sheet breakpoint.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.clock.setFixedTime(new Date("2026-10-30T00:01:00Z"));
    const { address } = await installSubscriptionFixtures(page);
    await page.route(
      (url) =>
        url.pathname.includes("/subscriptions/consolidation/final/") &&
        url.pathname.endsWith("/568"),
      (route) =>
        route.fulfill({
          json: {
            phase: "Phase 0",
            phase_position: 8,
            phase_subscriptions: 42,
            airdrop_address: address,
            subscribed_count: 2,
          },
        })
    );
    await page.route(
      (url) => url.pathname.endsWith("/memes_latest"),
      (route) =>
        route.fulfill({
          json: {
            id: 568,
            contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
            thumbnail: "/profile-cms/templates/memes/1.webp",
          },
        })
    );
    await gotoReady(page, `${PROFILE_BASE_PATH}/subscriptions`);
    await expect(
      page.getByRole("heading", { name: "3 drops funded Running low" })
    ).toBeVisible();
    const overview = page
      .getByRole("region", { name: "Subscription minting", exact: true })
      .locator("#profile-subscriptions-overview");
    const statusHeading = overview.getByRole("heading", { level: 2 });
    await expect(
      overview.getByRole("heading", { level: 2 }).locator("svg")
    ).toHaveCount(0);
    const statusBadgeBox = await statusHeading
      .getByText("Running low", { exact: true })
      .boundingBox();
    const fundedCountBox = await statusHeading
      .getByText("3 drops funded", { exact: true })
      .boundingBox();
    expect(statusBadgeBox).not.toBeNull();
    expect(fundedCountBox).not.toBeNull();
    expect(statusBadgeBox!.y + statusBadgeBox!.height).toBeLessThanOrEqual(
      fundedCountBox!.y
    );
    const headlineBox = await overview
      .getByRole("heading", { level: 2 })
      .boundingBox();
    const descriptionBox = await page
      .getByRole("region", { name: "Subscription minting", exact: true })
      .locator("#profile-subscriptions-overview-title + p")
      .boundingBox();
    const overviewActions = page
      .getByRole("region", { name: "Subscription minting", exact: true })
      .locator("#subscription-overview-actions");
    const topUpButton = overviewActions.getByRole("button", {
      name: "Top up",
      exact: true,
    });
    const topUpBox = await topUpButton.boundingBox();
    await expect(
      overview.getByRole("link", { name: "Top up subscriptions", exact: true })
    ).toHaveCount(0);
    const balanceBox = await overviewActions
      .getByText("Subscription balance", { exact: true })
      .boundingBox();
    const overviewBox = await overview.boundingBox();
    expect(headlineBox).not.toBeNull();
    expect(descriptionBox).not.toBeNull();
    expect(topUpBox).not.toBeNull();
    expect(balanceBox).not.toBeNull();
    expect(overviewBox).not.toBeNull();
    for (const box of [topUpBox!, balanceBox!]) {
      expect(box.x).toBeGreaterThanOrEqual(overviewBox!.x);
      expect(box.x + box.width).toBeLessThanOrEqual(
        overviewBox!.x + overviewBox!.width
      );
      expect(box.y).toBeGreaterThanOrEqual(overviewBox!.y);
      expect(box.y + box.height).toBeLessThanOrEqual(
        overviewBox!.y + overviewBox!.height
      );
    }
    await expect(
      overview.getByRole("button", { name: "Details", exact: true })
    ).toHaveCount(0);
    expect(balanceBox!.y).toBeGreaterThanOrEqual(
      descriptionBox!.y + descriptionBox!.height
    );
    await expect(
      overview.getByRole("link", { name: "Choose drops", exact: true })
    ).toHaveCount(0);
    const forecast = overviewActions.getByRole("button", {
      name: "Forecast use",
      exact: true,
    });
    await expect(
      overviewActions.getByText("Forecast use", { exact: true })
    ).toBeVisible();
    await forecast.focus();
    const forecastTooltip = page.getByRole("tooltip").filter({
      hasText:
        "Projected from current eligibility, settings, balance, and the published Meme schedule.",
    });
    await expect(forecastTooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(forecastTooltip).toBeHidden();
    await forecast.click();
    await expect(forecastTooltip).toBeVisible();
    await page.keyboard.press("Escape");
    const amount = overviewActions.getByText("0.4 ETH", { exact: true });
    const refreshBalance = overviewActions.getByRole("button", {
      name: "Refresh balance",
    });
    await expect(amount).toBeVisible();
    const availableMints = overviewActions.getByText("(6 mints available)", {
      exact: true,
    });
    await expect(availableMints).toBeVisible();
    const availableMintsBox = await availableMints.boundingBox();
    expect(availableMintsBox).not.toBeNull();
    const amountBox = await amount.boundingBox();
    const refreshBox = await refreshBalance.boundingBox();
    expect(amountBox).not.toBeNull();
    expect(refreshBox).not.toBeNull();
    // The compact reference keeps capacity inline when it fits on desktop.
    // On phones it remains its own line beneath the balance.
    expect(availableMintsBox!.y).toBeGreaterThanOrEqual(amountBox!.y);
    if (page.viewportSize()!.width < 640) {
      expect(availableMintsBox!.y).toBeGreaterThanOrEqual(
        amountBox!.y + amountBox!.height
      );
    }
    expect(refreshBox!.x).toBeGreaterThanOrEqual(
      amountBox!.x + amountBox!.width
    );
    expect(
      Math.abs(
        amountBox!.y +
          amountBox!.height / 2 -
          (refreshBox!.y + refreshBox!.height / 2)
      )
    ).toBeLessThanOrEqual(1);
    await refreshBalance.focus();
    await expect(
      page.getByRole("tooltip", { name: "Refresh balance" })
    ).toBeVisible();
    const upcoming = page.getByRole("region", { name: "Upcoming Drops" });
    await expect(
      upcoming.getByText("Mon, Nov 2, 2026", { exact: true })
    ).toBeVisible();
    await expect(upcoming.getByText("/ 2", { exact: true })).toHaveCount(3);
    const settings = page
      .getByRole("region", {
        name: "Minting settings",
        exact: true,
      })
      .or(page.getByRole("dialog", { name: "Minting settings", exact: true }));
    const modeGroup = settings.getByRole("group", {
      name: "Mode",
      exact: true,
    });
    const mode = modeGroup.getByRole("switch", {
      name: "Automatic subscription mode",
      exact: true,
    });
    await expect(mode).toBeVisible();
    await expect(mode).toHaveAccessibleDescription(
      "Oct 2, 2026, 19:03 UTC Automatic airdrops of all eligible drops unless you opt-out"
    );
    const modeDate = settings.getByText("Oct 2, 2026, 19:03 UTC", {
      exact: true,
    });
    await expect(modeDate).toBeVisible();
    const modeValueBox = await modeGroup
      .getByText("Automatic", { exact: true })
      .boundingBox();
    const modeDateBox = await modeDate.boundingBox();
    expect(modeValueBox).not.toBeNull();
    expect(modeDateBox).not.toBeNull();
    expect(modeDateBox!.y).toBeGreaterThanOrEqual(modeValueBox!.y);
    const modeRowBox = await modeGroup.boundingBox();
    expect(modeRowBox).not.toBeNull();
    expect(modeDateBox!.x).toBeGreaterThanOrEqual(modeRowBox!.x);
    expect(modeDateBox!.x + modeDateBox!.width).toBeLessThanOrEqual(
      modeRowBox!.x + modeRowBox!.width + 1
    );
    await expect(modeDate).toHaveCSS("text-align", "start");
    await expect(
      upcoming.getByText(
        "Automatic airdrops of all eligible drops unless you opt-out",
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      upcoming.getByRole("switch", {
        name: "Toggle subscription for The Memes #568",
      })
    ).toBeDisabled();
    await expect(upcoming.getByRole("combobox").first()).toBeDisabled();
    const mintingArtwork = page
      .getByRole("region", { name: "Upcoming Drops", exact: true })
      .locator("img");
    await expect(mintingArtwork).toHaveCount(1);
    await expect(mintingArtwork).toHaveAttribute("alt", "");
    await expect
      .poll(() =>
        mintingArtwork.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0
        )
      )
      .toBe(true);
    await expect(upcoming.getByText("SZN17", { exact: true })).toHaveCount(3);
    await upcoming.getByRole("button", { name: "Minting Today" }).focus();
    await expect(
      page.getByRole("tooltip", { name: "No changes allowed on minting day" })
    ).toBeVisible();
    const upcomingBox = await upcoming.boundingBox();
    const settingsBox = await settings.boundingBox();
    const modeBox = await mode.boundingBox();
    expect(upcomingBox).not.toBeNull();
    expect(settingsBox).not.toBeNull();
    expect(modeBox).not.toBeNull();
    expect(settingsBox!.y + settingsBox!.height).toBeLessThanOrEqual(
      upcomingBox!.y
    );
    expect(modeBox!.x).toBeGreaterThanOrEqual(settingsBox!.x);
    expect(modeBox!.x + modeBox!.width).toBeLessThanOrEqual(
      settingsBox!.x + settingsBox!.width
    );
    const ownerViewport = page.viewportSize()!;
    for (const width of [390, 639, 640, 767, 768, 1023, 1024, 1342]) {
      await page.setViewportSize({ width, height: 900 });
      await expectNoHorizontalOverflow(page);
      const moreDetails = upcoming.getByRole("button", {
        name: "More",
        exact: true,
      });
      if (width < 768) {
        await expect(moreDetails).toHaveAttribute("aria-expanded", "false");
        const details = page
          .getByRole("region", { name: "Upcoming Drops", exact: true })
          .locator(`[id="${await moreDetails.getAttribute("aria-controls")}"]`);
        await expect(details).toBeHidden();
        await moreDetails.click();
        for (const label of [
          "Phase:",
          "Subscription Position:",
          "Airdrop Address:",
          "Subscription Count:",
        ]) {
          await expect(
            details.getByText(label, { exact: false })
          ).toBeVisible();
        }
        await expectNoHorizontalOverflow(page);
        await moreDetails.click();
        await expect(details).toBeHidden();
      } else {
        await expect(moreDetails).toBeHidden();
        await expect(upcoming.getByText(/^Phase:/)).toBeVisible();
      }
      await expect(
        page
          .getByRole("region", { name: "Subscription minting", exact: true })
          .locator("#profile-subscriptions-overview-title")
      ).toHaveCSS("font-size", width >= 768 ? "30px" : "24px");
      await expect(topUpButton).toHaveCSS(
        "font-size",
        width >= 768 ? "14px" : "15px"
      );
      const inlineAmountSize = width >= 768 ? "15px" : "14px";
      await expect(amount).toHaveCSS(
        "font-size",
        width < 640 ? "16px" : inlineAmountSize
      );
      await expect(
        upcoming.getByRole("button", { name: "Minting Today" })
      ).toHaveCSS("font-size", width >= 768 ? "16px" : "17px");
      await expect(
        upcoming.getByText("The Memes #568", { exact: true })
      ).toHaveCSS("font-size", width >= 768 ? "14px" : "15px");
      await expect(
        upcoming.getByText("The Memes #568", { exact: true })
      ).toHaveCSS("font-weight", "400");
      await expect(mintingArtwork).toHaveCSS("width", "80px");
      await expect(mintingArtwork).toHaveCSS("height", "113px");
      if (width < 640) {
        await expect(overviewActions).toHaveCSS("border-top-width", "0px");
        const forecastRow = overviewActions
          .getByRole("button", { name: "Forecast use", exact: true })
          .locator("../..");
        await expect(forecastRow).toHaveCSS("border-top-width", "0px");
        const mobileActionsBox = await overviewActions.boundingBox();
        const mobileTopUpBox = await topUpButton.boundingBox();
        expect(mobileActionsBox).not.toBeNull();
        expect(mobileTopUpBox).not.toBeNull();
        expect(
          Math.abs(mobileTopUpBox!.width - mobileActionsBox!.width)
        ).toBeLessThanOrEqual(1);
        expect(mobileTopUpBox!.height).toBeGreaterThanOrEqual(44);
        const mobileAmountBox = await amount.boundingBox();
        const mobileRefreshBox = await refreshBalance.boundingBox();
        expect(mobileAmountBox).not.toBeNull();
        expect(mobileRefreshBox).not.toBeNull();
        const mobileBalanceLabelBox = await overviewActions
          .getByText("Subscription balance", { exact: true })
          .boundingBox();
        const mobileForecastValueBox = await overviewActions
          .getByText("6 allocated", { exact: true })
          .boundingBox();
        expect(mobileBalanceLabelBox).not.toBeNull();
        expect(mobileForecastValueBox).not.toBeNull();
        expect(mobileAmountBox!.y).toBeGreaterThanOrEqual(
          mobileBalanceLabelBox!.y + mobileBalanceLabelBox!.height
        );
        expect(
          Math.abs(
            mobileAmountBox!.y +
              mobileAmountBox!.height / 2 -
              (mobileForecastValueBox!.y + mobileForecastValueBox!.height / 2)
          )
        ).toBeLessThanOrEqual(1);
        expect(mobileForecastValueBox!.x).toBeGreaterThanOrEqual(
          mobileAmountBox!.x + mobileAmountBox!.width
        );
        expect(
          Math.abs(
            mobileRefreshBox!.y +
              mobileRefreshBox!.height / 2 -
              (mobileBalanceLabelBox!.y + mobileBalanceLabelBox!.height / 2)
          )
        ).toBeLessThanOrEqual(1);
        if (width >= 492) {
          await expectSingleLineLabel(
            overviewActions.getByText("Subscription balance", { exact: true })
          );
        }
        await expect(availableMints).toHaveCSS("text-align", "start");
        await expectSingleLineLabel(
          overviewActions.getByText("Forecast use", { exact: true })
        );
      }
      if (width < 768) {
        // Both drop layouts use the same tablet breakpoint.
        for (const token of [568, 569]) {
          const titleBox = await upcoming
            .getByText(`The Memes #${token}`, { exact: true })
            .boundingBox();
          const toggleTargetBox = await upcoming
            .getByRole("switch", {
              name: `Toggle subscription for The Memes #${token}`,
              exact: true,
            })
            .locator("..")
            .boundingBox();
          expect(titleBox).not.toBeNull();
          expect(toggleTargetBox).not.toBeNull();
          expect(toggleTargetBox!.x).toBeGreaterThanOrEqual(
            titleBox!.x + titleBox!.width
          );
          expect(
            Math.abs(
              titleBox!.y +
                titleBox!.height / 2 -
                (toggleTargetBox!.y + toggleTargetBox!.height / 2)
            )
          ).toBeLessThanOrEqual(1);
          const countBox = await upcoming
            .getByRole("combobox")
            .nth(token - 568)
            .boundingBox();
          expect(countBox).not.toBeNull();
          if (width < 640) {
            expect(countBox!.y).toBeGreaterThanOrEqual(
              titleBox!.y + titleBox!.height
            );
            const otherCountBox = await upcoming
              .getByRole("combobox")
              .nth(1)
              .boundingBox();
            expect(otherCountBox).not.toBeNull();
            expect(
              Math.abs(countBox!.x - otherCountBox!.x)
            ).toBeLessThanOrEqual(1);
            if (token === 568) {
              const imageBox = await mintingArtwork.boundingBox();
              expect(imageBox).not.toBeNull();
              expect(countBox!.y).toBeGreaterThanOrEqual(
                imageBox!.y + imageBox!.height
              );
            }
          } else {
            expect(
              Math.abs(
                countBox!.y +
                  countBox!.height / 2 -
                  (titleBox!.y + titleBox!.height / 2)
              )
            ).toBeLessThanOrEqual(1);
          }
          expect(toggleTargetBox!.width).toBeGreaterThanOrEqual(44);
          expect(toggleTargetBox!.height).toBeGreaterThanOrEqual(44);
        }
      }
      if (width < 640) {
        const more = upcoming.getByRole("button", {
          name: "Show More",
          exact: true,
        });
        await more.click();
        const fullList = page.getByRole("dialog", {
          name: "Upcoming Drops",
          exact: true,
        });
        await expect(
          fullList.getByRole("heading", { name: "Upcoming Drops", exact: true })
        ).toBeFocused();
        await expect(
          fullList.getByRole("switch", {
            name: "Toggle subscription for The Memes #568",
            exact: true,
          })
        ).toBeDisabled();
        await expect(
          fullList.getByText("The Memes #571", { exact: true })
        ).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await fullList
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await expect(more).toBeFocused();
        await expect(
          upcoming.getByText("The Memes #571", { exact: true })
        ).toHaveCount(0);
      }
      const artworkBox = await mintingArtwork.boundingBox();
      const mintingLabelBox = await upcoming
        .getByRole("button", { name: "Minting Today" })
        .boundingBox();
      expect(artworkBox).not.toBeNull();
      expect(mintingLabelBox).not.toBeNull();
      expect(artworkBox!.x + artworkBox!.width).toBeLessThanOrEqual(
        mintingLabelBox!.x
      );
      const overviewSectionBox = await page
        .getByRole("region", { name: "Subscription minting", exact: true })
        .boundingBox();
      const settingsOpener = page.getByRole("button", {
        name: "Minting settings",
        exact: true,
      });
      if (width < 1024) {
        for (const id of [
          "profile-subscriptions-settings-title",
          "profile-subscriptions-history-title",
        ]) {
          await expect(
            page
              .getByRole("button", {
                name: id.includes("settings")
                  ? "Minting settings"
                  : "Subscription History",
                exact: true,
              })
              .locator(`#${id}`)
          ).toHaveCSS("font-size", "17px");
          await expect(
            page
              .getByRole("button", {
                name: id.includes("settings")
                  ? "Minting settings"
                  : "Subscription History",
                exact: true,
              })
              .locator(`#${id}`)
          ).toHaveCSS("font-weight", "500");
        }
        const openerBox = await settingsOpener.boundingBox();
        const dropsBox = await upcoming.boundingBox();
        expect(openerBox).not.toBeNull();
        expect(dropsBox).not.toBeNull();
        expect(openerBox!.y).toBeGreaterThanOrEqual(
          dropsBox!.y + dropsBox!.height
        );
        await settingsOpener.click();
        await expect(
          settings.getByRole("heading", {
            name: "Minting settings",
            exact: true,
          })
        ).toBeFocused();
      }
      const settingsSectionBox = await settings.boundingBox();
      expect(overviewSectionBox).not.toBeNull();
      expect(settingsSectionBox).not.toBeNull();
      if (width >= 1024) {
        expect(settingsSectionBox!.x).toBeGreaterThanOrEqual(
          overviewSectionBox!.x + overviewSectionBox!.width
        );
        expect(
          Math.abs(settingsSectionBox!.y - overviewSectionBox!.y)
        ).toBeLessThanOrEqual(1);
      } else {
        await expect(
          page.getByRole("dialog", { name: "Minting settings", exact: true })
        ).toBeVisible();
        await expect(mode).toBeEnabled();
        await expect(mode).toBeChecked();
      }
      const controls = settings
        .getByRole("group")
        .locator("[data-setting-controls]");
      await expect(controls).toHaveCount(2);
      for (const control of await controls.all()) {
        const layout = await control.evaluate((element) => {
          const groupBox = element
            .closest('[role="group"]')!
            .getBoundingClientRect();
          const labels = Array.from(
            element
              .closest('[role="group"]')!
              .querySelectorAll("[data-setting-value]")
          );
          const controls = Array.from(
            element.querySelectorAll("label[for], input")
          );
          return {
            contained: controls.every((control) => {
              const box = control.getBoundingClientRect();
              return (
                box.left >= groupBox.left && box.right <= groupBox.right + 1
              );
            }),
            labelLineCounts: labels.map((label) => {
              const range = document.createRange();
              range.selectNodeContents(label);
              return new Set(
                Array.from(range.getClientRects(), (rect) => rect.top)
              ).size;
            }),
          };
        });
        expect(layout.contained).toBe(true);
        expect(layout.labelLineCounts).toEqual([1]);
      }
      if (width < 1024) {
        await settings
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await expect(settingsOpener).toBeFocused();
      }
      const learnMore = page.getByRole("link", {
        name: "Learn more",
        exact: true,
      });
      await expect(learnMore).toHaveCSS("font-size", "13px");
      await expect(learnMore).toHaveCSS("font-weight", "400");
      const learnMoreBox = await learnMore.boundingBox();
      expect(learnMoreBox!.height).toBeGreaterThanOrEqual(44);
    }
    await page.setViewportSize(ownerViewport);
    const showMore = upcoming.getByRole("button", { name: "Show More" });
    await expect(showMore).toHaveCSS("justify-content", "center");
    const footer = await showMore.boundingBox();
    const list = await upcoming
      .getByRole("button", { name: "Show More" })
      .locator("..")
      .boundingBox();
    expect(footer).not.toBeNull();
    expect(list).not.toBeNull();
    const firstDrop = await upcoming
      .getByRole("button", { name: "Show More", exact: true })
      .locator("..")
      .locator(":scope > div > div")
      .first()
      .boundingBox();
    expect(firstDrop).not.toBeNull();
    expect(firstDrop!.y).toBeGreaterThan(list!.y);
    expect(Math.abs(footer!.width - list!.width)).toBeLessThanOrEqual(2);
    await showMore.click();
    await expect(
      upcoming.getByText("Next unfunded The Memes #571", { exact: true })
    ).toHaveCount(1);
    const topUpLink = upcoming.getByRole("link", {
      name: "Top up",
      exact: true,
    });
    await topUpLink.click();
    const topUp = page.getByRole("dialog", { name: "Top up", exact: true });
    const topUpBackdrop = page
      .getByRole("dialog", { name: "Top up", exact: true })
      .locator('[class~="tw-bg-gray-700/60"]');
    await expect(topUp.getByText(/Top up by/)).toHaveCount(0);
    await expect(topUpBackdrop).toBeVisible();
    await expect(topUpBackdrop).toHaveCSS(
      "background-color",
      "rgba(55, 65, 81, 0.6)"
    );
    await expect(topUpBackdrop).toHaveCSS("opacity", "1");
    await expect(
      topUp.getByRole("heading", { name: "Top up", exact: true })
    ).toBeFocused();
    await expect(
      topUp.getByRole("heading", { name: "Top up", exact: true })
    ).toBeVisible();
    await expect(
      topUp.getByText("Funds 24 intended drops through The Memes #591")
    ).toBeVisible();
    await expect(
      topUp.getByRole("radio", { name: /^Minimum for next drop/ })
    ).toHaveAccessibleDescription(
      /^0.12232 ETH Funds 4 intended drops through The Memes #571$/
    );
    if (page.viewportSize()!.width >= 768) {
      await expectSingleLineLabel(
        topUp.getByText("Recommended", { exact: true })
      );
      await expectSingleLineLabel(
        topUp.getByText("Minimum for next drop", { exact: true })
      );
    }
    await expectSingleLineLabel(
      topUp.getByRole("button", { name: "Choose a top-up amount", exact: true })
    );
    const customCount = topUp.getByRole("spinbutton", {
      name: "Other card count",
    });
    const customInputBox = await customCount.boundingBox();
    expect(customInputBox).not.toBeNull();
    expect(customInputBox!.width).toBeGreaterThanOrEqual(100);
    await customCount.fill("2");
    const customRow = topUp
      .getByRole("radio", { name: "Other", exact: true })
      .locator("../..");
    await expect(customRow).toHaveCSS("border-bottom-left-radius", "12px");
    await expect(customRow).toHaveCSS("border-bottom-right-radius", "12px");
    await expect(topUp.getByRole("status")).toHaveText("0.13058 ETH");
    await expect(topUp.getByText("0.13058 ETH", { exact: true })).toBeVisible();
    await expect(customCount).toHaveAccessibleDescription("0.13058 ETH");
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, testInfo, "subscriptions-custom-preview");
    await customCount.fill("");
    await expect(
      topUp.getByRole("status", { includeHidden: true })
    ).toBeEmpty();
    await topUp.getByRole("radio", { name: /^Recommended/ }).click();
    const recommendedRow = topUp
      .getByRole("radio", { name: /^Recommended/ })
      .locator("../..");
    await expect(recommendedRow).toHaveCSS("border-top-left-radius", "12px");
    await expect(recommendedRow).toHaveCSS("border-top-right-radius", "12px");
    // Each option is now its own card; selection must not square off any corner.
    await expect(recommendedRow).toHaveCSS("border-bottom-left-radius", "12px");
    await expect(recommendedRow).toHaveCSS(
      "border-bottom-right-radius",
      "12px"
    );
    await expect(topUp.getByRole("radio", { name: /^Recommended/ })).toHaveCSS(
      "border-color",
      "rgb(82, 139, 255)"
    );
    await expect(
      topUp.getByText("Funds 24 intended drops through The Memes #591")
    ).toBeVisible();
    await expect(
      topUp.getByRole("button", { name: "Top up 2.73392 ETH" })
    ).toBeVisible();
    await expect(
      topUp.getByRole("radio", { name: /^Recommended/ })
    ).toBeChecked();
    await topUp.getByRole("radio", { name: /^Minimum for next drop/ }).click();
    await expect(
      topUp.getByRole("radio", { name: /^Minimum for next drop/ })
    ).toBeChecked();
    await expect(
      topUp.getByRole("radio", { name: /^Recommended/ })
    ).not.toBeChecked();
    await expect(
      topUp.getByRole("button", { name: "Top up 0.12232 ETH" })
    ).toBeVisible();
    await expect(
      topUp.getByRole("radio", { name: /^Remaining Year/ })
    ).toBeVisible();
    await expect(
      topUp.getByRole("radio", { name: /^Remaining Epoch/ })
    ).toBeVisible();
    const deepTime = topUp.getByRole("button", {
      name: "Show Deep Time Subscriptions",
      exact: true,
    });
    await expect(deepTime).toHaveAttribute("aria-expanded", "false");
    await expect(
      topUp.getByRole("radio", { name: /^Remaining Period/ })
    ).toBeHidden();
    await deepTime.click();
    const deepRows = page
      .getByRole("dialog", { name: "Top up", exact: true })
      .locator("#subscription-top-up-deep-time label");
    await expect(deepRows.first()).toHaveCSS("border-top-left-radius", "12px");
    await expect(deepRows.first()).toHaveCSS("border-top-right-radius", "12px");
    await expect(deepRows.last()).toHaveCSS(
      "border-bottom-left-radius",
      "12px"
    );
    await expect(deepRows.last()).toHaveCSS(
      "border-bottom-right-radius",
      "12px"
    );
    await expect(
      topUp.getByRole("radio", { name: /^Remaining Period/ })
    ).toBeVisible();
    await expect(
      topUp.getByRole("button", {
        name: "Hide Deep Time Subscriptions",
        exact: true,
      })
    ).toHaveAttribute("aria-expanded", "true");
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, testInfo, "subscriptions-top-up");
    await topUp
      .getByRole("button", {
        name: "Hide Deep Time Subscriptions",
        exact: true,
      })
      .click();
    await expect(
      topUp.getByRole("radio", { name: /^Remaining Period/ })
    ).toBeHidden();
    await expect(
      topUp.getByRole("button", { name: "Top up 0.12232 ETH" })
    ).toBeVisible();
    await topUp.getByRole("button", { name: "Close", exact: true }).click();
    await expect(topUp).toBeHidden();
    await expect(topUpLink).toBeFocused();
    // A repeated current-hash link still opens, retaining the selected amount.
    await topUpLink.click();
    await expect(
      topUp.getByRole("radio", { name: /^Minimum for next drop/ })
    ).toBeChecked();
    await topUp
      .getByRole("heading", { name: "Top up", exact: true })
      .press("Escape");
    await expect(topUp).toBeHidden();
    await expect(topUpLink).toBeFocused();
    await topUpButton.click();
    await expect(topUpBackdrop).toBeVisible();
    await expect(topUpBackdrop).toHaveCSS("opacity", "1");
    const surface = page
      .getByRole("dialog", { name: "Top up", exact: true })
      .locator('[id^="headlessui-dialog-panel-"]');
    const viewport = page.viewportSize()!;
    // Wait for the sheet's opening slide before measuring its final position.
    await expect
      .poll(async () => {
        const box = await surface.boundingBox();
        if (!box) return Number.POSITIVE_INFINITY;
        return viewport.width < 768
          ? Math.abs(box.y + box.height - viewport.height)
          : Math.abs(box.x + box.width / 2 - viewport.width / 2);
      })
      .toBeLessThanOrEqual(2);
    const surfaceBox = await surface.boundingBox();
    expect(surfaceBox).not.toBeNull();
    if (viewport.width < 768) {
      expect(
        Math.abs(surfaceBox!.y + surfaceBox!.height - viewport.height)
      ).toBeLessThanOrEqual(2);
      expect(surfaceBox!.width).toBeLessThanOrEqual(viewport.width);
    } else {
      expect(
        Math.abs(surfaceBox!.x + surfaceBox!.width / 2 - viewport.width / 2)
      ).toBeLessThanOrEqual(2);
      expect(surfaceBox!.y).toBeGreaterThan(0);
      expect(surfaceBox!.width).toBeLessThanOrEqual(512);
    }
    await topUp
      .getByRole("heading", { name: "Top up", exact: true })
      .press("Shift+Tab");
    expect(
      await topUp.evaluate((element) =>
        element.contains(document.activeElement)
      )
    ).toBe(true);
    await page.keyboard.press("Tab");
    expect(
      await topUp.evaluate((element) =>
        element.contains(document.activeElement)
      )
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(topUpButton).toBeFocused();
    const detailsButton = page.getByRole("button", {
      name: "Details",
      exact: true,
    });
    await expect(detailsButton).toHaveCount(0);
    await expect(
      overview.getByRole("link", { name: "Choose drops", exact: true })
    ).toHaveCount(0);
    await expect(
      settings.getByText("Oct 2, 2026, 19:03 UTC", { exact: true })
    ).toBeVisible();
    await expect(overview.getByText(/Top up by|Recommended:/)).toHaveCount(0);
    await expect(
      page
        .getByRole("region", { name: "Subscription minting", exact: true })
        .locator("#subscription-coverage-details")
    ).toHaveCount(0);
    await expect(
      overviewActions.getByText("Next unfunded", { exact: true })
    ).toHaveCount(0);
    await expect(
      overviewActions.getByText("Forecast use", { exact: true })
    ).toBeVisible();
    await expect(mode).toBeChecked();
    await expect(mode).toBeEnabled();
    await expect(settings.getByText("Manual", { exact: true })).toHaveCount(0);
    await expect(
      settings.getByText("Automatic", { exact: true })
    ).toBeVisible();
    const editions = settings.getByRole("switch", {
      name: "All eligible editions",
      exact: true,
    });
    await expect(editions).toBeChecked();
    await expect(editions).toBeEnabled();
    await expect(editions).toHaveAccessibleDescription(
      /Eligibility x2 You will receive all editions you are eligible for/
    );
    await mode.focus();
    await expect(mode).toBeFocused();
    await page.keyboard.press("Tab");
    const editionInfo = settings.getByRole("button", {
      name: "Edition Preference",
      exact: true,
    });
    await expect(editionInfo).toBeFocused();
    const editionTooltip = page.getByRole("tooltip", {
      name: "You will receive all editions you are eligible for",
      exact: true,
    });
    await expect(editionTooltip).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(editions).toBeFocused();
    await expect(editionTooltip).toHaveCount(0);
    await expect(
      settings
        .getByRole("switch", { name: "All eligible editions", exact: true })
        .locator("+ span")
    ).not.toHaveCSS("box-shadow", "none");
    await expect(
      settings.getByText("One edition", { exact: true })
    ).toHaveCount(0);
    await expectSingleLineLabel(
      settings.getByText("All eligible", { exact: true })
    );
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(
      page,
      testInfo,
      "subscriptions-settings-toggles"
    );
    await expect(
      page.getByRole("button", { name: address, exact: true })
    ).toBeVisible();
    // The same histories and pagination remain usable in the mobile sheet.
    await page.setViewportSize({ width: 390, height: 900 });
    const historyOpener = page.getByRole("button", {
      name: "Subscription History",
      exact: true,
    });
    await historyOpener.click();
    await expect(
      page.getByRole("dialog", { name: "Subscription History", exact: true })
    ).toBeVisible();
    await expectSingleLineLabel(
      page.getByRole("tab", { name: "Top Up History", exact: true })
    );
    for (const title of ["Redeemed", "Log History", "Top Up History"]) {
      const tab = page.getByRole("tab", { name: title, exact: true });
      await expectSingleLineLabel(tab);
      await tab.click();
      const panel = page.getByRole("tabpanel", { name: title, exact: true });
      await expect(panel).toBeVisible();
      if (title === "Redeemed") {
        if (page.viewportSize()!.width < 768) {
          const addressLine = await page
            .getByRole("tabpanel", { name: title, exact: true })
            .locator("p")
            .filter({ hasText: /^Airdrop Address:/ })
            .first()
            .boundingBox();
          const balanceLine = await page
            .getByRole("tabpanel", { name: title, exact: true })
            .locator("p")
            .filter({ hasText: /^Balance after redemption:/ })
            .first()
            .boundingBox();
          expect(addressLine).not.toBeNull();
          expect(balanceLine).not.toBeNull();
          expect(balanceLine!.y).toBeGreaterThanOrEqual(
            addressLine!.y + addressLine!.height
          );
        }
        const transaction = panel
          .getByRole("link", { name: "View transaction on Etherscan" })
          .first();
        const transactionTarget = await transaction.boundingBox();
        const transactionVisual = await panel
          .getByRole("link", { name: "View transaction on Etherscan" })
          .first()
          .locator("span[aria-hidden=true]")
          .boundingBox();
        expect(transactionTarget).not.toBeNull();
        expect(transactionVisual).not.toBeNull();
        expect(transactionTarget!.width).toBeGreaterThanOrEqual(44);
        expect(transactionTarget!.height).toBeGreaterThanOrEqual(44);
        expect(transactionVisual!.width).toBeLessThan(transactionTarget!.width);
        expect(transactionVisual!.height).toBeLessThan(
          transactionTarget!.height
        );
        await transaction.focus();
        await expect(
          page.getByRole("tooltip", { name: "View transaction on Etherscan" })
        ).toBeVisible();
        await expect(transaction).toHaveAttribute(
          "href",
          /^https:\/\/etherscan\.io\/tx\//
        );
        await expect(transaction).toHaveAttribute("target", "_blank");
      }
      await panel.getByRole("button", { name: "Next page" }).click();
      await expect(
        panel.getByRole("textbox", { name: "Page number" })
      ).toHaveValue("2");
      await expect(panel).toBeFocused();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(tab).toBeInViewport();
      await expect(
        page.getByRole("heading", { name: "Subscription History", exact: true })
      ).toBeInViewport();
      await expectNoHorizontalOverflow(page);
    }
    await page.getByRole("tab", { name: "Log History", exact: true }).click();
    await expect(
      page.getByText(
        "Added to Final Subscription for Meme #568 on 2026-10-30",
        { exact: true }
      )
    ).toBeVisible();
    await captureSafeScreenshot(
      page,
      testInfo,
      "subscriptions-details-history"
    );
    await page
      .getByRole("dialog", { name: "Subscription History", exact: true })
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await expect(historyOpener).toBeFocused();
    await historyOpener.click();
    await expect(
      page.getByRole("tab", { name: "Log History", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("textbox", { name: "Page number" })
    ).toHaveValue("2");
    await page.setViewportSize(ownerViewport);
    await expect(
      page.getByRole("dialog", { name: "Subscription History", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Page number" })
    ).toHaveValue("2");
  });

  test("renders the own-profile proxy shell without creating a proxy", async ({
    page,
  }) => {
    const path = `${PROFILE_BASE_PATH}/proxy`;
    // Synthetic rows exercise narrow layouts and owner controls without writes.
    await page.route(
      (url) => /\/proxies(?:\/|$)/.test(url.pathname),
      async (route) => {
        if (route.request().method() !== "GET") {
          await route.abort("blockedbyclient");
          return;
        }
        const url = new URL(route.request().url());
        if (!/\/profiles\/[^/]+\/proxies\/?$/.test(url.pathname)) {
          await route.fallback();
          return;
        }
        url.pathname = url.pathname.replace(
          /\/profiles\/[^/]+\/proxies\/?$/,
          `/identities/${encodeURIComponent(PROFILE_HANDLE)}`
        );
        const identityResponse = await route.fetch({ url: url.toString() });
        expect(identityResponse.ok()).toBe(true);
        const identity: { id: string } = await identityResponse.json();
        expect(typeof identity.id).toBe("string");
        const owner = { id: identity.id, handle: PROFILE_HANDLE, pfp: null };
        const peer = {
          id: "proxy-layout-peer",
          handle: "proxy_layout_fixture",
          pfp: null,
        };
        const startTime = Date.now() - 86400000;
        const fixtures = [
          { id: "proxy-layout-received", created_by: peer, granted_to: owner },
          { id: "proxy-layout-granted", created_by: owner, granted_to: peer },
        ].map((proxy) => ({
          ...proxy,
          created_at: startTime,
          actions: [
            {
              id: `${proxy.id}-action`,
              proxy_id: proxy.id,
              action_type: "ALLOCATE_REP",
              credit_amount: 123456789,
              credit_spent: 12345678,
              start_time: startTime,
              end_time: startTime + 2592000000,
              created_at: startTime,
              accepted_at: null,
              rejected_at: null,
              revoked_at: null,
              is_active: true,
            },
          ],
        }));
        await route.fulfill({ json: fixtures });
      }
    );

    await gotoReady(page, path);

    await expectProfileShell(page, "Proxy");
    const filters = page.getByRole("tablist", { name: "Proxy Type" });
    await expect(filters).toBeVisible();
    for (const name of ["All", "Received", "Granted"]) {
      const tab = filters.getByRole("tab", { name, exact: true });
      await expect(tab).toBeInViewport({ ratio: 1 });
      await expect(tab).toHaveCSS("font-size", "13px");
    }
    await expect(
      filters.getByRole("tab", { name: "All", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByText("Received proxies", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Granted proxies", { exact: true })
    ).toBeVisible();
    await filters.getByRole("tab", { name: "Received", exact: true }).click();
    await expect(
      page.getByText("Received proxies", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Granted proxies", { exact: true })
    ).toHaveCount(0);
    await filters
      .getByRole("tab", { name: "Received", exact: true })
      .press("ArrowRight");
    await expect(
      filters.getByRole("tab", { name: "Granted", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByText("Granted proxies", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Received proxies", { exact: true })
    ).toHaveCount(0);
    await filters
      .getByRole("tab", { name: "Granted", exact: true })
      .press("Home");
    await expect(
      page.getByText("Received proxies", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Granted proxies", { exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const rows = page.getByRole("main").locator("[data-proxy-action-row]");
    await expect(rows).toHaveCount(2);
    const initialViewport = page.viewportSize()!;
    for (const width of [390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await expectNoHorizontalOverflow(page);
      for (const key of ["Home", "End", "Home"]) {
        await filters.getByRole("tab", { selected: true }).press(key);
        const focused = filters.getByRole("tab").locator(":scope:focus");
        await expect
          .poll(() =>
            focused.evaluate((element) => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              const clip = element
                .closest('[role="tablist"]')!
                .getBoundingClientRect();
              const extent = Math.max(
                0,
                parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)
              );
              return (
                style.outlineStyle !== "none" &&
                extent > 0 &&
                rect.left - extent >= clip.left &&
                rect.top - extent >= clip.top &&
                rect.right + extent <= clip.right &&
                rect.bottom + extent <= clip.bottom
              );
            })
          )
          .toBe(true);
      }
      for (const row of await rows.all()) {
        await expect
          .poll(() =>
            row.evaluate((element) => {
              const cells = Array.from(element.children).filter(
                (cell): cell is HTMLElement => cell instanceof HTMLElement
              );
              return cells.every(
                (cell) => cell.scrollWidth <= cell.clientWidth + 1
              );
            })
          )
          .toBe(true);
      }
    }
    await page.setViewportSize(initialViewport);
  });

  // Plans now require a session; retain the layout contract in the authenticated pack.
  for (const width of [320, 768, 1440]) {
    test(`contains long plan text and controls at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.route(
        (url) => url.pathname === "/allowlists",
        async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill({ json: [plan] });
          } else {
            await route.abort("blockedbyclient");
          }
        }
      );

      await page.goto("/emma/plans", { waitUntil: "domcontentloaded" });
      const table = page.getByRole("table");
      await expect(
        table.getByRole("cell", { name: plan.name, exact: true })
      ).toBeVisible();
      await expect(table.getByRole("columnheader")).toHaveCount(4);
      await expect(table.getByRole("row")).toHaveCount(2);
      await expect(table.getByRole("cell")).toHaveCount(4);
      await expect(
        page.getByRole("button", { name: "Create new", exact: true })
      ).toBeInViewport({ ratio: 1 });
      await expectNoHorizontalOverflow(page);

      // The page wrapper clips overflow, so document width alone cannot catch
      // a table or cell extending beyond its visible container.
      const geometry = await table.evaluate((element) => {
        const tableBounds = element.getBoundingClientRect();
        const cells = Array.from(element.querySelectorAll("tbody td"));
        return {
          left: tableBounds.left,
          right: tableBounds.right,
          viewportWidth: document.documentElement.clientWidth,
          cells: cells.map((cell) => {
            const bounds = cell.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(cell);
            const lines = Array.from(range.getClientRects());
            return {
              contained: lines.every(
                (line) =>
                  line.left >= bounds.left - 1 && line.right <= bounds.right + 1
              ),
              lineCount: lines.length,
              left: bounds.left,
              right: bounds.right,
              textLeft: Math.min(...lines.map((line) => line.left)),
              textRight: Math.max(...lines.map((line) => line.right)),
            };
          }),
        };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
      await testInfo.attach("EMMA plans layout", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
      expect(
        geometry.cells.every((cell) => cell.contained),
        JSON.stringify(geometry)
      ).toBe(true);
      // These cells render the fixture as inline text, with one rect per line.
      expect(geometry.cells[0]?.lineCount).toBeGreaterThan(1);
      expect(geometry.cells[1]?.lineCount).toBeGreaterThan(1);
      const deleteButton = table.getByRole("button", {
        name: "Delete",
        exact: true,
      });
      await deleteButton.scrollIntoViewIfNeeded();
      await expect(deleteButton).toBeInViewport({ ratio: 1 });
    });
  }
});
