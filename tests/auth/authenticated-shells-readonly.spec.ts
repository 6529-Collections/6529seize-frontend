import type { Locator, Page } from "@playwright/test";

import {
  captureSafeScreenshot,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

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
            .first(),
        },
      ],
      "the authenticated messages shell"
    );
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

  test("scrolls to and focuses the top-up section from the notification link", async ({
    page,
  }) => {
    const path = `${PROFILE_BASE_PATH}/subscriptions`;
    const hash = "#profile-subscriptions-top-up";

    // The section mounts after hydration, so the browser's own hash scroll
    // finds nothing. Read-only: navigates and observes, never submits.
    await page.goto(`${path}${hash}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(page).toHaveURL(
      (url) => url.pathname === path && url.hash === hash
    );

    const topUp = page.getByRole("region", { name: "Top up" });
    const heading = page.getByRole("heading", { level: 2, name: "Top up" });
    await expect(topUp).toHaveAttribute("id", hash.slice(1));
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
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
