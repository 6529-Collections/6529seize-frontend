import {
  getSubscriptionCoverageSummaryPresentation,
  isMintDayCoverageShortfall,
  isNextDropSubscriptionPaid,
} from "@/components/user/subscriptions/coverage/subscriptionCoverageSummary.helpers";
import { getSubscriptionCoveragePresentation } from "@/components/user/subscriptions/coverage/subscriptionCoverage.helpers";
import { ApiSubscriptionCoverageMode as Mode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { subscriptionCoverageFixture } from "@/tests/support/subscriptionFixtures";

it.each([
  [Status.NotSetUp, 0, "Not set up", "neutral"],
  [Status.NoCurrentEligibility, 0, "No current eligibility", "neutral"],
  [Status.NoUpcomingSelections, 0, "No upcoming drops selected", "neutral"],
  [Status.Covered, 7, "Covered", "positive"],
  [Status.EarlyWarning, 4, "Plan a top up", "neutral"],
  [Status.RunningLow, 2, "Running low", "caution"],
  [Status.ActionRequired, 0, "Action required", "danger"],
  [Status.ActionRequired, 1, "Running low", "caution"],
  [Status.Unknown, 0, "Coverage unavailable", "neutral"],
] as const)(
  "presents %s with %i funded drops as %s",
  (status, funded, label, tone) => {
    const coverage = subscriptionCoverageFixture({
      status,
      fully_funded_drops: funded,
    });
    expect(
      getSubscriptionCoverageSummaryPresentation("en-US", coverage)
    ).toMatchObject({ label, tone });
    expect(coverage.status).toBe(status);
  }
);

it.each([Mode.Manual, Mode.Automatic])(
  "keeps a fully funded selected forecast calm in %s mode",
  (mode) => {
    for (const subscribe_all_editions of [false, true]) {
      for (const eligibility_count of [1, 3]) {
        const coverage = subscriptionCoverageFixture({
          mode,
          status: Status.ActionRequired,
          fully_funded_drops: 1,
          eligibility_count,
          subscribe_all_editions,
          next_unfunded: null,
        });
        expect(
          getSubscriptionCoverageSummaryPresentation("en-US", coverage)
        ).toMatchObject({ label: "Covered", tone: "positive" });
        expect(
          getSubscriptionCoveragePresentation("en-US", coverage.status)
        ).toMatchObject({ label: "Action required", tone: "danger" });
      }
    }
  }
);

it("does not claim coverage when no funded or unfunded drop is identified", () => {
  expect(
    getSubscriptionCoverageSummaryPresentation(
      "en-US",
      subscriptionCoverageFixture({
        fully_funded_drops: 0,
        next_unfunded: null,
      })
    )
  ).toMatchObject({ label: "Coverage unavailable", tone: "neutral" });
});

it("keeps absent API data unavailable", () => {
  expect(
    getSubscriptionCoverageSummaryPresentation("en-US", undefined)
  ).toMatchObject({ label: "Coverage unavailable", tone: "neutral" });
});

describe("Mint-day payment evidence", () => {
  const coverage = subscriptionCoverageFixture({
    fully_funded_drops: 0,
    calculated_at: new Date("2026-11-16T15:36:00Z"),
    next_unfunded: {
      ...subscriptionCoverageFixture().next_unfunded!,
      token_id: 575,
      mint_at: new Date("2026-11-16T15:40:00Z"),
      requested_mints: 3,
    },
  });
  const final = {
    consolidation_key: "profile-key",
    contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    token_id: 575,
    subscribed_count: 3,
    redeemed_count: 3,
    balance: 0.19587,
    airdrop_address: "0x0000000000000000000000000000000000000529",
  };
  it("checks only the same UTC mint day with no funded drops remaining", () => {
    expect(isMintDayCoverageShortfall(coverage)).toBe(true);
    expect(
      isMintDayCoverageShortfall({ ...coverage, fully_funded_drops: 1 })
    ).toBe(false);
    expect(
      isMintDayCoverageShortfall({
        ...coverage,
        calculated_at: new Date("2026-11-15T23:59:59Z"),
      })
    ).toBe(false);
    expect(
      isMintDayCoverageShortfall({
        ...coverage,
        calculated_at: new Date("invalid"),
      })
    ).toBe(false);
    expect(isMintDayCoverageShortfall(undefined)).toBe(false);
  });
  it("requires payment for every requested edition of the exact Meme", () => {
    expect(isNextDropSubscriptionPaid(coverage, final)).toBe(true);
    expect(
      isNextDropSubscriptionPaid(coverage, { ...final, redeemed_count: 2 })
    ).toBe(false);
    expect(
      isNextDropSubscriptionPaid(coverage, { ...final, token_id: 574 })
    ).toBe(false);
    expect(
      isNextDropSubscriptionPaid(coverage, {
        ...final,
        contract: "other-collection",
      })
    ).toBe(false);
    expect(
      isNextDropSubscriptionPaid(coverage, {
        ...final,
        redeemed_count: undefined,
      })
    ).toBe(false);
    expect(isNextDropSubscriptionPaid(coverage, null)).toBe(false);
  });
});
