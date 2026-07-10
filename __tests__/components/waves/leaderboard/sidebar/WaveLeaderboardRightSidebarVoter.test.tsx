import { render, screen } from "@testing-library/react";
import { WaveLeaderboardRightSidebarVoter } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoter";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

const baseVoter = {
  voter: { handle: "alice", pfp: "" },
  positive_votes_summed: 2,
  negative_votes_summed: 0,
  absolute_votes_summed: 2,
};

describe("WaveLeaderboardRightSidebarVoter", () => {
  it("shows positive indicator when positive votes exist", () => {
    render(
      <WaveLeaderboardRightSidebarVoter
        voter={baseVoter as any}
        position={1}
        creditType={ApiWaveCreditType.Rep}
      />
    );
    expect(screen.getByText("+2")).toHaveClass("tw-text-emerald-400");
    expect(screen.queryByText("-1")).not.toBeInTheDocument();
  });

  it("shows negative indicator when negative votes exist", () => {
    const voter = { ...baseVoter, negative_votes_summed: 1 };
    render(
      <WaveLeaderboardRightSidebarVoter
        voter={voter as any}
        position={1}
        creditType={ApiWaveCreditType.Rep}
      />
    );
    expect(screen.getByText("-1")).toHaveClass("tw-text-rose-400");
  });
});
