import { render, screen } from "@testing-library/react";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { SingleWaveDropVoteStats } from "@/components/waves/drop/SingleWaveDropVoteStats";

describe("SingleWaveDropVoteStats", () => {
  it("displays current and max rating with default wave scope", () => {
    render(
      <SingleWaveDropVoteStats
        currentRating={1234}
        maxRating={5678}
        label="Rep"
      />
    );
    expect(screen.getByText("Your votes:")).toBeInTheDocument();
    expect(screen.getByText(/1,234\s*Rep/i)).toBeInTheDocument();
    expect(screen.getByText("Max for wave:")).toBeInTheDocument();
    expect(screen.getByText(/5,678\s*Rep/i)).toBeInTheDocument();
  });

  it("displays max per drop for drop-scoped voting", () => {
    render(
      <SingleWaveDropVoteStats
        currentRating={10}
        maxRating={100}
        label="TDH"
        creditScope={ApiWaveCreditScope.Drop}
      />
    );

    expect(screen.getByText("Max per drop:")).toBeInTheDocument();
    expect(screen.getByText(/100\s*TDH/i)).toBeInTheDocument();
  });
});
