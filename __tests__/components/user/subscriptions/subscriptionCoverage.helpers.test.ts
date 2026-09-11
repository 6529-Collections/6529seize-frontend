import {
  formatSubscriptionCoverageDeadline,
  getSubscriptionCoverageAnchor,
  getSubscriptionCoverageCompactLine,
  getSubscriptionCoveragePresentation,
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
