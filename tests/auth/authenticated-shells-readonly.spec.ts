import type { Locator, Page } from "@playwright/test";

import {
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

  test("renders the protected Sentry snapshot without overflowing the route shell", async ({
    page,
  }) => {
    const issue = {
      id: "123",
      short_id: "WEB-123",
      project: "frontend",
      title: `TypeError: ${"LongErrorIdentifier".repeat(8)}`,
      occurrences: 1234,
      level: "error",
      priority: "high",
      state: "ongoing",
      first_seen: "2026-10-07T12:00:00Z",
      last_seen: "2026-10-08T09:00:00Z",
      url: "https://sentry.io/organizations/test-team/issues/123/",
    };
    await page.route("**/api/monitoring/sentry", async (route) => {
      await route.fulfill({
        json: {
          status: "ready",
          environment: "production",
          period: "24h",
          fetched_at: "2026-10-08T10:00:00Z",
          window_start: "2026-10-07T10:00:00Z",
          window_end: "2026-10-08T10:00:00Z",
          projects: [
            {
              project: "frontend",
              new_issues: [issue],
              top_issues: [issue],
              new_issues_has_more: false,
              top_issues_has_more: false,
              high_priority: {
                issues: [issue],
                count: 9,
                count_exact: true,
                has_more: true,
              },
              regressed: {
                issues: [],
                count: 0,
                count_exact: true,
                has_more: false,
              },
              escalating: {
                issues: [],
                count: 0,
                count_exact: true,
                has_more: false,
              },
              new_issues_total: 1,
              new_issues_count_exact: true,
              event_trend: { current_events: 1234, previous_events: 2000 },
            },
            {
              project: "seize-backend",
              new_issues: [],
              top_issues: [
                {
                  ...issue,
                  id: "456",
                  short_id: "SEIZE-BACKEND-Y6",
                  project: "seize-backend",
                  title: "Market refresh failed",
                  occurrences: 2,
                },
              ],
              new_issues_has_more: false,
              top_issues_has_more: false,
              high_priority: {
                issues: [
                  {
                    ...issue,
                    id: "456",
                    project: "seize-backend",
                    title: "Market refresh failed",
                    occurrences: 2,
                  },
                ],
                count: 1,
                count_exact: true,
                has_more: false,
              },
              regressed: {
                issues: [],
                count: 0,
                count_exact: true,
                has_more: false,
              },
              escalating: {
                issues: [],
                count: 0,
                count_exact: true,
                has_more: false,
              },
              new_issues_total: 0,
              new_issues_count_exact: true,
              event_trend: { current_events: 2, previous_events: 3 },
            },
          ],
        },
      });
    });
    await page.route("**/api/monitoring/sentry/history", async (route) => {
      await route.fulfill({
        json: {
          status: "ready",
          environment: "production",
          period: "30d",
          timezone: "UTC",
          projects: ["frontend", "seize-backend"].map((project, index) => ({
            project,
            days: Array.from({ length: 30 }, (_, day) => ({
              date: new Date(Date.UTC(2026, 8, 8 + day))
                .toISOString()
                .slice(0, 10),
              events: index === 0 && day === 4 ? null : (day + 1) * (index + 1),
              issues: index === 0 && day === 4 ? null : index + 1,
            })),
          })),
        },
      });
    });
    await gotoReady(page, "/tools/monitoring");
    const history = page.getByRole("region", {
      name: "Daily history · 30 days",
      exact: true,
    });
    const chart = history.getByRole("img");
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAccessibleName(
      /Daily Error occurrences by project/
    );
    expect(
      await chart.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeGreaterThan(0);
    const issuesMetric = history.getByRole("button", {
      name: "Distinct issues",
      exact: true,
    });
    await issuesMetric.focus();
    await issuesMetric.press("Enter");
    await expect(issuesMetric).toHaveAttribute("aria-pressed", "true");
    await expect(chart).toHaveAccessibleName(
      /Daily Distinct issues by project/
    );
    await history.getByText("Daily counts", { exact: true }).press("Enter");
    const historyTable = history.getByRole("table", {
      name: "frontend",
      exact: true,
    });
    await expect(historyTable).toBeVisible();
    await expect(historyTable.getByRole("row")).toHaveCount(31);
    await expect(
      historyTable.getByRole("row", {
        name: "Sep 12 Unavailable Unavailable",
        exact: true,
      })
    ).toBeVisible();
    await expect(history.getByRole("status")).toContainText(
      "Gaps mean unavailable data"
    );
    await expectNoHorizontalOverflow(page);
    await history.getByText("Daily counts", { exact: true }).press("Enter");
    await expect(
      page.getByRole("region", { name: "Captured events · 24h", exact: true })
    ).toContainText("1,236");
    await expect(
      page.getByRole("region", { name: "Captured events · 24h", exact: true })
    ).toContainText("Down 38.3%");
    await expect(
      page.getByText("Needs attention", { exact: true }).locator("..")
    ).toContainText("10");
    await expect(
      page.getByText("What changed", { exact: true }).locator("..")
    ).toContainText("1 new · 0 returned · 0 spiking");
    await expect(
      page
        .getByRole("heading", { name: "Most frequent unresolved errors" })
        .first()
    ).not.toBeVisible();
    await page
      .getByText("Needs attention", { exact: true })
      .locator("..")
      .press("Enter");
    await expect(
      page.getByRole("region", {
        name: "seize-backend · High-priority issues",
        exact: true,
      })
    ).toContainText("Market refresh failed");
    await expectNoHorizontalOverflow(page);
    await page
      .getByText("Needs attention", { exact: true })
      .locator("..")
      .press("Enter");
    await page.getByText("What changed", { exact: true }).click();
    await expect(
      page.getByRole("region", {
        name: "frontend · Newly seen errors",
        exact: true,
      })
    ).toContainText(issue.title);
    await expectNoHorizontalOverflow(page);
    await page.getByText("What changed", { exact: true }).click();
    await page.getByText("All issue details", { exact: true }).click();
    await expect(
      page
        .getByRole("region", { name: "frontend", exact: true })
        .getByRole("heading", {
          name: "Most frequent unresolved errors",
          exact: true,
        })
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "frontend", exact: true })
        .getByText("1,234 events in this window")
    ).toHaveCount(2);
    await expect(
      page
        .getByRole("link", {
          name: `Open ${issue.title} in Sentry (opens in a new tab)`,
        })
        .first()
    ).toHaveAttribute("href", issue.url);
    await expect(page.getByText(/Snapshot collected/)).toContainText("UTC");
    await expect(
      page.getByRole("region", { name: "seize-backend", exact: true })
    ).toContainText("Market refresh failed");
    await expectNoHorizontalOverflow(page);
  });

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

  test("opens the existing consolidation form from the own-profile wallet entry", async ({
    page,
  }) => {
    await gotoReady(page, PROFILE_BASE_PATH);
    await expectProfileShell(page, "Identity");
    const statements = page.getByRole("button", { name: /ID Statements/i });
    if (await statements.isVisible()) {
      await statements.click();
    }

    await expect(
      page.getByRole("link", { name: "Wallet Checker" })
    ).toBeVisible();
    const addWallet = page.getByRole("link", {
      name: "Add another wallet",
      exact: true,
    });
    await expect(addWallet).toBeVisible();
    await expect(addWallet).toHaveAttribute(
      "href",
      "/delegation/register-consolidation"
    );
    await addWallet.click();

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === "/delegation/register-consolidation" &&
        url.search === ""
    );
    await expect(
      page.getByRole("heading", { name: "Register Consolidation", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Two wallets · two registrations" })
    ).toBeVisible();
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
