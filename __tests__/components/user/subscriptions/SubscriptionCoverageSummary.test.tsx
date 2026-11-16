import { useSubscriptionAllocationStatus } from "@/components/user/subscriptions/useSubscriptionAllocationStatus";
import { subscriptionCoverageFixture } from "@/tests/support/subscriptionFixtures";
import UserPageSubscriptionsBalance from "@/components/user/subscriptions/UserPageSubscriptionsBalance";
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

jest.mock(
  "@/components/user/subscriptions/useSubscriptionAllocationStatus",
  () => ({
    useSubscriptionAllocationStatus: jest.fn(() => ({
      final: null,
      isLoading: false,
      isError: false,
      hasNoAllocation: false,
    })),
  })
);
const allocationMock = jest.mocked(useSubscriptionAllocationStatus);

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
        isLoading={false}
        isOwner
        {...extra}
      />
    );

  it("explains the selected shortfall and gives one factual deadline", () => {
    renderSummary(createCoverage());
    expect(
      screen.getByRole("heading", {
        name: "0 drops funded",
      })
    ).toBeVisible();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Top-up deadline for/)).toHaveLength(1);
    expect(screen.getByText(/Top-up deadline for/)).toHaveTextContent(
      `Top-up deadline for The Memes #561: Oct 12, 2026, 14:30 UTC.`
    );
    expect(screen.queryByText("Next unfunded")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "The immediate next intended drop is not fully funded."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Recommended: add 0.40732 ETH for 7 funded drops through The Memes #567."
      )
    ).not.toBeInTheDocument();
  });

  it.each([
    [ApiSubscriptionCoverageStatus.EarlyWarning, 6, 577],
    [ApiSubscriptionCoverageStatus.RunningLow, 2, 573],
    [ApiSubscriptionCoverageStatus.ActionRequired, 0, 571],
    [ApiSubscriptionCoverageStatus.ActionRequired, 1, 572],
  ] as const)(
    "keeps %s data intact with %i funded drops and next unfunded #%i",
    (status, funded, nextToken) => {
      const coverage = createCoverage({
        status,
        fully_funded_drops: funded,
        funded_through: funded
          ? {
              token_id: nextToken - 1,
              mint_at: new Date("2026-11-18T17:00:00Z"),
            }
          : null,
        next_unfunded: {
          ...createCoverage().next_unfunded!,
          token_id: nextToken,
        },
      });
      renderSummary(coverage);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        `${funded} ${funded === 1 ? "drop" : "drops"} funded`
      );
      for (const repeatedExplanation of [
        "You are covered for now. Plan a top up before coverage ends.",
        "Your balance covers only a few more selected drops.",
      ]) {
        expect(screen.queryByText(repeatedExplanation)).not.toBeInTheDocument();
      }
      const metrics = document.getElementById("subscription-overview-actions")!;
      expect(
        screen.getByText(`The Memes #${nextToken} is not fully funded.`)
      ).toBeVisible();
      expect(
        within(metrics).queryByText("Next unfunded")
      ).not.toBeInTheDocument();
      expect(screen.getAllByText(/Top-up deadline for/)).toHaveLength(1);
      expect(screen.getByText(/Top-up deadline for/)).toHaveTextContent(
        `Top-up deadline for The Memes #${nextToken}: Oct 12, 2026, 14:30 UTC.`
      );
      expect(screen.queryByText(/Recommended:/)).not.toBeInTheDocument();
    }
  );

  it.each([true, false])(
    "keeps the Next unfunded fact only when the deadline line does not name it (%s)",
    (hasDeadline) => {
      const coverage = createCoverage();
      renderSummary({
        ...coverage,
        next_unfunded: {
          ...coverage.next_unfunded!,
          top_up_deadline: hasDeadline
            ? coverage.next_unfunded!.top_up_deadline
            : null,
        },
      });
      const metrics = within(
        document.getElementById("subscription-overview-actions")!
      );
      expect(metrics.queryAllByText("Next unfunded")).toHaveLength(
        hasDeadline ? 0 : 1
      );
      if (!hasDeadline)
        expect(
          metrics.getByRole("link", { name: "The Memes #561" })
        ).toHaveAttribute("href", "/the-memes/561");
      expect(screen.queryAllByText(/Top-up deadline for/)).toHaveLength(
        hasDeadline ? 1 : 0
      );
    }
  );

  it("keeps top-up recommendations and deadlines owner-only", () => {
    renderSummary(createCoverage(), { isOwner: false });
    expect(
      screen.queryByText(
        "Recommended: add 0.40732 ETH for 7 funded drops through The Memes #567."
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Top-up deadline for/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "The immediate next intended drop is not fully funded."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Top up" })
    ).not.toBeInTheDocument();
  });

  it("leads with funded count, status, a visible explanation and full funded-through date", async () => {
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
      screen.getByRole("heading", { name: "8 drops funded" })
    ).toBeVisible();
    const headline = screen.getByRole("heading", {
      name: "8 drops funded",
    });
    const summary = headline.parentElement!;
    expect(within(summary).getByText(/Funded through/)).toHaveTextContent(
      `Funded through The Memes #560 · Oct 12, 2026`
    );
    expect(
      within(summary).getByRole("link", { name: "The Memes #560" })
    ).toHaveAttribute("href", "/the-memes/560");
    const explanation = "All selected drops in this forecast are funded.";
    expect(screen.getByText(explanation)).toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Forecast use" }));
    const tooltip = await screen.findByRole("tooltip");
    const report = document.getElementById("subscription-overview-actions")!;
    for (const label of ["Status", "Drops funded", "Funded through"]) {
      expect(within(report).queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.getAllByText("Covered", { exact: true })).toHaveLength(1);
    expect(screen.getAllByText("8 drops funded")).toHaveLength(1);
    expect(within(tooltip).queryByText(explanation)).not.toBeInTheDocument();
    expect(screen.getAllByText(explanation)).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: "The Memes #560" })
    ).toHaveLength(1);
    expect(
      within(report).queryByText("Balance capacity")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Forecast use")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Details" })
    ).not.toBeInTheDocument();
  });

  it.each([true, false])(
    "keeps forecast caveats in the tooltip and the explanation visible without repeating balance capacity (owner: %s)",
    async (isOwner) => {
      renderSummary(
        createCoverage({
          status: ApiSubscriptionCoverageStatus.Covered,
          fully_funded_drops: 8,
          funded_through: {
            token_id: 560,
            mint_at: new Date("2026-10-12T15:40:00Z"),
          },
          next_unfunded: null,
          recommended_top_up: null,
        }),
        { isOwner }
      );
      const report = document.getElementById("subscription-overview-actions");
      expect(report).not.toBeNull();
      expect(screen.getByText("Forecast use")).toBeVisible();
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Forecast use" }));
      const tooltip = await screen.findByRole("tooltip");
      if (report) {
        expect(report.querySelectorAll("dt")).toHaveLength(0);
        expect(within(report).queryByText(/^Next:/)).not.toBeInTheDocument();
        expect(
          within(report).queryByText(/Automatic since/)
        ).not.toBeInTheDocument();
        expect(
          within(report).queryByText(
            "Automatic airdrops of all eligible drops unless you opt-out"
          )
        ).not.toBeInTheDocument();
      }
      expect(
        screen.getByText("All selected drops in this forecast are funded.")
      ).toBeVisible();
      expect(
        within(tooltip).queryByText(
          "All selected drops in this forecast are funded."
        )
      ).not.toBeInTheDocument();
      expect(
        within(tooltip).getByText(
          "Projected from current eligibility, settings, balance, and the published Meme schedule."
        )
      ).toBeVisible();
    }
  );

  it("does not call the next drop unfunded when one intended drop is still covered", async () => {
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
      screen.getByRole("heading", { name: "1 drop funded" })
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: "Your next drop is not fully funded",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "One selected drop is fully funded. Add funds to cover more upcoming drops."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "The immediate next intended drop is not fully funded."
      )
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
    expect(screen.getByText(label, { exact: true })).toBeVisible();
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
    expect(screen.queryByText("0 drops funded")).not.toBeInTheDocument();
    expect(screen.queryByText("Funded through")).not.toBeInTheDocument();
    expect(screen.queryByText("Next unfunded")).not.toBeInTheDocument();
    expect(screen.queryByText("None", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Mode", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Balance capacity")).not.toBeInTheDocument();
    expect(screen.getByText("Forecast use")).toBeVisible();
    expect(
      screen.getAllByText(
        "Set up subscriptions to receive eligible Meme drops automatically or select individual drops."
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
      expect(screen.queryByText("Drops funded")).not.toBeInTheDocument();
      expect(screen.queryByText("Funded through")).not.toBeInTheDocument();
      expect(screen.queryByText("Next unfunded")).not.toBeInTheDocument();
      expect(screen.queryByText("Balance capacity")).not.toBeInTheDocument();
      expect(screen.getByText("Forecast use")).toBeVisible();
    }
  );

  it.each([
    null,
    ApiSubscriptionCoverageMode.Manual,
    ApiSubscriptionCoverageMode.Automatic,
  ])("omits duplicate settings fields for coverage mode %s", async (mode) => {
    renderSummary(createCoverage({ mode }));
    const report = within(
      document.getElementById("subscription-overview-actions")!
    );
    for (const label of ["Mode", "Eligibility", "Edition Preference"]) {
      expect(
        report.queryByText(label, { exact: true })
      ).not.toBeInTheDocument();
    }
    expect(report.queryByText("Balance capacity")).not.toBeInTheDocument();
  });

  it("omits the duplicate coverage refresh without reintroducing settings fields", () => {
    renderSummary(undefined, { coverage: undefined });
    expect(
      screen.queryByRole("button", { name: "Refresh coverage" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Mode", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText("Forecast use")).toBeVisible();
  });

  it.each(Object.values(ApiSubscriptionCoverageStatus))(
    "keeps %s factual for visitors without owner instructions",
    async (status) => {
      const coverage = createCoverage({
        status,
        fully_funded_drops: 1,
        funded_through: {
          token_id: 560,
          mint_at: new Date("2026-10-12T15:40:00Z"),
        },
      });
      renderSummary(coverage, {
        isOwner: false,
        action: (
          <UserPageSubscriptionsBalance
            coverage={coverage}
            details={undefined}
            show_refresh={false}
            fetching={false}
            refresh={jest.fn()}
          />
        ),
      });
      expect(screen.getByRole("heading", { level: 2 })).toBeVisible();
      expect(screen.getByText(/Funded through/)).toHaveTextContent(
        `The Memes #560 · Oct 12, 2026`
      );
      expect(screen.getByText("0.18")).toBeVisible();
      expect(screen.getByText("2 mints available")).toBeVisible();
      expect(screen.getByText("2 allocated")).toBeVisible();
      expect(
        screen.queryByText(/Top up by|Recommended:/)
      ).not.toBeInTheDocument();
      expect(
        document.getElementById("subscription-coverage-details")
      ).toBeNull();
      for (const name of ["Choose drops", "Set up", "Review settings"]) {
        expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
      }
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Forecast use" }));
      const tooltip = await screen.findByRole("tooltip");
      expect(within(tooltip).getByText("Subscription coverage")).toBeVisible();
      expect(
        screen.queryByText("Your next selected drops are fully funded.")
      ).not.toBeInTheDocument();
    }
  );

  it("keeps Covered free of Choose drops and Review settings shortcuts", () => {
    renderSummary(
      createCoverage({ status: ApiSubscriptionCoverageStatus.Covered })
    );
    expect(
      screen.queryByRole("link", { name: "Choose drops" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Review settings" })
    ).not.toBeInTheDocument();
  });

  it.each([
    [
      ApiSubscriptionCoverageStatus.NotSetUp,
      "Not set up",
      "Subscriptions are not set up for this profile.",
    ],
    [
      ApiSubscriptionCoverageStatus.NoUpcomingSelections,
      "No upcoming drops selected",
      "No drops are selected in Manual mode.",
    ],
    [
      ApiSubscriptionCoverageStatus.NoCurrentEligibility,
      "No current eligibility",
      "This profile is not currently eligible for an upcoming Meme mint.",
    ],
    [
      ApiSubscriptionCoverageStatus.Unknown,
      "Coverage unavailable",
      "Some forecast information is missing.",
    ],
  ] as const)(
    "keeps %s informative without giving visitors owner instructions",
    async (status, label, description) => {
      renderSummary(
        createCoverage({ status, funded_through: null, next_unfunded: null }),
        { isOwner: false, topUpAction: <button>Top up</button> }
      );
      expect(screen.getByRole("heading", { name: label })).toBeVisible();
      expect(screen.getByText("2 allocated")).toBeVisible();
      if (description) expect(screen.getByText(description)).toBeVisible();
      expect(
        screen.queryByText(
          /Set up subscriptions to receive|Choose a drop to see|Review settings or refresh|Adding funds does not change eligibility/
        )
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Top up" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Choose drops" })
      ).not.toBeInTheDocument();
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Forecast use" }));
      expect(
        within(await screen.findByRole("tooltip")).getByText(
          "Projected from current eligibility, settings, balance, and the published Meme schedule."
        )
      ).toBeVisible();
    }
  );

  it.each([true, false])(
    "uses the correct audience for unavailable coverage and its tooltip (owner: %s)",
    async (isOwner) => {
      renderSummary(undefined, { coverage: undefined, isOwner });
      const explanation = isOwner
        ? "Coverage is temporarily unavailable. Your subscription settings have not changed."
        : "Coverage is temporarily unavailable.";
      expect(screen.getByText(explanation)).toBeVisible();
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Forecast use" }));
      expect(
        within(await screen.findByRole("tooltip")).getByText(explanation)
      ).toBeVisible();
      if (!isOwner) {
        expect(
          screen.queryByText(/Your subscription settings have not changed/)
        ).not.toBeInTheDocument();
      }
    }
  );

  it.each([true, false])(
    "preserves hidden purchasing explanations for owner: %s",
    (isOwner) => {
      renderSummary(
        createCoverage({
          status: ApiSubscriptionCoverageStatus.NoCurrentEligibility,
          funded_through: null,
          next_unfunded: null,
        }),
        { isOwner, showFundingPrompt: false }
      );
      expect(
        screen.getByRole("heading", { name: "No current eligibility" })
      ).toBeVisible();
      expect(
        screen.queryByText(/This profile is not currently eligible/)
      ).not.toBeInTheDocument();
      expect(screen.getByText("2 allocated")).toBeVisible();
    }
  );

  it.each(Object.values(ApiSubscriptionCoverageStatus))(
    "omits the redundant Review settings shortcut in %s",
    (status) => {
      renderSummary(createCoverage({ status }));
      expect(
        screen.queryByRole("link", { name: "Review settings" })
      ).not.toBeInTheDocument();
    }
  );

  it("omits the redundant Set up shortcut without relabeling Not set up", () => {
    renderSummary(
      createCoverage({
        status: ApiSubscriptionCoverageStatus.NotSetUp,
        mode: null,
        next_unfunded: null,
        funded_through: null,
      })
    );
    expect(screen.getByRole("heading", { name: "Not set up" })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Set up" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Choose drops" })
    ).not.toBeInTheDocument();
  });

  it.each(Object.values(ApiSubscriptionCoverageStatus))(
    "keeps only the main Top up action in %s",
    async (status) => {
      const openTopUp = jest.fn();
      renderSummary(createCoverage({ status }), {
        topUpAction: <button onClick={openTopUp}>Top up</button>,
      });
      expect(
        screen.queryByRole("link", { name: "Top up subscriptions" })
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Top up" })).toHaveLength(1);
      const chooseDrops = screen.queryByRole("link", {
        name: "Choose drops",
      });
      if (status !== ApiSubscriptionCoverageStatus.NoUpcomingSelections) {
        expect(chooseDrops).not.toBeInTheDocument();
      } else {
        expect(chooseDrops).toHaveAttribute(
          "href",
          "#profile-subscriptions-upcoming"
        );
        expect(chooseDrops?.parentElement).toBe(
          screen.getByRole("button", { name: "Top up" }).parentElement
        );
      }
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Top up" }));
      expect(openTopUp).toHaveBeenCalledTimes(1);
    }
  );

  it("shows Choose drops below the summary, including with an empty balance", async () => {
    const coverage = createCoverage({
      status: ApiSubscriptionCoverageStatus.NoUpcomingSelections,
    });
    const { rerender } = renderSummary(coverage);
    expect(
      screen.queryByRole("button", { name: "Details" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose drops" })).toHaveAttribute(
      "href",
      "#profile-subscriptions-upcoming"
    );
    rerender(
      <SubscriptionCoverageSummary
        coverage={{ ...coverage, balance_eth: "0" }}
        isLoading={false}
        isOwner
      />
    );
    expect(screen.getByRole("link", { name: "Choose drops" })).toHaveAttribute(
      "href",
      "#profile-subscriptions-upcoming"
    );
    expect(
      screen.getByText(
        "No drops are selected in Manual mode. Choose a drop to see how long your balance will last."
      )
    ).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Choose drops" })).toHaveLength(
      1
    );
    expect(document.getElementById("subscription-coverage-details")).toBeNull();
  });

  it("explains when the selected shortfall has no known deadline", () => {
    renderSummary(
      createCoverage({
        next_unfunded: {
          ...createCoverage().next_unfunded!,
          top_up_deadline: null,
        },
      })
    );
    expect(screen.queryByText(/Top-up deadline for/)).not.toBeInTheDocument();
    expect(
      screen.getByText("A top-up deadline is not available yet.")
    ).toBeVisible();
  });

  it("distinguishes funded drops, forecast use and balance capacity without duplicating the capacity", async () => {
    const coverage = createCoverage({
      status: ApiSubscriptionCoverageStatus.Covered,
      fully_funded_drops: 24,
      eligibility_count: 12,
      subscribe_all_editions: true,
      mint_capacity: 1108,
      allocated_mints: 288,
      next_unfunded: null,
      recommended_top_up: null,
    });
    renderSummary(coverage, {
      action: (
        <UserPageSubscriptionsBalance
          coverage={coverage}
          details={undefined}
          show_refresh={false}
          fetching={false}
          refresh={jest.fn()}
        />
      ),
    });
    expect(
      screen.getByRole("heading", { name: "24 drops funded" })
    ).toBeVisible();
    expect(screen.getByText("1,108 mints available")).toBeVisible();
    expect(screen.getByText("288 allocated")).toBeVisible();
    expect(screen.getAllByText("1,108 mints available")).toHaveLength(1);
    expect(document.getElementById("subscription-coverage-details")).toBeNull();
  });

  it.each(Object.values(ApiSubscriptionCoverageStatus))(
    "does not duplicate the balance refresh when %s coverage loaded successfully",
    (status) => {
      renderSummary(createCoverage({ status }));
      expect(
        screen.queryByRole("button", { name: "Refresh coverage" })
      ).not.toBeInTheDocument();
    }
  );

  it("does not offer a retry during the initial coverage load", () => {
    renderSummary(undefined, { coverage: undefined, isLoading: true });
    expect(
      screen.getByRole("heading", { name: "Loading subscription coverage" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Refresh coverage" })
    ).not.toBeInTheDocument();
  });

  it.each([undefined, createCoverage()])(
    "keeps visitors without refresh controls",
    (coverage) => {
      renderSummary(coverage, { coverage, isOwner: false });
      expect(
        screen.queryByRole("button", { name: "Refresh coverage" })
      ).not.toBeInTheDocument();
    }
  );

  it("keeps the balance refresh available when coverage is unavailable", async () => {
    const refresh = jest.fn();
    renderSummary(undefined, {
      coverage: undefined,
      action: (
        <UserPageSubscriptionsBalance
          details={undefined}
          show_refresh
          fetching={false}
          refresh={refresh}
        />
      ),
    });
    expect(
      screen.getByRole("heading", { name: "Coverage unavailable" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Refresh coverage" })
    ).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Refresh balance" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps visitors read-only with neutral wording", async () => {
    renderSummary(createCoverage(), { isOwner: false });
    expect(
      screen.getByRole("heading", {
        name: "0 drops funded",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Top up" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Choose drops" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Refresh coverage" })
    ).not.toBeInTheDocument();
  });
});

it("shows no actions or unavailable forecast while the first coverage request is pending", () => {
  render(
    <SubscriptionCoverageSummary
      coverage={undefined}
      isLoading
      isOwner
      topUpAction={<button>Top up</button>}
    />
  );
  expect(
    screen.getByRole("heading", { name: "Loading subscription coverage" })
  ).toHaveClass("tw-text-sm");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
});

it.each([true, false])(
  "explains the exact funded Manual selection without an action alarm (owner: %s)",
  (isOwner) => {
    const coverage = createFundedManualCoverage();
    render(
      <SubscriptionCoverageSummary
        coverage={coverage}
        isLoading={false}
        isOwner={isOwner}
        topUpAction={<button>Top up</button>}
      />
    );
    expect(
      screen.getByRole("heading", { name: "1 drop funded" })
    ).toBeVisible();
    expect(screen.getByText("Covered", { exact: true })).toHaveClass(
      "tw-text-emerald-400"
    );
    expect(
      screen.getByText("All selected drops in this forecast are funded.")
    ).toBeVisible();
    expect(screen.queryByText("Action required")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Top up" })).toHaveLength(
      isOwner ? 1 : 0
    );
  }
);

function createFundedManualCoverage(): ApiSubscriptionCoverage {
  return {
    ...subscriptionCoverageFixture(),
    status: ApiSubscriptionCoverageStatus.ActionRequired,
    mode: ApiSubscriptionCoverageMode.Manual,
    subscribe_all_editions: false,
    eligibility_count: 1,
    fully_funded_drops: 1,
    balance_eth: "0.06529",
    mint_capacity: 1,
    allocated_mints: 1,
    funded_through: {
      token_id: 575,
      mint_at: new Date("2026-11-16T15:40:00Z"),
    },
    next_unfunded: null,
    minimum_top_up: null,
    recommended_top_up: null,
  };
}

it("limits its funded claim to the forecast and explains truncation", async () => {
  const coverage = createFundedManualCoverage();
  coverage.forecast.forecast_truncated = true;
  render(
    <SubscriptionCoverageSummary
      coverage={coverage}
      isLoading={false}
      isOwner
    />
  );
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Forecast use" }));
  expect(
    within(await screen.findByRole("tooltip")).getByText(
      "This forecast may not include all future drops."
    )
  ).toBeVisible();
});

describe("Mint-day subscription payment", () => {
  const coverage = () =>
    subscriptionCoverageFixture({
      calculated_at: new Date("2026-11-16T15:36:00Z"),
      fully_funded_drops: 0,
      balance_eth: "0",
      next_unfunded: {
        ...subscriptionCoverageFixture().next_unfunded!,
        token_id: 575,
        mint_at: new Date("2026-11-16T15:40:00Z"),
        requested_mints: 1,
        top_up_deadline: null,
      },
    });
  const paid = {
    consolidation_key: "profile-key",
    contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    token_id: 575,
    subscribed_count: 1,
    redeemed_count: 1,
    balance: 0.06529,
    airdrop_address: "0x0000000000000000000000000000000000000529",
  };
  afterEach(() =>
    allocationMock.mockReturnValue({
      final: null,
      isLoading: false,
      isError: false,
      hasNoAllocation: false,
    })
  );
  it.each([true, false])(
    "does not demand payment twice for a redeemed subscription (owner: %s)",
    (isOwner) => {
      allocationMock.mockReturnValue({
        final: paid,
        isLoading: false,
        isError: false,
        hasNoAllocation: false,
      });
      const topUp = jest.fn((primary) => (
        <button data-primary={primary}>Top up</button>
      ));
      render(
        <SubscriptionCoverageSummary
          coverage={coverage()}
          profileKey="profile-key"
          isLoading={false}
          isOwner={isOwner}
          topUpAction={topUp}
        />
      );
      expect(
        screen.getByRole("heading", { name: "Subscription paid" })
      ).toBeVisible();
      expect(
        screen.getByText(/The subscription for/)
      ).toBeVisible();
      expect(
        screen.getByText("From the remaining balance: 0 drops funded.")
      ).toBeVisible();
      expect(screen.queryByText("Action required")).not.toBeInTheDocument();
      expect(
        screen.queryByText("A top-up deadline is not available yet.")
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Next unfunded")).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "The Memes #575" })
      ).toHaveAttribute("href", "/the-memes/575");
      expect(screen.getByText("Nov 16, 2026")).toBeVisible();
      expect(screen.queryAllByRole("button", { name: "Top up" })).toHaveLength(
        isOwner ? 1 : 0
      );
      if (isOwner) expect(topUp).toHaveBeenCalledWith(false);
    }
  );
  it("does not flash an alarm or funding action while payment is being checked", () => {
    allocationMock.mockReturnValue({
      final: undefined,
      isLoading: true,
      isError: false,
      hasNoAllocation: false,
    });
    render(
      <SubscriptionCoverageSummary
        coverage={coverage()}
        profileKey="profile-key"
        isLoading={false}
        isOwner
        topUpAction={<button>Top up</button>}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Loading subscription coverage" })
    ).toBeVisible();
    expect(screen.queryByText("Action required")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Top up" })
    ).not.toBeInTheDocument();
  });
  it("keeps a failed payment read neutral instead of claiming the drop will be missed", () => {
    allocationMock.mockReturnValue({
      final: undefined,
      isLoading: false,
      isError: true,
      hasNoAllocation: false,
    });
    render(
      <SubscriptionCoverageSummary
        coverage={coverage()}
        profileKey="profile-key"
        isLoading={false}
        isOwner
      />
    );
    expect(
      screen.getByText("Coverage unavailable", { exact: true })
    ).toBeVisible();
    expect(
      screen.getByText(/Today's subscription could not be checked/)
    ).toBeVisible();
    expect(screen.queryByText("Action required")).not.toBeInTheDocument();
  });
  it("preserves the genuine unpaid selected-drop warning after the payment check", () => {
    allocationMock.mockReturnValue({
      final: null,
      isLoading: false,
      isError: false,
      hasNoAllocation: false,
    });
    render(
      <SubscriptionCoverageSummary
        coverage={coverage()}
        profileKey="profile-key"
        isLoading={false}
        isOwner
      />
    );
    expect(screen.getByText("Action required")).toHaveClass("tw-text-error");
    expect(
      screen.getByText("The Memes #575 is not fully funded.")
    ).toBeVisible();
  });
});
