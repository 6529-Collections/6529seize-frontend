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

  it("keeps the funding facts without repeating top-up modal guidance", () => {
    renderSummary(createCoverage());
    expect(
      screen.getByRole("heading", {
        name: "0 drops funded Action required",
      })
    ).toBeVisible();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
    expect(screen.getByText("Next unfunded")).toBeVisible();
    expect(
      screen.queryByText("Your next selected drop is not fully funded.")
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
        "Your next selected drop is not fully funded.",
        "One selected drop is fully funded. Add funds to cover more upcoming drops.",
      ]) {
        expect(screen.queryByText(repeatedExplanation)).not.toBeInTheDocument();
      }
      const metrics = document.getElementById("subscription-overview-actions")!;
      expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
      expect(
        within(metrics).getByRole("link", { name: `The Memes #${nextToken}` })
      ).toHaveAttribute("href", `/the-memes/${nextToken}`);
      expect(within(metrics).getByText(/Oct 14, 2026/)).toBeVisible();
      expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Recommended:/)).not.toBeInTheDocument();
    }
  );

  it.each([true, false])(
    "omits the next-unfunded row only when that token is in Upcoming Drops (present: %s)",
    (present) => {
      renderSummary(createCoverage(), {
        upcomingTokenIds: present ? [561] : [560],
      });
      const metrics = within(
        document.getElementById("subscription-overview-actions")!
      );
      if (present) {
        expect(metrics.queryByText("Next unfunded")).not.toBeInTheDocument();
        expect(
          metrics.queryByRole("link", { name: "The Memes #561" })
        ).not.toBeInTheDocument();
      } else {
        expect(metrics.getByText("Next unfunded")).toBeVisible();
        expect(metrics.getByText(/Oct 14, 2026/)).toBeVisible();
      }
      expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
      expect(screen.getByText("Forecast use")).toBeVisible();
    }
  );

  it("keeps top-up recommendations and deadlines owner-only", () => {
    renderSummary(createCoverage(), { isOwner: false });
    expect(
      screen.queryByText(
        "Recommended: add 0.40732 ETH for 7 funded drops through The Memes #567."
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Top up", exact: true })
    ).not.toBeInTheDocument();
  });

  it("leads with funded count, status and full funded-through date, with its explanation in the forecast tooltip", async () => {
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
    const explanation = "Your next selected drops are fully funded.";
    expect(screen.queryByText(explanation)).not.toBeInTheDocument();
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
    expect(within(tooltip).getByText(explanation)).toBeVisible();
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
    "keeps forecast visible and its explanation in the tooltip without repeating balance capacity (owner: %s)",
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
      const explanation = within(tooltip).queryByText(
        "Your next selected drops are fully funded."
      );
      if (isOwner) expect(explanation).toBeVisible();
      else expect(explanation).not.toBeInTheDocument();
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
      screen.getByRole("heading", { name: "1 drop funded Action required" })
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
      screen.queryByText("Your next selected drop is not fully funded.")
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
        "The Memes #560 · Oct 12, 2026"
      );
      expect(screen.getByText("0.18")).toBeVisible();
      expect(screen.getByText("(2 mints available)")).toBeVisible();
      expect(screen.getByText("2 allocated")).toBeVisible();
      expect(
        screen.queryByText(/Top up by|Recommended:/)
      ).not.toBeInTheDocument();
      expect(
        document.getElementById("subscription-coverage-details")
      ).toBeNull();
      for (const name of ["Choose drops", "Set up", "Review settings"]) {
        expect(
          screen.queryByRole("link", { name, exact: true })
        ).not.toBeInTheDocument();
      }
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Forecast use" }));
      const tooltip = await screen.findByRole("tooltip");
      expect(within(tooltip).getByText("Subscription coverage")).toBeVisible();
      expect(
        screen.queryByText(
          /Choose a drop|Set up subscriptions|Review settings or refresh|Your next selected drops/
        )
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
    ApiSubscriptionCoverageStatus.NotSetUp,
    ApiSubscriptionCoverageStatus.NoUpcomingSelections,
    ApiSubscriptionCoverageStatus.NoCurrentEligibility,
    ApiSubscriptionCoverageStatus.Unknown,
  ])("does not show owner setup guidance for a visitor in %s", (status) => {
    renderSummary(
      createCoverage({ status, funded_through: null, next_unfunded: null }),
      { isOwner: false }
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeVisible();
    expect(screen.getByText("2 allocated")).toBeVisible();
    expect(
      screen.queryByText(
        /Choose a drop|Set up subscriptions|Review settings or refresh|Adding funds does not change eligibility/
      )
    ).not.toBeInTheDocument();
  });

  it.each(Object.values(ApiSubscriptionCoverageStatus))(
    "omits the redundant Review settings shortcut in %s",
    (status) => {
      renderSummary(createCoverage({ status }));
      expect(
        screen.queryByRole("link", { name: "Review settings", exact: true })
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
    expect(
      screen.getByRole("heading", { name: "Not set up", exact: true })
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Set up", exact: true })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Choose drops", exact: true })
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
      expect(
        screen.getAllByRole("button", { name: "Top up", exact: true })
      ).toHaveLength(1);
      const footer = within(
        document.getElementById("subscription-overview-actions")!
      );
      const chooseDrops = footer.queryByRole("link", {
        name: "Choose drops",
        exact: true,
      });
      if (status !== ApiSubscriptionCoverageStatus.NoUpcomingSelections) {
        expect(chooseDrops).not.toBeInTheDocument();
      } else {
        expect(chooseDrops).toHaveAttribute(
          "href",
          "#profile-subscriptions-upcoming"
        );
        expect(chooseDrops?.parentElement).toBe(
          footer.getByRole("button", { name: "Top up", exact: true })
            .parentElement
        );
      }
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Top up", exact: true }));
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

  it("omits unavailable deadline guidance from the summary", () => {
    renderSummary(
      createCoverage({
        next_unfunded: {
          ...createCoverage().next_unfunded!,
          top_up_deadline: null,
        },
      })
    );
    expect(screen.queryByText(/Top up by/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("No authoritative top-up deadline is available yet.")
    ).not.toBeInTheDocument();
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
      screen.getByRole("heading", { name: "24 drops funded Covered" })
    ).toBeVisible();
    expect(screen.getByText("(1,108 mints available)")).toBeVisible();
    expect(screen.getByText("288 allocated")).toBeVisible();
    expect(screen.getAllByText("(1,108 mints available)")).toHaveLength(1);
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
        name: "0 drops funded Action required",
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
