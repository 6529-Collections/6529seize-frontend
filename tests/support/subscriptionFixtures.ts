import type { ApiSubscriptionCoverage } from "../../generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageDeadlineBasis } from "../../generated/models/ApiSubscriptionCoverageDeadlineBasis";
import { ApiSubscriptionCoverageEligibilityBasis } from "../../generated/models/ApiSubscriptionCoverageEligibilityBasis";
import { ApiSubscriptionCoverageMode } from "../../generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageScheduleBasis } from "../../generated/models/ApiSubscriptionCoverageScheduleBasis";
import { ApiSubscriptionCoverageSource } from "../../generated/models/ApiSubscriptionCoverageSource";
import { ApiSubscriptionCoverageStatus } from "../../generated/models/ApiSubscriptionCoverageStatus";

import type { Page } from "@playwright/test";

export function subscriptionCoverageFixture(
  overrides: Partial<ApiSubscriptionCoverage> = {}
): ApiSubscriptionCoverage {
  return {
    consolidation_key: "profile-key",
    calculated_at: new Date("2026-07-26T18:00:00Z"),
    status: ApiSubscriptionCoverageStatus.ActionRequired,
    mode: ApiSubscriptionCoverageMode.Automatic,
    subscribe_all_editions: false,
    eligibility_count: 3,
    balance_eth: "0.18",
    mint_price_eth: "0.06529",
    mint_capacity: 2,
    allocated_mints: 2,
    fully_funded_drops: 0,
    funded_through: null,
    next_unfunded: {
      token_id: 561,
      mint_at: new Date("2026-10-14T15:40:00Z"),
      requested_mints: 3,
      funded_mints: 2,
      missing_mints: 1,
      required_eth: "0.19587",
      shortfall_eth: "0.01587",
      top_up_deadline: new Date("2026-10-12T14:30:00Z"),
      source: ApiSubscriptionCoverageSource.Automatic,
    },
    minimum_top_up: {
      additional_mints: 1,
      amount_eth: "0.01587",
      resulting_fully_funded_drops: 1,
      projected_through: {
        token_id: 561,
        mint_at: new Date("2026-10-14T15:40:00Z"),
      },
    },
    recommended_top_up: {
      target_fully_funded_drops: 7,
      additional_mints: 7,
      amount_eth: "0.40732",
      projected_through: {
        token_id: 567,
        mint_at: new Date("2026-10-26T15:40:00Z"),
      },
    },
    forecast: {
      eligibility_basis:
        ApiSubscriptionCoverageEligibilityBasis.CurrentEligibility,
      schedule_basis: ApiSubscriptionCoverageScheduleBasis.Projected,
      deadline_basis: ApiSubscriptionCoverageDeadlineBasis.Authoritative,
      forecast_truncated: false,
      horizon_start_token_id: 561,
      horizon_end_token_id: 567,
      horizon_drop_count: 7,
      calculation_version: 1,
      forecast_fingerprint: "forecast-fingerprint",
      unknown_reason: null,
    },
    ...overrides,
  };
}

/** Synthetic subscription reads only; never changes the signed-in test profile. */
export async function installSubscriptionFixtures(page: Page) {
  const address = "0xfb47b2ca7df248d36cf0e4f63bfd0503c25debd4";
  const coverage = subscriptionCoverageFixture({
    status: ApiSubscriptionCoverageStatus.RunningLow,
    balance_eth: "0.4",
    mint_capacity: 6,
    allocated_mints: 6,
    fully_funded_drops: 3,
    subscribe_all_editions: true,
    eligibility_count: 2,
    recommended_top_up: {
      additional_mints: 42,
      amount_eth: "2.73392",
      target_fully_funded_drops: 24,
      projected_through: {
        token_id: 591,
        mint_at: new Date("2026-12-23T15:40:00Z"),
      },
    },
    minimum_top_up: {
      additional_mints: 2,
      amount_eth: "0.12232",
      resulting_fully_funded_drops: 4,
      projected_through: {
        token_id: 571,
        mint_at: new Date("2026-11-06T15:40:00Z"),
      },
    },
    funded_through: {
      token_id: 570,
      mint_at: new Date("2026-11-04T15:40:00Z"),
    },
    next_unfunded: {
      ...subscriptionCoverageFixture().next_unfunded!,
      requested_mints: 2,
      funded_mints: 0,
      missing_mints: 2,
      required_eth: "0.13058",
      shortfall_eth: "0.12232",
      token_id: 571,
      mint_at: new Date("2026-11-06T15:40:00Z"),
    },
  });
  await page.route(
    (url) => url.pathname.includes("/subscriptions/consolidation/"),
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.abort("blockedbyclient");
        return;
      }
      const url = new URL(route.request().url());
      const path = url.pathname;
      let body: unknown;
      if (path.includes("/coverage/")) body = coverage;
      else if (path.includes("/details/"))
        body = {
          balance: 0.4,
          automatic: true,
          subscribe_all_editions: true,
          subscription_eligibility_count: 2,
          last_update: Date.parse("2026-10-02T19:03:00Z"),
        };
      else if (path.endsWith("/airdrop-address"))
        body = {
          airdrop_address: { address, ens: "" },
          tdh_wallet: { address, ens: "" },
        };
      else if (path.includes("/upcoming-memes/"))
        body = [568, 569, 570, 571, 572].map((token_id) => ({
          token_id,
          contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
          subscribed: true,
          subscribed_count: 2,
        }));
      else if (/\/(top-up|redeemed|logs)\//.test(path)) {
        const number = Number(url.searchParams.get("page") ?? 1);
        const date = "2026-10-30T14:00:00Z";
        let count = 340;
        let data: unknown[] = [
          {
            transaction: `redeemed-${number}`,
            contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
            token_id: 568,
            address,
            balance_after: 9.20589,
            count: 2,
            created_at: date,
          },
        ];
        if (path.includes("/logs/")) {
          count = 1260;
          data = [
            {
              id: number,
              log: "Added to Final Subscription for Meme #568 on 2026-10-30",
              additional_info: `Airdrop Address: ${address} - Subscription Count: x2 - Balance: 9.20589 ETH`,
              created_at: date,
            },
          ];
        }
        if (path.includes("/top-up/")) {
          count = 20;
          data = [
            {
              hash: `top-up-${number}`,
              amount: 1,
              from_wallet: address,
              transaction_date: date,
            },
          ];
        }
        body = { count, page: number, next: number * 10 < count, data };
      } else {
        await route.fallback();
        return;
      }
      await route.fulfill({ json: body });
    }
  );
  return { coverage, address };
}
