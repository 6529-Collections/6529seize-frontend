import type { ApiSubscriptionCoverage } from "../../generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageMode as Mode } from "../../generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageStatus as Status } from "../../generated/models/ApiSubscriptionCoverageStatus";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  hideNextDevOverlay,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { RESPONSE_TIMEOUT_MS } from "../support/routeReadiness";
import {
  installSubscriptionFixtures,
  subscriptionCoverageFixture,
} from "../support/subscriptionFixtures";

const phase = process.env["SUBSCRIPTION_AUDIT_PHASE"] ?? "after";
const fullAudit = Boolean(process.env["SUBSCRIPTION_AUDIT_PHASE"]);
const point = (token_id: number) => ({
  token_id,
  mint_at: new Date(Date.UTC(2026, 10, 16 + (token_id - 575) * 2, 15, 40)),
});
const unfunded = (
  token_id: number,
  deadline: string | null = "2026-11-17T14:30:00Z"
) => ({
  ...subscriptionCoverageFixture().next_unfunded!,
  ...point(token_id),
  top_up_deadline: deadline ? new Date(deadline) : null,
});
const states: ReadonlyArray<
  readonly [string, Partial<ApiSubscriptionCoverage> | "loading" | "error"]
> = [
  [
    "not-set-up",
    {
      status: Status.NotSetUp,
      mode: null,
      balance_eth: "0",
      mint_capacity: 0,
      allocated_mints: 0,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: null,
    },
  ],
  [
    "no-eligibility",
    {
      status: Status.NoCurrentEligibility,
      eligibility_count: 0,
      allocated_mints: 0,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: null,
    },
  ],
  [
    "no-selections",
    {
      status: Status.NoUpcomingSelections,
      mode: Mode.Manual,
      allocated_mints: 0,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: null,
    },
  ],
  [
    "covered",
    {
      subscribe_all_editions: true,
      eligibility_count: 3,
      status: Status.Covered,
      fully_funded_drops: 8,
      funded_through: point(582),
      next_unfunded: null,
    },
  ],
  [
    "plan-top-up",
    {
      status: Status.EarlyWarning,
      fully_funded_drops: 5,
      funded_through: point(579),
      next_unfunded: unfunded(580, "2026-11-27T14:30:00Z"),
    },
  ],
  [
    "running-low",
    {
      status: Status.RunningLow,
      fully_funded_drops: 2,
      funded_through: point(576),
      next_unfunded: unfunded(577, "2026-11-20T14:30:00Z"),
    },
  ],
  [
    "zero-funded",
    {
      status: Status.ActionRequired,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: unfunded(575, "2026-11-16T14:30:00Z"),
    },
  ],
  [
    "one-funded",
    {
      status: Status.ActionRequired,
      fully_funded_drops: 1,
      funded_through: point(575),
      next_unfunded: unfunded(576),
    },
  ],
  [
    "zoku-manual",
    {
      status: Status.ActionRequired,
      mode: Mode.Manual,
      subscribe_all_editions: false,
      eligibility_count: 1,
      fully_funded_drops: 1,
      mint_capacity: 1,
      allocated_mints: 1,
      balance_eth: "0.06529",
      funded_through: point(575),
      next_unfunded: null,
      minimum_top_up: null,
      recommended_top_up: null,
    },
  ],
  [
    "no-deadline",
    {
      status: Status.ActionRequired,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: unfunded(575, null),
    },
  ],
  [
    "unknown",
    {
      status: Status.Unknown,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: null,
    },
  ],
  [
    "mint-paid",
    {
      status: Status.ActionRequired,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: unfunded(575, null),
    },
  ],
  [
    "mint-payment-error",
    {
      status: Status.ActionRequired,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: unfunded(575, null),
    },
  ],
  [
    "mint-payment-loading",
    {
      status: Status.ActionRequired,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: unfunded(575, null),
    },
  ],
  ["loading", "loading"],
  ["api-error", "error"],
];

function coverageFor(overrides: Partial<ApiSubscriptionCoverage>) {
  const funded = overrides.fully_funded_drops ?? 0;
  const eligibility = overrides.eligibility_count ?? 1;
  const perDrop = overrides.subscribe_all_editions ? eligibility : 1;
  const next = overrides.next_unfunded ?? null;
  return subscriptionCoverageFixture({
    calculated_at: new Date("2026-11-16T10:00:00Z"),
    eligibility_count: eligibility,
    subscribe_all_editions: false,
    balance_eth: (funded * perDrop * 0.06529).toFixed(5),
    mint_capacity: funded * perDrop,
    allocated_mints: funded * perDrop,
    minimum_top_up: null,
    recommended_top_up: null,
    ...overrides,
    next_unfunded: next
      ? {
          ...next,
          requested_mints: perDrop,
          funded_mints: 0,
          missing_mints: perDrop,
          required_eth: (perDrop * 0.06529).toFixed(5),
          shortfall_eth: (perDrop * 0.06529).toFixed(5),
        }
      : null,
  });
}

