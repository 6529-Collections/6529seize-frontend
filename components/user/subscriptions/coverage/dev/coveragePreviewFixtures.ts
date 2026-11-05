import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageDeadlineBasis } from "@/generated/models/ApiSubscriptionCoverageDeadlineBasis";
import { ApiSubscriptionCoverageEligibilityBasis } from "@/generated/models/ApiSubscriptionCoverageEligibilityBasis";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageScheduleBasis } from "@/generated/models/ApiSubscriptionCoverageScheduleBasis";
import { ApiSubscriptionCoverageSource } from "@/generated/models/ApiSubscriptionCoverageSource";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";

// Illustrative local data, never written to the query cache or sent to an API.
const point = (token_id: number, date: string) => ({
  token_id,
  mint_at: new Date(`${date}T17:00:00Z`),
});

const base: ApiSubscriptionCoverage = {
  consolidation_key: "local-design-preview",
  calculated_at: new Date("2026-11-05T12:00:00Z"),
  status: Status.Covered,
  mode: ApiSubscriptionCoverageMode.Automatic,
  subscribe_all_editions: true,
  eligibility_count: 12,
  balance_eth: "71.55784",
  mint_price_eth: "0.06529",
  mint_capacity: 1096,
  allocated_mints: 288,
  fully_funded_drops: 24,
  funded_through: point(594, "2026-12-30"),
  next_unfunded: null,
  minimum_top_up: null,
  recommended_top_up: null,
  forecast: {
    eligibility_basis:
      ApiSubscriptionCoverageEligibilityBasis.CurrentEligibility,
    schedule_basis: ApiSubscriptionCoverageScheduleBasis.Projected,
    deadline_basis: ApiSubscriptionCoverageDeadlineBasis.Authoritative,
    forecast_truncated: false,
    horizon_start_token_id: 571,
    horizon_end_token_id: 594,
    horizon_drop_count: 24,
    calculation_version: 1,
    forecast_fingerprint: "local-design-preview",
    unknown_reason: null,
  },
};

function warning(
  status: Status,
  funded: number,
  fundedThrough: ApiSubscriptionCoverage["funded_through"],
  next: NonNullable<ApiSubscriptionCoverage["funded_through"]>,
  capacity: number
): ApiSubscriptionCoverage {
  const remainingMints = capacity - funded * 12;
  const amount = (mints: number) => ((mints * 6529) / 100000).toFixed(5);
  return {
    ...base,
    status,
    balance_eth: amount(capacity),
    mint_capacity: capacity,
    allocated_mints: capacity,
    fully_funded_drops: funded,
    funded_through: fundedThrough,
    next_unfunded: {
      ...next,
      requested_mints: 12,
      funded_mints: remainingMints,
      missing_mints: 12 - remainingMints,
      required_eth: amount(12),
      shortfall_eth: amount(12 - remainingMints),
      top_up_deadline: new Date(next.mint_at.getTime() - 86400000),
      source: ApiSubscriptionCoverageSource.Automatic,
    },
    minimum_top_up: {
      additional_mints: 12 - remainingMints,
      amount_eth: amount(12 - remainingMints),
      resulting_fully_funded_drops: funded + 1,
      projected_through: next,
    },
    recommended_top_up: {
      target_fully_funded_drops: 7,
      additional_mints: 84 - capacity,
      amount_eth: amount(84 - capacity),
      projected_through: point(577, "2026-11-20"),
    },
  };
}

const empty: ApiSubscriptionCoverage = {
  ...base,
  mode: ApiSubscriptionCoverageMode.Manual,
  subscribe_all_editions: false,
  eligibility_count: 1,
  balance_eth: "0",
  mint_capacity: 0,
  allocated_mints: 0,
  fully_funded_drops: 0,
  funded_through: null,
};

export const coveragePreviewFixtures: Record<Status, ApiSubscriptionCoverage> =
  {
    [Status.Covered]: base,
    [Status.EarlyWarning]: warning(
      Status.EarlyWarning,
      6,
      point(576, "2026-11-18"),
      point(577, "2026-11-20"),
      72
    ),
    [Status.RunningLow]: warning(
      Status.RunningLow,
      2,
      point(572, "2026-11-09"),
      point(573, "2026-11-11"),
      24
    ),
    [Status.ActionRequired]: warning(
      Status.ActionRequired,
      0,
      null,
      point(571, "2026-11-06"),
      2
    ),
    [Status.NotSetUp]: {
      ...empty,
      status: Status.NotSetUp,
      mode: null,
      subscribe_all_editions: null,
    },
    [Status.NoUpcomingSelections]: {
      ...empty,
      status: Status.NoUpcomingSelections,
    },
    [Status.NoCurrentEligibility]: {
      ...empty,
      status: Status.NoCurrentEligibility,
      eligibility_count: 0,
    },
    [Status.Unknown]: {
      ...empty,
      status: Status.Unknown,
      mode: null,
      eligibility_count: null,
      mint_capacity: null,
    },
  };

export const oneFundedDropPreview = warning(
  Status.ActionRequired,
  1,
  point(571, "2026-11-06"),
  point(572, "2026-11-09"),
  12
);

export const mintingTodayPreview: ApiSubscriptionCoverage = {
  ...base,
  balance_eth: "72.34132",
  mint_capacity: 1108,
  funded_through: point(593, "2026-12-28"),
  forecast: {
    ...base.forecast,
    horizon_start_token_id: 570,
    horizon_end_token_id: 593,
  },
};
