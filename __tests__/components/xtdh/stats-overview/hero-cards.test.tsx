import { render, screen, within } from "@testing-library/react";

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
};

describe("CurrentMultiplierCard", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders combined multiplier trajectory details", () => {
    render(
      <CurrentMultiplierCard
        multiplier={baseMultiplier}
        lastUpdatedAt="2024-01-01T11:30:00Z"
      />
    );

    expect(
      screen.getByRole("region", { name: "Multiplier trajectory" })
    ).toBeInTheDocument();
    expect(screen.getByText("0.10× Base TDH")).toBeInTheDocument();
    expect(screen.getByText("10% of Base TDH")).toBeInTheDocument();
    expect(screen.getByText("0.12× Base TDH")).toBeInTheDocument();
    expect(screen.getByText("12% of Base TDH")).toBeInTheDocument();
    expect(screen.getByText("30 days")).toBeInTheDocument();
    expect(screen.getByText("+0.02×")).toBeInTheDocument();
    expect(screen.getByText("Updated 30 min ago")).toBeInTheDocument();
    expect(screen.getByText("Growth Path")).toBeInTheDocument();
  });

  it("falls back when countdown cannot be parsed", () => {
    render(
      <CurrentMultiplierCard
        multiplier={{ ...baseMultiplier, nextIncreaseDate: "July 20, 2025" }}
      />
    );

    expect(screen.getByText("Next increase: July 20, 2025")).toBeInTheDocument();
    expect(screen.queryByText("30 days")).not.toBeInTheDocument();
  });

  it("renders growth milestones inline", () => {
    render(<CurrentMultiplierCard multiplier={baseMultiplier} />);

    const trajectory = screen.getByRole("region", {
      name: "Multiplier trajectory",
    });

    expect(
      within(trajectory).getAllByText("+30%").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(trajectory).getAllByText("≈ 36 months").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(trajectory).getAllByText("+100%").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(trajectory).getAllByText("≈ 120 months").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders fallback copy when milestones are not provided", () => {
    render(
      <CurrentMultiplierCard
        multiplier={{ ...baseMultiplier, milestones: [] }}
      />
    );

    expect(
      screen.getByText("Long-term milestones will publish soon.")
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