test.describe("Subscription status sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Requires the local subscription sandbox."
  );
  for (const owner of [true, false]) {
    test(`keeps subscription states clear as ${owner ? "owner" : "visitor"}`, async ({
      page,
      context,
    }, testInfo) => {
      test.setTimeout(240000);
      await hideNextDevOverlay(context);
      await page.clock.setFixedTime(new Date("2026-11-16T10:00:00Z"));
      await page.addInitScript(
        ({ owner }) => {
          document.cookie = "essential-cookies-consent=true; path=/";
          document.cookie = "performance-cookies-consent=false; path=/";
          if (!owner) return;
          const address = "0x0000000000000000000000000000000000000529";
          const token = [
            btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
            btoa(JSON.stringify({ sub: address, exp: 2000000000 })),
            "",
          ].join(".");
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
                profileId: "00000000-0000-4000-8000-000000000531",
                profileHandle: "playwright",
              },
            ])
          );
        },
        { owner }
      );
      await installSubscriptionFixtures(page);
      let current: (typeof states)[number][1] = states[0]![1];
      await page.route(
        (url) =>
          url.pathname.includes("/subscriptions/consolidation/coverage/"),
        async (route) => {
          if (current === "loading") return;
          if (current === "error") {
            await route.fulfill({
              status: 503,
              json: { error: "Unavailable" },
            });
            return;
          }
          await route.fulfill({ json: coverageFor(current) });
        }
      );
      await page.route(
        (url) => url.pathname.includes("/subscriptions/consolidation/details/"),
        async (route) => {
          const coverage = coverageFor(
            typeof current === "string" ? {} : current
          );
          await route.fulfill({
            json: {
              balance: Number(coverage.balance_eth),
              automatic: coverage.mode === Mode.Automatic,
              subscribe_all_editions: coverage.subscribe_all_editions,
              subscription_eligibility_count: coverage.eligibility_count,
              last_update: Date.parse("2026-11-16T09:00:00Z"),
            },
          });
        }
      );
      await page.route(
        (url) =>
          url.pathname.includes("/subscriptions/consolidation/upcoming-memes/"),
        async (route) => {
          const coverage = coverageFor(
            typeof current === "string" ? {} : current
          );
          await route.fulfill({
            json: [575, 576, 577, 578, 579].map((token_id) => ({
              token_id,
              contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
              subscribed:
                coverage.status !== Status.NoUpcomingSelections &&
                (coverage.mode !== Mode.Manual || token_id === 575),
              subscribed_count: coverage.subscribe_all_editions
                ? coverage.eligibility_count
                : 1,
            })),
          });
        }
      );
      await page.route(
        (url) => url.pathname.includes("/subscriptions/consolidation/final/"),
        async (route) => {
          const activeName = states.find(([, data]) => data === current)?.[0];
          if (activeName === "mint-payment-loading") return;
          if (activeName === "mint-payment-error") {
            await route.fulfill({
              status: 503,
              json: { error: "Unavailable" },
            });
            return;
          }
          if (activeName === "mint-paid") {
            await route.fulfill({
              json: {
                consolidation_key: "profile-key",
                contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
                token_id: 575,
                subscribed_count: 1,
                redeemed_count: 1,
                balance: 0.06529,
                phase: "Phase 0",
                phase_position: 67,
                phase_subscriptions: 100,
                airdrop_address: "0x0000000000000000000000000000000000000529",
              },
            });
          } else {
            await route.fulfill({ status: 404, json: { error: "Not found" } });
          }
        }
      );
      const subscriptionReads: string[] = [];
      page.on("request", (request) => {
        if (
          new URL(request.url()).pathname.includes(
            "/subscriptions/consolidation/"
          )
        )
          subscriptionReads.push(request.url());
      });
      if (testInfo.project.name === "capacitor-ios-sim") {
        await page.goto("/playwright/subscriptions");
        await expect(page).toHaveURL(/\/playwright$/, {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
        });
        await expect(
          page.getByRole("region", {
            name: "Subscription minting",
            exact: true,
          })
        ).toHaveCount(0);
        expect(subscriptionReads).toEqual([]);
        await page
          .getByRole("navigation", { name: "Profile sections", exact: true })
          .screenshot({
            path: testInfo.outputPath(
              `${phase}-ios-gate-${owner ? "owner" : "visitor"}.png`
            ),
          });
        return;
      }
      const onlyState = process.env["SUBSCRIPTION_AUDIT_STATE"];
      const cases = onlyState
        ? states.filter(([name]) => name === onlyState)
        : fullAudit
          ? states
          : states.filter(([name]) =>
              [
                "not-set-up",
                "no-selections",
                "zero-funded",
                "mint-paid",
                "mint-payment-error",
                "mint-payment-loading",
                "zoku-manual",
                "unknown",
                "loading",
                "api-error",
              ].includes(name)
            );
      for (const [name, data] of cases) {
        current = data;
        const loading = data === "loading" || name === "mint-payment-loading";
        await page.goto("/playwright/subscriptions", {
          waitUntil: "domcontentloaded",
          timeout: 120000,
        });
        const overview = page
          .getByRole("region", { name: "Subscription minting", exact: true })
          .locator("#profile-subscriptions-overview");
        await expect(overview).toBeVisible({ timeout: 60000 });
        if (loading)
          await expect(
            overview.getByRole("heading", {
              name: "Loading subscription coverage",
            })
          ).toBeVisible();
        else if (data === "error")
          await expect(
            overview.getByRole("heading", { name: "Coverage unavailable" })
          ).toBeVisible();
        else {
          const headline = overview.getByRole("heading", { level: 2 });
          await expect(headline).toBeVisible();
          await expect(headline).not.toHaveText(
            "Loading subscription coverage",
            { timeout: RESPONSE_TIMEOUT_MS }
          );
          if (name === "mint-paid")
            await expect(headline).toHaveText("Subscription paid");
          await expect(
            overview.getByText("Forecast use", { exact: true })
          ).toBeVisible();
        }
        if (!loading)
          await expect(
            overview.getByRole("button", { name: "Top up", exact: true })
          ).toHaveCount(owner ? 1 : 0);
        if (!loading)
          await expect(
            page
              .getByRole("region", {
                name: "Subscription minting",
                exact: true,
              })
              .locator('#profile-subscriptions-overview [aria-busy="true"]')
          ).toHaveCount(0, { timeout: RESPONSE_TIMEOUT_MS });
        await expectNoHorizontalOverflow(page);
        await overview.screenshot({
          path: testInfo.outputPath(
            `${phase}-${owner ? "owner" : "visitor"}-${name}.png`
          ),
          animations: "disabled",
        });
        if (name === "zoku-manual")
          await page.screenshot({
            path: testInfo.outputPath(
              `${phase}-${owner ? "owner" : "visitor"}-full-page.png`
            ),
            fullPage: true,
            animations: "disabled",
          });
      }
      if (phase === "before") return;
      current = states.find(([name]) => name === "zoku-manual")![1];
      await page.goto("/playwright/subscriptions");
      const overview = page
        .getByRole("region", { name: "Subscription minting", exact: true })
        .locator("#profile-subscriptions-overview");
      await expect(
        overview.getByText("All selected drops in this forecast are funded.")
      ).toBeVisible();
      const forecast = overview.getByRole("button", {
        name: "Forecast use",
        exact: true,
      });
      await forecast.focus();
      await forecast.press("Enter");
      const tooltip = page
        .getByRole("tooltip")
        .filter({ hasText: "Projected from current eligibility" });
      await expect(tooltip).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(tooltip).toBeHidden();
      if (testInfo.project.use.hasTouch) {
        await forecast.tap();
        await expect(tooltip).toBeVisible();
        await overview.getByRole("heading", { name: "1 drop funded" }).tap();
        await expect(tooltip).toBeHidden();
      }
      await forecast.hover();
      await expect(tooltip).toBeVisible();
      await tooltip.screenshot({
        path: testInfo.outputPath("forecast-tooltip.png"),
      });
      await page.keyboard.press("Escape");
      if (owner) {
        const topUp = overview.getByRole("button", {
          name: "Top up",
          exact: true,
        });
        await topUp.focus();
        await expect(topUp).toBeFocused();
        await topUp.press("Enter");
        const dialog = page.getByRole("dialog", {
          name: "Top up",
          exact: true,
        });
        await expect(
          dialog.getByRole("heading", { name: "Top up", exact: true })
        ).toBeVisible();
        await expect(
          dialog.getByRole("button", {
            name: "Choose a top-up amount",
            exact: true,
          })
        ).toBeDisabled();
        await dialog.getByRole("radio", { name: "Other", exact: true }).check();
        await dialog.getByRole("spinbutton").fill("2");
        await expect(
          dialog.getByRole("button", { name: /Top up 0.13058 ETH/ })
        ).toBeVisible();
        await page.getByRole("dialog", { name: "Top up", exact: true }).locator('[id^="headlessui-dialog-panel-"]').screenshot({
          path: testInfo.outputPath("top-up-options.png"),
        });
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(topUp).toBeFocused();
      }
      await expectAxeClean(page, {
        include: ["#profile-subscriptions-overview"],
      });
      current = "error";
      await page.clock.setFixedTime(new Date("2026-11-16T10:02:00Z"));
      await page.evaluate(() => {
        window.dispatchEvent(new Event("offline"));
        window.dispatchEvent(new Event("online"));
      });
      const notice = page
        .getByRole("status")
        .filter({ hasText: "Last known coverage" });
      await expect(notice).toBeVisible();
      await expect(
        notice.getByRole("button", { name: "Refresh coverage" })
      ).toHaveCount(owner ? 1 : 0);
      await notice.screenshot({
        path: testInfo.outputPath(`stale-${owner ? "owner" : "visitor"}.png`),
      });
      if (owner) {
        current = states.find(([name]) => name === "zoku-manual")![1];
        await notice.getByRole("button", { name: "Refresh coverage" }).click();
        await expect(notice).toBeHidden();
      }
      for (const width of [320, 768, 1023, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expectNoHorizontalOverflow(page);
        await expect(
          overview.getByRole("heading", { name: "1 drop funded" })
        ).toBeVisible();
      }
    });
  }
});
