import SubscriptionCoverageSummary from "@/components/user/subscriptions/coverage/SubscriptionCoverageSummary";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageDeadlineBasis } from "@/generated/models/ApiSubscriptionCoverageDeadlineBasis";
import { ApiSubscriptionCoverageEligibilityBasis } from "@/generated/models/ApiSubscriptionCoverageEligibilityBasis";
import { ApiSubscriptionCoverageMode } from "@/generated/models/ApiSubscriptionCoverageMode";
import { ApiSubscriptionCoverageScheduleBasis } from "@/generated/models/ApiSubscriptionCoverageScheduleBasis";
import { ApiSubscriptionCoverageSource } from "@/generated/models/ApiSubscriptionCoverageSource";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { render, screen } from "@testing-library/react";
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
  it("makes an unfunded immediate drop actionable without inventing timing", () => {
    render(
      <SubscriptionCoverageSummary
        coverage={createCoverage()}
        isError={false}
        isLoading={false}
        isOwner
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText("Action required")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "0 drops funded" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Top up by Oct 12, 2026, 14:30 UTC to receive The Memes #561."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Recommended: add 0.40732 ETH for 7 funded drops through The Memes #567."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Top up subscriptions" })
    ).toHaveAttribute("href", "#profile-subscriptions-top-up");
  });

  it("uses funded-through language for a healthy profile", () => {
    render(
      <SubscriptionCoverageSummary
        coverage={createCoverage({
          status: ApiSubscriptionCoverageStatus.Covered,
          fully_funded_drops: 8,
          funded_through: {
            token_id: 560,
            mint_at: new Date("2026-10-12T15:40:00Z"),
          },
          next_unfunded: null,
          minimum_top_up: null,
          recommended_top_up: null,
        })}
        isError={false}
        isLoading={false}
        isOwner
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText("Covered")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "8 drops funded" })
    ).toBeInTheDocument();
    expect(screen.getByText("Funded through")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "The Memes #560" })
    ).toHaveAttribute("href", "/the-memes/560");
    expect(
      screen.getByRole("link", { name: "Review settings" })
    ).toHaveAttribute("href", "#profile-subscriptions-settings");
  });

  it("guides a non-minter to setup instead of showing a false zero-runway alarm", () => {
    render(
      <SubscriptionCoverageSummary
        coverage={createCoverage({
          status: ApiSubscriptionCoverageStatus.NotSetUp,
          mode: null,
          subscribe_all_editions: null,
          eligibility_count: 0,
          balance_eth: "0",
          mint_capacity: 0,
          allocated_mints: 0,
          fully_funded_drops: 0,
          next_unfunded: null,
          minimum_top_up: null,
          recommended_top_up: null,
        })}
        isError={false}
        isLoading={false}
        isOwner
        onRefresh={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Not set up" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Not set up")).toHaveLength(1);
    expect(screen.queryByText("0 drops funded")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set up" })).toHaveAttribute(
      "href",
      "#profile-subscriptions-settings"
    );
  });

  it("states when no authoritative deadline is available", () => {
    render(
      <SubscriptionCoverageSummary
        coverage={createCoverage({
          next_unfunded: {
            ...createCoverage().next_unfunded!,
            top_up_deadline: null,
          },
        })}
        isError={false}
        isLoading={false}
        isOwner
        onRefresh={jest.fn()}
      />
    );

    expect(
      screen.getByText("No authoritative top-up deadline is available yet.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
  });

  it("does not turn unavailable eligibility or capacity into a false zero", () => {
    render(
      <SubscriptionCoverageSummary
        coverage={createCoverage({
          eligibility_count: null,
          mint_capacity: null,
        })}
        isError={false}
        isLoading={false}
        isOwner
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText("Eligibility unavailable")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("offers recovery when coverage cannot be loaded", async () => {
    const user = userEvent.setup();
    const onRefresh = jest.fn();

    render(
      <SubscriptionCoverageSummary
        coverage={undefined}
        isError
        isLoading={false}
        isOwner
        onRefresh={onRefresh}
      />
    );

    await user.click(screen.getByRole("button", { name: "Refresh coverage" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        "Coverage is temporarily unavailable. Your subscription settings have not changed."
      )
    ).toBeInTheDocument();
  });

  it("keeps last known coverage visible when a background refresh fails", async () => {
    const user = userEvent.setup();
    const onRefresh = jest.fn();

    render(
      <SubscriptionCoverageSummary
        coverage={createCoverage()}
        isError
        isLoading={false}
        isOwner
        onRefresh={onRefresh}
      />
    );

    expect(
      screen.getByRole("heading", { name: "0 drops funded" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Last known coverage is shown and may be out of date.")
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Last known coverage is shown and may be out of date."
    );
    await user.click(screen.getByRole("button", { name: "Refresh coverage" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
