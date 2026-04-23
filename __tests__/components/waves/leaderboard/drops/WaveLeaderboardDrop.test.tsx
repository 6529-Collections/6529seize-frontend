import { render, screen } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrop";

const useWaveLeaderboardRendererSet = jest.fn();

jest.mock("@/components/waves/leaderboard/leaderboardRendererRegistry", () => ({
  useWaveLeaderboardRendererSet: (...args: any[]) =>
    useWaveLeaderboardRendererSet(...args),
}));

describe("WaveLeaderboardDrop", () => {
  const drop = { id: "d1" } as any;
  const wave = { id: "w1" } as any;

  beforeEach(() => {
    useWaveLeaderboardRendererSet.mockReset();
  });

  it("renders the resolved leaderboard renderer", () => {
    useWaveLeaderboardRendererSet.mockReturnValue({
      variant: "quorum",
      LeaderboardDrop: () => <div data-testid="quorum" />,
      SmallLeaderboardDrop: () => null,
    });

    render(
      <WaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />
    );

    expect(useWaveLeaderboardRendererSet).toHaveBeenCalledWith("w1");
    expect(screen.getByTestId("quorum")).toBeInTheDocument();
  });
});
