import {
  formatSubscriptionCoverageDeadline,
  getSubscriptionCoverageAnchor,
  getDisplayedSubscriptionCoverageStatus,
  getSubscriptionCoverageCompactLine,
  getSubscriptionCoveragePresentation,
  isSubscriptionCoverageForecastFullyFunded,
  isSubscriptionCoverageFundedToForecastEnd,
} from "@/components/user/subscriptions/coverage/subscriptionCoverage.helpers";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";

describe("subscription coverage helpers", () => {
  it.each([
    [ApiSubscriptionCoverageStatus.Covered, "positive", "manage"],
    [ApiSubscriptionCoverageStatus.EarlyWarning, "caution", "top_up"],
    [ApiSubscriptionCoverageStatus.RunningLow, "caution", "top_up"],
    [ApiSubscriptionCoverageStatus.ActionRequired, "danger", "top_up"],
    [ApiSubscriptionCoverageStatus.NotSetUp, "neutral", "set_up"],
    [ApiSubscriptionCoverageStatus.NoCurrentEligibility, "neutral", "manage"],
    [
      ApiSubscriptionCoverageStatus.NoUpcomingSelections,
      "neutral",
      "choose_drops",
    ],
    [ApiSubscriptionCoverageStatus.Unknown, "neutral", "manage"],
  ])("maps %s to the intended tone and action", (status, tone, action) => {
    expect(getSubscriptionCoveragePresentation("en-US", status)).toMatchObject({
      action,
      tone,
    });
  });

  it("builds the compact owner status from mode, balance, and funded drops", () => {
    const coverage = {
      mode: ApiSubscriptionCoverageMode.Automatic,
      balance_eth: "0.180000",
      fully_funded_drops: 4,
      status: ApiSubscriptionCoverageStatus.EarlyWarning,
    } as ApiSubscriptionCoverage;

    expect(getSubscriptionCoverageCompactLine("en-US", coverage)).toBe(
      "Automatic · 0.18 ETH · 4 drops funded"
    );
  });

  it("calls a forecast-end count the next drops funded", () => {
    const coverage = {
      mode: ApiSubscriptionCoverageMode.Automatic,
      balance_eth: "2",
      fully_funded_drops: 24,
      status: ApiSubscriptionCoverageStatus.Covered,
      funded_through: { token_id: 598, mint_at: new Date("2027-01-01") },
      next_unfunded: null,
      forecast: {
        forecast_truncated: true,
        horizon_end_token_id: 598,
        horizon_drop_count: 24,
      },
    } as ApiSubscriptionCoverage;

    expect(getSubscriptionCoverageCompactLine("en-US", coverage)).toBe(
      "Automatic · 2 ETH · Next 24 drops funded"
    );
  });

  it("keeps the plain count when the funded count is not the forecast size", () => {
    const coverage = {
      mode: ApiSubscriptionCoverageMode.Manual,
      balance_eth: "0.2",
      fully_funded_drops: 3,
      status: ApiSubscriptionCoverageStatus.RunningLow,
      funded_through: { token_id: 598, mint_at: new Date("2027-01-01") },
      next_unfunded: null,
      forecast: {
        forecast_truncated: true,
        horizon_end_token_id: 598,
        horizon_drop_count: 24,
      },
    } as ApiSubscriptionCoverage;

    expect(getSubscriptionCoverageCompactLine("en-US", coverage)).toBe(
      "Manual · 0.2 ETH · 3 drops funded"
    );
    expect(isSubscriptionCoverageForecastFullyFunded(coverage)).toBe(false);
    expect(isSubscriptionCoverageFundedToForecastEnd(coverage)).toBe(true);
  });

  it("does not treat a funded-through point before the forecast end as open-ended", () => {
    const coverage = {
      fully_funded_drops: 24,
      funded_through: { token_id: 590, mint_at: new Date("2026-12-14") },
      next_unfunded: null,
      forecast: {
        forecast_truncated: true,
        horizon_end_token_id: 598,
        horizon_drop_count: 24,
      },
    } as ApiSubscriptionCoverage;

    expect(isSubscriptionCoverageFundedToForecastEnd(coverage)).toBe(false);
    expect(isSubscriptionCoverageForecastFullyFunded(coverage)).toBe(false);
  });

  it("maps one funded action-required drop to running low", () => {
    expect(
      getDisplayedSubscriptionCoverageStatus(
        ApiSubscriptionCoverageStatus.ActionRequired,
        1
      )
    ).toBe(ApiSubscriptionCoverageStatus.RunningLow);
    expect(
      getDisplayedSubscriptionCoverageStatus(
        ApiSubscriptionCoverageStatus.ActionRequired,
        0
      )
    ).toBe(ApiSubscriptionCoverageStatus.ActionRequired);
  });

  it("does not imply funded runway for a profile without current eligibility", () => {
    const coverage = {
      mode: ApiSubscriptionCoverageMode.Automatic,
      balance_eth: "0.18",
      fully_funded_drops: 0,
      status: ApiSubscriptionCoverageStatus.NoCurrentEligibility,
    } as ApiSubscriptionCoverage;

    expect(getSubscriptionCoverageCompactLine("en-US", coverage)).toBe(
      "Automatic · 0.18 ETH"
    );
  });

  it("uses action-specific section anchors", () => {
    expect(getSubscriptionCoverageAnchor("top_up")).toBe(
      "#profile-subscriptions-top-up"
    );
    expect(getSubscriptionCoverageAnchor("choose_drops")).toBe(
      "#profile-subscriptions-upcoming"
    );
    expect(getSubscriptionCoverageAnchor("set_up")).toBe(
      "#profile-subscriptions-settings"
    );
  });

  it("formats authoritative deadlines in UTC", () => {
    expect(
      formatSubscriptionCoverageDeadline(
        "en-US",
        new Date("2026-10-12T14:30:00Z")
      )
    ).toBe("Oct 12, 2026, 14:30 UTC");
  });
});

describe("summary date format", () => {
  it("keeps the full date and UTC cutoff time in every year", () => {
    expect(
      formatSubscriptionCoverageDeadline(
        "en-US",
        new Date("2026-11-12T17:00:00Z")
      )
    ).toBe("Nov 12, 2026, 17:00 UTC");
    expect(
      formatSubscriptionCoverageDeadline(
        "en-US",
        new Date("2027-01-02T17:00:00Z")
      )
    ).toBe("Jan 2, 2027, 17:00 UTC");
  });
});
