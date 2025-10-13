import { render, screen } from "@testing-library/react";

import { buildMultiplierCycleProgress } from "@/components/xtdh/stats-overview/data-builders";

import { CurrentMultiplierCard } from "@/components/xtdh/stats-overview/CurrentMultiplierCard";
import { SummaryActionsCard } from "@/components/xtdh/stats-overview/SummaryActionsCard";
import type { NetworkStats } from "@/components/xtdh/stats-overview/types";

const baseMultiplier: NetworkStats["multiplier"] = {
  current: 0.1,
  nextValue: 0.12,
  nextIncreaseDate: "in 30 days",
  milestones: [
    { percentage: 30, timeframe: "36 months" },
    { percentage: 100, timeframe: "120 months" },
  ],
  cycleProgress: buildMultiplierCycleProgress("in 30 days"),
};

describe("CurrentMultiplierCard", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders multiplier trajectory details with clear headings", () => {
    render(
      <CurrentMultiplierCard
        multiplier={baseMultiplier}
        lastUpdatedAt="2024-01-01T11:30:00Z"
      />
    );

    expect(
      screen.getByRole("region", { name: "Multiplier trajectory" })
    ).toBeInTheDocument();
    expect(screen.getByText("Current Multiplier")).toBeInTheDocument();
    expect(screen.getByText("Next Multiplier")).toBeInTheDocument();
    expect(screen.getByText("0.10× Base TDH")).toBeInTheDocument();
    expect(screen.getByText("10% of Base TDH")).toBeInTheDocument();
    expect(screen.getByText("0.12× Base TDH")).toBeInTheDocument();
    expect(screen.getByText("12% of Base TDH")).toBeInTheDocument();
    expect(screen.getByText("30 days")).toBeInTheDocument();
    expect(screen.getByText("+0.02×")).toBeInTheDocument();
    expect(screen.getByText("Updated 30 min ago")).toBeInTheDocument();
    expect(
      screen.getByText("Current Progress to Next Multiplier")
    ).toBeInTheDocument();
    expect(
      screen.getByText("40% complete to next increase")
    ).toBeInTheDocument();
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "40");
  });

  it("falls back when countdown cannot be parsed", () => {
    render(
      <CurrentMultiplierCard
        multiplier={{
          ...baseMultiplier,
          nextIncreaseDate: "July 20, 2025",
          cycleProgress: null,
        }}
      />
    );

    expect(
      screen.getByText("Progress data will publish soon.")
    ).toBeInTheDocument();
    expect(screen.queryByText("30 days")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows unlocked state when cycle progress reaches completion", () => {
    render(
      <CurrentMultiplierCard
        multiplier={{
          ...baseMultiplier,
          nextIncreaseDate: "in 0 days",
          cycleProgress: buildMultiplierCycleProgress("in 0 days"),
        }}
      />
    );

    expect(
      screen.getByText("Next multiplier unlocked")
    ).toBeInTheDocument();
  });
});

describe("SummaryActionsCard", () => {
  it("shows primary and secondary calls to action", () => {
    render(<SummaryActionsCard />);

    const primaryCta = screen.getByRole("link", { name: "View my xTDH" });
    expect(primaryCta).toHaveAttribute("href", "/xtdh/me");

    const secondaryCta = screen.getByRole("link", { name: "Explore xTDH docs" });
    expect(secondaryCta).toHaveAttribute("href", "/docs/xtdh");
  });
});
