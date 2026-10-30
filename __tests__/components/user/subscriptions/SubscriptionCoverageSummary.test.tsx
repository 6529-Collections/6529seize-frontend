import SubscriptionCoverageSummary from "@/components/user/subscriptions/coverage/SubscriptionCoverageSummary";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageDeadlineBasis } from "@/generated/models/ApiSubscriptionCoverageDeadlineBasis";
import { ApiSubscriptionCoverageEligibilityBasis } from "@/generated/models/ApiSubscriptionCoverageEligibilityBasis";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageScheduleBasis } from "@/generated/models/ApiSubscriptionCoverageScheduleBasis";
import { ApiSubscriptionCoverageSource } from "@/generated/models/ApiSubscriptionCoverageSource";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function createCoverage(
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

describe("SubscriptionCoverageSummary", () => {
  const renderSummary = (
    coverage: ApiSubscriptionCoverage | undefined = createCoverage(),
    extra = {}
  ) =>
    render(
      <SubscriptionCoverageSummary
        coverage={coverage}
        isError={false}
        isLoading={false}
        isOwner
        onRefresh={jest.fn()}
        {...extra}
      />
    );
  const openDetails = async () =>
    userEvent.setup().click(screen.getByRole("button", { name: "Details" }));

  it("makes a partially funded drop actionable and preserves exact recommendation and deadline", async () => {
    const onToggleTopUp = jest.fn();
    renderSummary(createCoverage(), { onToggleTopUp });
    expect(
      screen.getByRole("heading", {
        name: "Your next drop is not fully funded",
      })
    ).toBeVisible();
    expect(screen.getByText("Status")).not.toBeVisible();
    expect(
      screen.getAllByText(
        "Top up by Oct 12, 2026, 14:30 UTC to receive The Memes #561."
      )[0]
    ).toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Top up", exact: true }));
    expect(onToggleTopUp).toHaveBeenCalledTimes(1);
    await openDetails();
    expect(screen.getByText("Action required")).toBeVisible();
    expect(screen.getByText("0 drops funded")).toBeVisible();
    expect(
      screen.getByText(
        "Recommended: add 0.40732 ETH for 7 funded drops through The Memes #567."
      )
    ).toBeVisible();
  });

  it("uses a short funded-through headline and retains the token and full date in Details", async () => {
    renderSummary(
      createCoverage({
        status: ApiSubscriptionCoverageStatus.Covered,
        fully_funded_drops: 8,
        funded_through: {
          token_id: 560,
          mint_at: new Date("2026-10-12T15:40:00Z"),
        },
        next_unfunded: null,
        minimum_top_up: null,
        recommended_top_up: null,
      })
    );
    expect(
      screen.getByRole("heading", { name: "Covered until Oct 12" })
    ).toBeVisible();
    await openDetails();
    expect(screen.getByText("Covered", { exact: true })).toBeVisible();
    expect(screen.getByText("8 drops funded")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "The Memes #560" })
    ).toHaveAttribute("href", "/the-memes/560");
    expect(screen.getByText(/Oct 12, 2026/)).toBeVisible();
  });

  it("does not call the next drop unfunded when one intended drop is still covered", () => {
    renderSummary(
      createCoverage({
        fully_funded_drops: 1,
        funded_through: {
          token_id: 560,
          mint_at: new Date("2026-10-12T15:40:00Z"),
        },
      })
    );
    expect(
      screen.getByRole("heading", { name: "Covered until Oct 12" })
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: "Your next drop is not fully funded",
      })
    ).not.toBeInTheDocument();
  });

  it.each([
    [ApiSubscriptionCoverageStatus.Covered, "Covered"],
    [ApiSubscriptionCoverageStatus.EarlyWarning, "Plan a top up"],
    [ApiSubscriptionCoverageStatus.RunningLow, "Running low"],
    [ApiSubscriptionCoverageStatus.ActionRequired, "Action required"],
    [ApiSubscriptionCoverageStatus.NotSetUp, "Not set up"],
    [
      ApiSubscriptionCoverageStatus.NoCurrentEligibility,
      "No current eligibility",
    ],
    [
      ApiSubscriptionCoverageStatus.NoUpcomingSelections,
      "No upcoming drops selected",
    ],
    [ApiSubscriptionCoverageStatus.Unknown, "Coverage unavailable"],
  ])("preserves the shared status vocabulary for %s", async (status, label) => {
    renderSummary(createCoverage({ status }));
    await openDetails();
    expect(
      within(
        document.getElementById("subscription-coverage-details")!
      ).getByText(label, { exact: true })
    ).toBeVisible();
  });

  it("guides a non-minter without a false zero-runway headline", () => {
    renderSummary(
      createCoverage({
        status: ApiSubscriptionCoverageStatus.NotSetUp,
        mode: null,
        balance_eth: "0",
        next_unfunded: null,
        recommended_top_up: null,
      })
    );
    expect(screen.getByRole("heading", { name: "Not set up" })).toBeVisible();
    expect(screen.getByText("0 drops funded")).not.toBeVisible();
    expect(
      screen.getByRole("button", { name: "Top up", exact: true })
    ).toBeVisible();
  });

  it("distinguishes choosing drops from topping up an empty balance", () => {
    const coverage = createCoverage({
      status: ApiSubscriptionCoverageStatus.NoUpcomingSelections,
    });
    const { rerender } = renderSummary(coverage);
    expect(screen.getByRole("link", { name: "Choose drops" })).toHaveAttribute(
      "href",
      "#profile-subscriptions-upcoming"
    );
    rerender(
      <SubscriptionCoverageSummary
        coverage={{ ...coverage, balance_eth: "0" }}
        isError={false}
        isLoading={false}
        isOwner
        onRefresh={jest.fn()}
      />
    );
    expect(
      screen.queryByRole("link", { name: "Choose drops" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Top up, then turn on the drops you want below.")
    ).toBeVisible();
  });

  it("states when no authoritative deadline is available without inventing one", async () => {
    renderSummary(
      createCoverage({
        next_unfunded: {
          ...createCoverage().next_unfunded!,
          top_up_deadline: null,
        },
      })
    );
    expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
    await openDetails();
    expect(
      screen.getByText("No authoritative top-up deadline is available yet.")
    ).toBeVisible();
  });

  it("does not turn unavailable eligibility or capacity into a false zero", async () => {
    renderSummary(
      createCoverage({ eligibility_count: null, mint_capacity: null })
    );
    await openDetails();
    expect(screen.getByText("Eligibility unavailable")).toBeVisible();
    expect(screen.getByText("mint capacity unavailable")).toBeVisible();
  });

  it("offers recovery from unavailable coverage within Details", async () => {
    const onRefresh = jest.fn();
    renderSummary(undefined, { coverage: undefined, isError: true, onRefresh });
    expect(
      screen.getByRole("heading", { name: "Coverage unavailable" })
    ).toBeVisible();
    await openDetails();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Refresh coverage" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the stale warning visible before Details is opened", async () => {
    const onRefresh = jest.fn();
    renderSummary(createCoverage(), { isError: true, onRefresh });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Last known coverage is shown and may be out of date."
    );
    await openDetails();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Refresh coverage" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("keeps visitors read-only with neutral wording", async () => {
    renderSummary(createCoverage(), { isOwner: false });
    expect(
      screen.getByRole("heading", {
        name: "The next intended drop is not fully funded",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Top up", exact: true })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Choose drops" })
    ).not.toBeInTheDocument();
    await openDetails();
    expect(
      screen.queryByRole("button", { name: "Refresh coverage" })
    ).not.toBeInTheDocument();
  });
});
