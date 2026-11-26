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
const SUBSCRIPTION_PROFILE_KEY = "0x0000000000000000000000000000000000000529";
const SUBSCRIPTION_CONTRACT = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
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
  requested_mints: 1,
  funded_mints: 0,
  missing_mints: 1,
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
    "partial-editions",
    {
      status: Status.ActionRequired,
      fully_funded_drops: 0,
      funded_through: null,
      eligibility_count: 3,
      subscribe_all_editions: true,
      balance_eth: "0.06529",
      mint_capacity: 1,
      allocated_mints: 1,
      next_unfunded: {
        ...unfunded(575, "2026-11-16T14:30:00Z"),
        requested_mints: 3,
        funded_mints: 1,
        missing_mints: 2,
      },
    },
  ],
  [
    "deadline-passed",
    {
      calculated_at: new Date("2026-11-16T14:31:00Z"),
      status: Status.ActionRequired,
      fully_funded_drops: 0,
      funded_through: null,
      next_unfunded: unfunded(575, "2026-11-16T14:30:00Z"),
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
  [
    "forecast-cap",
    {
      status: Status.Covered,
      fully_funded_drops: 24,
      funded_through: point(598),
      next_unfunded: null,
    },
  ],
  ["loading", "loading"],
  ["api-error", "error"],
];

function coverageFor(overrides: Partial<ApiSubscriptionCoverage>) {
  const funded = overrides.fully_funded_drops ?? 0;
  const eligibility = overrides.eligibility_count ?? 1;
  const next = overrides.next_unfunded ?? null;
  const perDrop = overrides.subscribe_all_editions
    ? eligibility
    : (next?.requested_mints ?? 1);
  return subscriptionCoverageFixture({
    calculated_at: new Date("2026-11-16T10:00:00Z"),
    eligibility_count: eligibility,
    subscribe_all_editions: false,
    balance_eth: (funded * perDrop * 0.06529).toFixed(5),
    mint_capacity: funded * perDrop,
    allocated_mints: funded * perDrop,
    minimum_top_up: null,
    recommended_top_up: null,
    forecast: {
      ...subscriptionCoverageFixture().forecast,
      horizon_start_token_id: 575,
      horizon_end_token_id: 598,
      horizon_drop_count: 24,
      forecast_truncated: true,
    },
    ...overrides,
    consolidation_key: SUBSCRIPTION_PROFILE_KEY,
    next_unfunded: next
      ? {
          ...next,
          requested_mints: perDrop,
          funded_mints: next.funded_mints,
          missing_mints: perDrop - next.funded_mints,
          required_eth: (perDrop * 0.06529).toFixed(5),
          shortfall_eth: ((perDrop - next.funded_mints) * 0.06529).toFixed(5),
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
      await page.clock.install({ time: new Date("2026-11-16T10:00:00Z") });
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
      let finalResponse: Promise<void> | undefined;
      await page.route(
        (url) =>
          url.pathname.includes("/subscriptions/consolidation/coverage/"),
        async (route) => {
          if (route.request().method() !== "GET") return route.fallback();
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
          if (route.request().method() !== "GET") return route.fallback();
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
          if (route.request().method() !== "GET") return route.fallback();
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
          if (route.request().method() !== "GET") return route.fallback();
          if (finalResponse) await finalResponse;
          const activeName = states.find(([, data]) => data === current)?.[0];
          const tuple = new URL(route.request().url()).pathname.match(
            /\/final\/([^/]+)\/([^/]+)\/(\d+)$/
          );
          if (
            !tuple ||
            tuple[1] !== SUBSCRIPTION_PROFILE_KEY ||
            tuple[2]?.toLowerCase() !== SUBSCRIPTION_CONTRACT ||
            ![575, 576, 577, 578, 579].includes(Number(tuple[3])) ||
            (activeName === "mint-paid" && Number(tuple[3]) !== 575)
          ) {
            await route.fulfill({
              status: 409,
              json: { error: "Unexpected final-payment fixture tuple" },
            });
            return;
          }
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
                consolidation_key: SUBSCRIPTION_PROFILE_KEY,
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
      await page.route(
        (url) =>
          /\/distributions\/[^/]+\/\d+\/wallet-allocations$/.test(url.pathname),
        async (route) => {
          if (route.request().method() !== "GET") return route.fallback();
          const url = new URL(route.request().url());
          if (
            url.searchParams.get("wallet") !== SUBSCRIPTION_PROFILE_KEY ||
            !url.pathname.toLowerCase().includes(`/${SUBSCRIPTION_CONTRACT}/`)
          ) {
            await route.fulfill({
              status: 400,
              json: {
                error: "Unexpected publication fixture wallet or contract",
              },
            });
            return;
          }
          await route.fulfill({
            json: {
              has_distribution: url.pathname.endsWith(
                "/575/wallet-allocations"
              ),
              allocations: [],
            },
          });
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
      const onlyState = process.env["SUBSCRIPTION_AUDIT_STATE"];
      if (onlyState && !states.some(([name]) => name === onlyState)) {
        throw new Error(
          `Unknown subscription audit state ${onlyState}. Valid states: ${states.map(([name]) => name).join(", ")}`
        );
      }
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
      const cases = onlyState
        ? states.filter(([name]) => name === onlyState)
        : fullAudit
          ? states
          : states.filter(([name]) =>
              [
                "not-set-up",
                "no-selections",
                "covered",
                "zero-funded",
                "one-funded",
                "plan-top-up",
                "running-low",
                "no-deadline",
                "partial-editions",
                "deadline-passed",
                "forecast-cap",
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
        await page.clock.setFixedTime(
          new Date(
            name === "deadline-passed"
              ? "2026-11-16T14:31:00Z"
              : "2026-11-16T10:00:00Z"
          )
        );
        const loading = data === "loading" || name === "mint-payment-loading";
        const paymentRequest =
          name === "mint-payment-loading"
            ? page.waitForRequest((request) =>
                new URL(request.url()).pathname.endsWith(
                  `/subscriptions/consolidation/final/${SUBSCRIPTION_PROFILE_KEY}/${SUBSCRIPTION_CONTRACT}/575`
                )
              )
            : undefined;
        await page.goto("/playwright/subscriptions", {
          waitUntil: "domcontentloaded",
          timeout: 120000,
        });
        if (paymentRequest) await paymentRequest;
        const overview = page
          .getByRole("region", { name: "Subscription minting", exact: true })
          .locator("#profile-subscriptions-overview");
        await expect(overview).toBeVisible({ timeout: 60000 });
        if (loading) {
          await expect(
            overview.getByRole("heading", {
              name: "Loading subscription coverage",
            })
          ).toBeVisible();
          await expect(
            overview.getByText("Action required", { exact: true })
          ).toHaveCount(0);
          await expect(
            overview.getByRole("button", { name: "Top up", exact: true })
          ).toHaveCount(0);
        } else if (data === "error")
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
          if (name === "forecast-cap") {
            await expect(headline).toHaveText(
              phase === "before" ? "24 drops funded" : "Next 24 drops funded"
            );
            await expect(
              overview.getByText(/Funded (at least )?through/)
            ).toHaveText(
              phase === "before"
                ? "Funded through The Memes #598 · Jan 1, 2027"
                : "Funded at least through The Memes #598 · Jan 1, 2027"
            );
          }
          if (phase !== "before" && name === "mint-paid")
            await expect(headline).toHaveText("Subscription paid");
          if (phase !== "before" && name === "mint-payment-error") {
            await expect(headline).toHaveText("Coverage unavailable");
            await expect(
              overview.getByText(
                "This subscription could not be checked. It will be checked again shortly.",
                { exact: true }
              )
            ).toBeVisible();
            await expect(headline).not.toContainText("isn’t covered");
          }
          if (
            phase !== "before" &&
            ["zero-funded", "no-deadline"].includes(name)
          ) {
            await expect(headline).toHaveText(
              owner
                ? "Today’s mint isn’t covered"
                : "The Memes #575 isn’t covered"
            );
            await expect(
              overview.getByText(
                /deadline is not available|deadline unknown|is not fully funded\./i
              )
            ).toHaveCount(0);
          }
          if (phase !== "before" && name === "partial-editions") {
            await expect(headline).toHaveText(
              owner
                ? "Today’s mint isn’t fully covered"
                : "The Memes #575 isn’t fully covered"
            );
            await expect(
              overview.getByText("1 of 3 editions funded", { exact: true })
            ).toHaveCount(owner ? 0 : 1);
            if (owner)
              await expect(overview.getByText(/Top up by/)).toHaveText(
                "Top up by Nov 16, 2026, 14:30 UTC to receive the remaining 2 editions of The Memes #575."
              );
          }
          if (phase !== "before" && name === "one-funded") {
            await expect(
              overview.getByText("Running low", { exact: true })
            ).toBeVisible();
            await expect(
              overview.getByText("Action required", { exact: true })
            ).toHaveCount(0);
            await expect(
              overview.getByRole("link", {
                name: "The Memes #575",
                exact: true,
              })
            ).toBeVisible();
            if (owner)
              await expect(overview.getByText(/Top up by/)).toHaveText(
                "Top up by Nov 17, 2026, 14:30 UTC to receive The Memes #576."
              );
            else
              await expect(
                overview.getByRole("link", {
                  name: "The Memes #576",
                  exact: true,
                })
              ).toBeVisible();
          }
          if (phase !== "before" && name === "deadline-passed") {
            await expect(
              overview.getByText("Deadline passed", { exact: true })
            ).toBeVisible();
            if (owner)
              await expect(overview.getByText(/Top-up deadline:/)).toHaveText(
                "Top-up deadline: Nov 16, 2026, 14:30 UTC."
              );
          }
          if (
            phase !== "before" &&
            [
              "zoku-manual",
              "one-funded",
              "plan-top-up",
              "running-low",
            ].includes(name)
          )
            await expect(
              page
                .getByRole("region", {
                  name: "Subscription minting",
                  exact: true,
                })
                .locator("#profile-subscriptions-overview-description")
            ).toHaveCount(0);
          await expect(
            overview.getByText("Forecast use", { exact: true })
          ).toBeVisible();
        }
        if (!loading)
          await expect(
            overview.getByRole("button", { name: "Top up", exact: true })
          ).toHaveCount(
            owner &&
              (phase === "before" ||
                !["not-set-up", "deadline-passed"].includes(name))
              ? 1
              : 0
          );
        if (!loading)
          await expect(
            page
              .getByRole("region", {
                name: "Subscription minting",
                exact: true,
              })
              .locator('#profile-subscriptions-overview [aria-busy="true"]')
          ).toHaveCount(0, { timeout: RESPONSE_TIMEOUT_MS });
        if (phase !== "before" && name === "no-selections" && owner) {
          const figures = await page
            .getByRole("region", { name: "Subscription minting", exact: true })
            .locator("#subscription-overview-actions")
            .boundingBox();
          const choose = await overview
            .getByRole("link", { name: "Choose drops", exact: true })
            .boundingBox();
          expect(figures).not.toBeNull();
          expect(choose).not.toBeNull();
          if ((page.viewportSize()?.width ?? 1280) < 640) {
            await expect(
              overview.getByRole("heading", {
                name: "No upcoming drops selected",
                exact: true,
              })
            ).toHaveCSS("font-size", "20px");
            expect(choose!.y).toBeGreaterThanOrEqual(
              figures!.y + figures!.height + 19
            );
            await overview
              .getByRole("button", { name: "Forecast use", exact: true })
              .focus();
            await page.keyboard.press("Tab");
            await expect(
              overview.getByRole("link", { name: "Choose drops", exact: true })
            ).toBeFocused();
          } else {
            expect(choose!.y + choose!.height).toBeLessThanOrEqual(figures!.y);
            await overview
              .getByRole("link", { name: "Choose drops", exact: true })
              .focus();
            for (const name of ["Top up", "Refresh balance", "Forecast use"]) {
              await page.keyboard.press("Tab");
              await expect(
                overview.getByRole("button", { name, exact: true })
              ).toBeFocused();
            }
          }
        }
        if (
          phase !== "before" &&
          name === "covered" &&
          (page.viewportSize()?.width ?? 1280) < 768
        ) {
          const upcoming = page.getByRole("region", {
            name: "Upcoming Drops",
            exact: true,
          });
          const drop = upcoming.getByRole("link", {
            name: "The Memes #576",
            exact: true,
          });
          await expect(drop).toBeVisible();
          const row = upcoming
            .getByRole("link", { name: "The Memes #576", exact: true })
            .locator(
              "xpath=ancestor::div[contains(@class, 'tw-@container/drop-row')]"
            );
          if (owner) await expect(row.getByRole("combobox")).toBeEnabled();
          else
            await expect(
              row.getByRole("group", {
                name: "Subscription quantity for The Memes #576",
                exact: true,
              })
            ).toBeVisible();
          const geometry = await drop.evaluate((link) => {
            const grid = link.parentElement!.parentElement!;
            const date = grid.querySelector("time")!;
            const metadata = date.parentElement!;
            const controls =
              grid.querySelector('[role="switch"]')?.closest("label")
                ?.parentElement ??
              grid.querySelector('[role="group"]')?.parentElement;
            const dateRect = date.getBoundingClientRect();
            const metadataRect = metadata.getBoundingClientRect();
            const controlRect = controls!.getBoundingClientRect();
            const name = link.getBoundingClientRect();
            const gridRect = grid.getBoundingClientRect();
            return {
              visibleDate: date.innerText,
              dateTime: date.getAttribute("datetime"),
              dateHeight: dateRect.height,
              metadataTop: metadataRect.top,
              metadataBottom: metadataRect.bottom,
              nameTop: name.top,
              nameBottom: name.bottom,
              nameRight: name.right,
              controlsCenter: controlRect.y + controlRect.height / 2,
              controlsTop: controlRect.top,
              controlsLeft: controlRect.left,
              controlsRight: controlRect.right,
              metadataRight: metadataRect.right,
              gridRight: gridRect.right,
              leadingWidth:
                grid.previousElementSibling?.getBoundingClientRect().width ?? 0,
              nameFont: getComputedStyle(link.parentElement!).fontSize,
              dateFont: getComputedStyle(date).fontSize,
            };
          });
          expect(geometry.leadingWidth).toBe(48);
          expect(geometry.nameFont).toBe("15px");
          expect(geometry.dateFont).toBe("13px");
          expect(geometry.dateHeight).toBeLessThanOrEqual(18);
          expect(geometry.nameTop).toBeLessThan(geometry.metadataTop);
          expect(geometry.metadataRight).toBeLessThanOrEqual(
            geometry.gridRight
          );
          expect(geometry.controlsRight).toBeLessThanOrEqual(
            geometry.gridRight
          );
          if (geometry.controlsTop < geometry.metadataTop) {
            expect(
              Math.abs(
                (geometry.nameTop + geometry.nameBottom) / 2 -
                  geometry.controlsCenter
              )
            ).toBeLessThanOrEqual(1);
            expect(geometry.nameRight).toBeLessThanOrEqual(
              geometry.controlsLeft
            );
          } else {
            expect(geometry.controlsTop).toBeGreaterThanOrEqual(
              geometry.metadataBottom
            );
          }
          const instant = new Date(geometry.dateTime!);
          const fullDate = new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }).format(instant);
          expect(geometry.visibleDate).toBe(
            new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              timeZone: "UTC",
            }).format(instant)
          );
          const dateColumn = upcoming.getByRole("button", {
            name: fullDate,
            exact: true,
          });
          await dateColumn.focus();
          await expect(
            page.getByRole("tooltip", { name: fullDate })
          ).toBeVisible();
          await page.keyboard.press("Escape");
          await dateColumn.blur();
          await dateColumn.tap();
          await expect(
            page.getByRole("tooltip", { name: fullDate })
          ).toBeVisible();
          await page.keyboard.press("Escape");
          await dateColumn.blur();
          if (owner) {
            const mintingRow = upcoming
              .getByRole("button", { name: "Minting Today", exact: true })
              .locator(
                "xpath=ancestor::div[contains(@class, 'tw-@container/drop-row')]"
              );
            await expect(mintingRow.getByRole("switch")).toBeDisabled();
            await expect(
              mintingRow.getByText("No changes allowed on minting day", {
                exact: true,
              })
            ).toBeVisible();
            expect(
              await drop.evaluate(
                (link) =>
                  link.parentElement!.parentElement!.querySelector("select")
                    ?.disabled
              )
            ).toBe(false);
          }
          await upcoming.screenshot({
            path: testInfo.outputPath(
              `compact-drops-${owner ? "owner" : "visitor"}.png`
            ),
            animations: "disabled",
          });
          await upcoming
            .getByRole("button", { name: "Show More", exact: true })
            .click();
          const expanded =
            (page.viewportSize()?.width ?? 1280) < 640
              ? page.getByRole("dialog", {
                  name: "Upcoming Drops",
                  exact: true,
                })
              : upcoming;
          await expect(
            expanded.getByRole("link", { name: "The Memes #579", exact: true })
          ).toBeVisible();
          await expanded
            .getByRole("button", { name: "Show Less", exact: true })
            .click();
          await expect(
            upcoming.getByRole("button", { name: "Show More", exact: true })
          ).toBeVisible();
        }
        if (
          phase !== "before" &&
          name === "covered" &&
          (page.viewportSize()?.width ?? 1280) >= 768
        ) {
          const drop = page.getByRole("link", {
            name: "The Memes #576",
            exact: true,
          });
          await expect(drop).toBeVisible();
          const desktop = await drop.evaluate((link) => {
            const grid = link.parentElement!.parentElement!;
            const date = grid.querySelector("time")!;
            return {
              date: date.innerText,
              dateFont: getComputedStyle(date).fontSize,
              nameFont: getComputedStyle(link.parentElement!).fontSize,
              dateFirst:
                date.getBoundingClientRect().bottom <=
                link.getBoundingClientRect().top,
              leadingWidth:
                grid.previousElementSibling?.getBoundingClientRect().width ?? 0,
            };
          });
          expect(desktop.date).toMatch(/\d{4}/);
          expect(desktop.dateFont).toBe("16px");
          expect(desktop.nameFont).toBe("14px");
          expect(desktop.dateFirst).toBe(true);
          expect(desktop.leadingWidth).toBe(0);
        }
        if (
          phase !== "before" &&
          name === "mint-paid" &&
          (page.viewportSize()?.width ?? 1280) < 768
        ) {
          const upcoming = page.getByRole("region", {
            name: "Upcoming Drops",
            exact: true,
          });
          const more = upcoming.getByRole("button", {
            name: "More",
            exact: true,
          });
          await expect(more).toHaveAttribute("aria-expanded", "false");
          if (!owner) {
            const alignment = await more.evaluate((button) => {
              const grid = button.parentElement!;
              const name = grid.querySelector("a")!.getBoundingClientRect();
              const controls = grid
                .querySelector('[role="group"]')!
                .parentElement!.getBoundingClientRect();
              const more = button.getBoundingClientRect();
              return {
                nameBottom: name.bottom,
                moreTop: more.top,
                controlsBottom: controls.bottom,
                moreWidth: more.width,
                gridWidth: grid.getBoundingClientRect().width,
              };
            });
            expect(alignment.moreTop).toBeGreaterThanOrEqual(
              alignment.nameBottom
            );
            expect(alignment.moreTop).toBeGreaterThanOrEqual(
              alignment.controlsBottom
            );
            expect(alignment.moreWidth).toBeCloseTo(alignment.gridWidth, 0);
          }
          await more.click();
          await expect(more).toHaveAttribute("aria-expanded", "true");
          await expect(
            upcoming.getByText("Subscription Count: x1", { exact: true })
          ).toBeVisible();
          await more.click();
          await expect(more).toHaveAttribute("aria-expanded", "false");
        }
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
        if (phase !== "before" && owner && name === "not-set-up") {
          await overview
            .getByRole("link", { name: "Set up", exact: true })
            .click();
          const settings = page
            .getByRole("region", { name: "Minting settings", exact: true })
            .or(
              page.getByRole("dialog", {
                name: "Minting settings",
                exact: true,
              })
            );
          await expect(
            settings.getByRole("heading", {
              name: "Minting settings",
              exact: true,
            })
          ).toBeFocused();
          await page.keyboard.press("Escape");
        }
        if (phase !== "before" && owner && name === "deadline-passed") {
          await overview
            .getByRole("link", { name: "View history", exact: true })
            .click();
          const history = page
            .getByRole("region", { name: "Subscription History", exact: true })
            .or(
              page.getByRole("dialog", {
                name: "Subscription History",
                exact: true,
              })
            );
          await expect(
            history.getByRole("heading", {
              name: "Subscription History",
              exact: true,
            })
          ).toBeFocused();
          await page.keyboard.press("Escape");
          const future = overview.getByRole("button", {
            name: "Top up for future drops",
            exact: true,
          });
          await future.click();
          await expect(
            page
              .getByRole("dialog", { name: "Top up", exact: true })
              .getByRole("heading", { name: "Top up", exact: true })
          ).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(future).toBeFocused();
        }
        if (phase !== "before" && owner && name === "zero-funded") {
          let releaseFinal!: () => void;
          finalResponse = new Promise<void>((resolve) => {
            releaseFinal = resolve;
          });
          const previousReads = subscriptionReads.filter((url) =>
            url.includes("/final/")
          ).length;
          const heading = overview.getByRole("heading", { level: 2 });
          await heading.focus();
          await page.clock.setFixedTime(new Date("2026-11-16T14:30:01Z"));
          await page.clock.fastForward("04:31:00");
          await expect
            .poll(
              () =>
                subscriptionReads.filter((url) => url.includes("/final/"))
                  .length
            )
            .toBeGreaterThan(previousReads);
          await expect(heading).toHaveText("Loading subscription coverage");
          await expect(heading).toBeFocused();
          await expect(
            overview.getByText("Deadline passed", { exact: true })
          ).toHaveCount(0);
          releaseFinal();
          finalResponse = undefined;
          await expect(
            overview.getByText("Deadline passed", { exact: true })
          ).toBeVisible();
          await expect(heading).toBeFocused();
          expect(
            subscriptionReads.filter((url) => url.includes("/final/")).length
          ).toBeGreaterThan(previousReads);
        }
      }
      if (phase === "before") return;
      current = states.find(([name]) => name === "zoku-manual")![1];
      await page.goto("/playwright/subscriptions");
      const overview = page
        .getByRole("region", { name: "Subscription minting", exact: true })
        .locator("#profile-subscriptions-overview");
      await expect(
        overview.getByText("All selected drops in this forecast are funded.")
      ).toHaveCount(0);
      await expect(
        overview.getByText("Covered", { exact: true })
      ).toBeVisible();
      // Bring the complete card above the native bottom navigation before input.
      await overview.scrollIntoViewIfNeeded();
      const forecast = overview.getByRole("button", {
        name: "Forecast use",
        exact: true,
      });
      const tooltip = page
        .getByRole("tooltip")
        .filter({ hasText: "Projected from current eligibility" });
      await test.step("open forecast by keyboard and dismiss with Escape", async () => {
        await forecast.focus();
        await expect(forecast).toBeFocused();
        await forecast.press("Enter");
        await expect(tooltip).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(tooltip).toBeHidden();
      });
      if (testInfo.project.use.hasTouch) {
        await test.step("open forecast by touch and dismiss outside", async () => {
          // Begin the touch check outside the still-focused keyboard anchor.
          await overview.getByRole("heading", { name: "1 drop funded" }).tap();
          await forecast.tap();
          await expect(tooltip).toBeVisible();
          await overview.getByRole("heading", { name: "1 drop funded" }).tap();
          await expect(tooltip).toBeHidden();
        });
      }
      await test.step("open forecast by hover", async () => {
        await forecast.hover();
        await expect(tooltip).toBeVisible();
        await tooltip.screenshot({
          path: testInfo.outputPath("forecast-tooltip.png"),
        });
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
        await page
          .getByRole("dialog", { name: "Top up", exact: true })
          .locator('[id^="headlessui-dialog-panel-"]')
          .screenshot({
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
        .filter({ hasText: "Last updated" });
      await expect(notice).toBeVisible();
      await expect(
        notice.getByRole("button", { name: "Refresh coverage" })
      ).toHaveCount(owner ? 1 : 0);
      await notice.screenshot({
        path: testInfo.outputPath(`stale-${owner ? "owner" : "visitor"}.png`),
      });
      if (owner) {
        current = {
          ...coverageFor(
            states.find(
              ([name]) => name === "zoku-manual"
            )![1] as Partial<ApiSubscriptionCoverage>
          ),
          balance_eth: "0.13058",
          mint_capacity: 2,
        };
        await notice.getByRole("button", { name: "Refresh coverage" }).click();
        await expect(notice).toBeHidden();
        await expect(overview.getByText(/0\.13058\s*ETH/)).toBeVisible();
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
