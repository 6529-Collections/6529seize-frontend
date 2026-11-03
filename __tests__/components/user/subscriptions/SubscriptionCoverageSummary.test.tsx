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
  afterEach(() => jest.useRealTimers());
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
    renderSummary(createCoverage());
    expect(
      screen.getByRole("heading", {
        name: "0 drops funded Action required",
      })
    ).toBeVisible();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Top up by Oct 12, 2026, 14:30 UTC to receive The Memes #561."
      )[0]
    ).toBeVisible();
    await openDetails();
    const report = within(
      document.getElementById("subscription-coverage-details")!
    );
    expect(report.queryByText("Action required")).not.toBeInTheDocument();
    expect(report.queryByText("0 drops funded")).not.toBeInTheDocument();
    expect(report.getByText("Next unfunded")).toBeVisible();
    expect(
      screen.getByText(
        "Recommended: add 0.40732 ETH for 7 funded drops through The Memes #567."
      )
    ).toBeVisible();
  });

  it("leads with funded count, status and full funded-through date, with the explanation at the top of Details", async () => {
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
      screen.getByRole("heading", { name: "8 drops funded Covered" })
    ).toBeVisible();
    const headline = screen.getByRole("heading", {
      name: "8 drops funded Covered",
    });
    const summary = headline.parentElement!;
    expect(within(summary).getByText(/Funded through/)).toHaveTextContent(
      "Funded through The Memes #560 · Oct 12, 2026"
    );
    expect(
      within(summary).getByRole("link", { name: "The Memes #560" })
    ).toHaveAttribute("href", "/the-memes/560");
    const explanation = "Your immediate intended drops are fully funded.";
    expect(screen.getByText(explanation)).not.toBeVisible();
    await openDetails();
    const report = document.getElementById("subscription-coverage-details")!;
    for (const label of ["Status", "Drops funded", "Funded through"]) {
      expect(within(report).queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.getAllByText("Covered", { exact: true })).toHaveLength(1);
    expect(screen.getAllByText("8 drops funded")).toHaveLength(1);
    expect(within(report).getByText(explanation)).toBeVisible();
    expect(screen.getAllByText(explanation)).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: "The Memes #560" })
    ).toHaveLength(1);
    expect(within(report).getByText("Balance capacity")).toBeVisible();
    expect(within(report).getByText("Forecast use")).toBeVisible();
    expect(
      within(report)
        .getByText(explanation)
        .compareDocumentPosition(report.querySelector("dl")!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it.each([true, false])(
    "keeps only the covered description and balance metrics in Details (owner: %s)",
    async (isOwner) => {
      renderSummary(
        createCoverage({
          status: ApiSubscriptionCoverageStatus.Covered,
          funded_through: {
            token_id: 560,
            mint_at: new Date("2026-10-12T15:40:00Z"),
          },
          next_unfunded: null,
          recommended_top_up: null,
        }),
        { isOwner, details: { automatic: true, last_update: 123456 } }
      );
      await openDetails();
      const report = document.getElementById("subscription-coverage-details")!;
      expect(
        Array.from(report.querySelectorAll("dt"), (field) => field.textContent)
      ).toEqual(["Balance capacity", "Forecast use"]);
      expect(within(report).queryByText(/^Next:/)).not.toBeInTheDocument();
      expect(
        within(report).queryByText(/Automatic since/)
      ).not.toBeInTheDocument();
      expect(
        within(report).queryByText(
          "Automatic airdrops of all eligible drops unless you opt-out"
        )
      ).not.toBeInTheDocument();
      expect(
        within(report).getByText(
          "Your immediate intended drops are fully funded."
        )
      ).toBeVisible();
      expect(
        within(report).getByText(
          "Projected from current eligibility, settings, balance, and the published Meme schedule."
        )
      ).toBeVisible();
    }
  );

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
      screen.getByRole("heading", { name: "1 drop funded Action required" })
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
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(label);
    expect(
      screen.queryByText("Status", { exact: true })
    ).not.toBeInTheDocument();
  });

  it("keeps the original not-set-up information without added empty runway rows", async () => {
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
    await openDetails();
    expect(screen.queryByText("0 drops funded")).not.toBeInTheDocument();
    expect(screen.queryByText("Funded through")).not.toBeInTheDocument();
    expect(screen.queryByText("Next unfunded")).not.toBeInTheDocument();
    expect(screen.queryByText("None", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Mode", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText("Balance capacity")).toBeVisible();
    expect(screen.getByText("Forecast use")).toBeVisible();
    expect(
      screen.getAllByText(
        "Set up subscription minting so eligible Meme drops can be handled automatically or one at a time."
      )
    ).toHaveLength(1);
  });

  it.each([
    ApiSubscriptionCoverageStatus.NoCurrentEligibility,
    ApiSubscriptionCoverageStatus.NoUpcomingSelections,
    ApiSubscriptionCoverageStatus.Unknown,
  ])(
    "matches the original absence of a funded count for %s",
    async (status) => {
      renderSummary(
        createCoverage({ status, funded_through: null, next_unfunded: null })
      );
      await openDetails();
      expect(screen.queryByText("Drops funded")).not.toBeInTheDocument();
      expect(screen.queryByText("Funded through")).not.toBeInTheDocument();
      expect(screen.queryByText("Next unfunded")).not.toBeInTheDocument();
      expect(screen.getByText("Balance capacity")).toBeVisible();
      expect(screen.getByText("Forecast use")).toBeVisible();
    }
  );

  it.each([
    null,
    ApiSubscriptionCoverageMode.Manual,
    ApiSubscriptionCoverageMode.Automatic,
  ])(
    "omits the settings fields from Details for coverage mode %s",
    async (mode) => {
      renderSummary(createCoverage({ mode }));
      await openDetails();
      const report = within(
        document.getElementById("subscription-coverage-details")!
      );
      for (const label of ["Mode", "Eligibility", "Edition Preference"]) {
        expect(
          report.queryByText(label, { exact: true })
        ).not.toBeInTheDocument();
      }
      expect(report.getByText("Balance capacity")).toBeVisible();
    }
  );

  it("keeps coverage recovery available without reintroducing settings fields", async () => {
    renderSummary(undefined, { coverage: undefined });
    await openDetails();
    expect(
      screen.getByRole("button", { name: "Refresh coverage" })
    ).toBeVisible();
    expect(screen.queryByText("Mode", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText("Forecast use")).toBeVisible();
  });

  it.each([
    [
      ApiSubscriptionCoverageStatus.Covered,
      "Your immediate intended drops are fully funded.",
    ],
    [
      ApiSubscriptionCoverageStatus.EarlyWarning,
      "You are covered for now. Plan a top up before the funded runway ends.",
    ],
    [
      ApiSubscriptionCoverageStatus.NotSetUp,
      "Set up subscription minting so eligible Meme drops can be handled automatically or one at a time.",
    ],
    [
      ApiSubscriptionCoverageStatus.NoUpcomingSelections,
      "Manual mode has no upcoming drops selected. Choose a drop to see how long the balance will last.",
    ],
    [
      ApiSubscriptionCoverageStatus.Unknown,
      "The forecast inputs are incomplete. Review settings or refresh when the schedule is available.",
    ],
  ])(
    "retains the original %s explanation for visitors",
    async (status, description) => {
      renderSummary(createCoverage({ status }), { isOwner: false });
      await openDetails();
      const report = document.getElementById("subscription-coverage-details")!;
      expect(
        within(report).getByRole("heading", { name: "Subscription coverage" })
      ).toBeVisible();
      expect(screen.getAllByText(description)).toHaveLength(1);
      expect(screen.getByText(description)).toBeVisible();
      expect(
        within(report).queryByRole("link", { name: "Review settings" })
      ).not.toBeInTheDocument();
    }
  );

  it.each([
    [
      ApiSubscriptionCoverageStatus.Covered,
      "Review settings",
      "#profile-subscriptions-settings",
    ],
    [
      ApiSubscriptionCoverageStatus.NotSetUp,
      "Set up",
      "#profile-subscriptions-settings",
    ],
    [
      ApiSubscriptionCoverageStatus.ActionRequired,
      "Top up subscriptions",
      "#profile-subscriptions-top-up",
    ],
  ])(
    "restores the original %s action in Details",
    async (status, label, href) => {
      renderSummary(createCoverage({ status }));
      await openDetails();
      const report = document.getElementById("subscription-coverage-details")!;
      expect(within(report).getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href
      );
    }
  );

  it("shows Choose drops below the summary without opening Details, including with an empty balance", async () => {
    const coverage = createCoverage({
      status: ApiSubscriptionCoverageStatus.NoUpcomingSelections,
    });
    const { rerender } = renderSummary(coverage);
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
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
    expect(screen.getByRole("link", { name: "Choose drops" })).toHaveAttribute(
      "href",
      "#profile-subscriptions-upcoming"
    );
    expect(
      screen.getByText(
        "Manual mode has no upcoming drops selected. Choose a drop to see how long the balance will last."
      )
    ).toBeVisible();
    await openDetails();
    expect(screen.getAllByRole("link", { name: "Choose drops" })).toHaveLength(
      1
    );
    expect(
      within(
        document.getElementById("subscription-coverage-details")!
      ).queryByRole("link", { name: "Choose drops" })
    ).not.toBeInTheDocument();
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

  it("does not turn unavailable capacity into a false zero", async () => {
    renderSummary(
      createCoverage({ eligibility_count: null, mint_capacity: null })
    );
    await openDetails();
    expect(
      screen.queryByText("Eligibility", { exact: true })
    ).not.toBeInTheDocument();
    expect(screen.getByText("mint capacity unavailable")).toBeVisible();
  });

  it.each([
    { coverage: undefined, balance: 0.2, capacity: "3 mints" },
    { coverage: createCoverage(), balance: 99, capacity: "2 mints" },
    {
      coverage: createCoverage({ mint_capacity: null }),
      balance: 99,
      capacity: "mint capacity unavailable",
    },
  ])(
    "preserves balance capacity in Details ($capacity)",
    async ({ coverage, balance, capacity }) => {
      renderSummary(coverage, { coverage, details: { balance } });
      await openDetails();
      const label = screen.getByText("Balance capacity", { exact: true });
      expect(label.parentElement).toHaveTextContent(capacity);
    }
  );

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
        name: "0 drops funded Action required",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Top up" })
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
