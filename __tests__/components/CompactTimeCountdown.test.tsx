import { render, screen } from "@testing-library/react";
import React from "react";
import { CompactTimeCountdown } from "@/components/waves/leaderboard/time/CompactTimeCountdown";

const baseTime = { days: 0, hours: 1, minutes: 2, seconds: 3 };

describe("CompactTimeCountdown", () => {
  it("renders the compact countdown with a complete accessible description", () => {
    render(<CompactTimeCountdown timeLeft={baseTime} locale="en-US" />);

    expect(
      screen.getByText("Next winner in 1 hour, 2 minutes, 3 seconds")
    ).toHaveClass("tw-sr-only");
    expect(screen.getByText("Next winner")).toBeInTheDocument();
    expect(screen.getByText("h")).toBeInTheDocument();
    expect(screen.getByText("m")).toBeInTheDocument();
    expect(screen.getByText("s")).toBeInTheDocument();
  });

  it("includes localized days with locale-aware pluralization", () => {
    render(
      <CompactTimeCountdown
        timeLeft={{ ...baseTime, days: 2 }}
        locale="fr-FR"
      />
    );

    expect(
      screen.getByText(
        "Prochain gagnant dans 2 jours, 1 heure, 2 minutes, 3 secondes"
      )
    ).toHaveClass("tw-sr-only");
    expect(screen.getByText("Prochain gagnant")).toBeInTheDocument();
  });
});
