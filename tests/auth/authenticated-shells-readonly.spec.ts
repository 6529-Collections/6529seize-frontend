import type { Locator, Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

const DEV_AUTH_SKIP_MESSAGE =
  "Authenticated shell E2E requires USE_DEV_AUTH=true, DEV_MODE_WALLET_ADDRESS, DEV_MODE_AUTH_JWT, and PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE.";
const PROFILE_HANDLE = process.env["PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE"] ?? "";
const PROFILE_BASE_PATH = `/${PROFILE_HANDLE}`;
const WALLET_GATE_HEADING =
  "This content is only available to connected wallets.";
const WALLET_GATE_COPY = "Connect your wallet to continue.";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasDevAuthConfig() {
  return (
    process.env["USE_DEV_AUTH"] === "true" &&
    Boolean(process.env["DEV_MODE_WALLET_ADDRESS"]) &&
    Boolean(process.env["DEV_MODE_AUTH_JWT"]) &&
    Boolean(PROFILE_HANDLE)
  );
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

  test("renders direct messages without falling back to the wallet gate", async ({
    page,
  }) => {
    await gotoReady(page, "/messages", { readySelector: "#messages-content" });

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
            .first(),
        },
      ],
      "the authenticated messages shell"
    );
  });

  test("renders the own-profile subscriptions shell read-only", async ({
    page,
  }) => {
    const path = `${PROFILE_BASE_PATH}/subscriptions`;

    await gotoReady(page, path);

    await expectProfileShell(page, "Subscriptions");
    await expect(
      page.getByRole("heading", { name: "Subscribe" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Learn More" })
    ).toHaveAttribute("href", "/about/subscriptions");
    await expect(page.getByText("Current Balance")).toBeVisible();
    await expect(page.getByText("Airdrop Address")).toBeVisible();
    await expect(page.getByText("Mode")).toBeVisible();
    await expect(page.getByText("Edition Preference")).toBeVisible();
    await expect(page.getByText("Upcoming Drops")).toBeVisible();
    await expect(page.getByText("Subscription History")).toBeVisible();
  });

  test("renders the own-profile proxy shell without creating a proxy", async ({
    page,
  }) => {
    const path = `${PROFILE_BASE_PATH}/proxy`;

    await gotoReady(page, path);

    await expectProfileShell(page, "Proxy");
    await expectAnyVisible(
      [
        {
          label: "desktop proxy type tabs",
          locator: page.getByRole("tablist", { name: "Proxy Type" }),
        },
        {
          label: "mobile proxy type menu",
          locator: page.getByRole("button", { name: /Proxy Type: All/i }),
        },
      ],
      "the proxy type controls"
    );
    await expect(
      page.getByText("Received proxies", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Granted proxies", { exact: true })
    ).toBeVisible();
  });
});
