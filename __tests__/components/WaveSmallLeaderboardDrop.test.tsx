import { render, screen } from "@testing-library/react";
import React from "react";

const useWaveLeaderboardRendererSet = jest.fn();

jest.mock("@/components/waves/leaderboard/leaderboardRendererRegistry", () => ({
  useWaveLeaderboardRendererSet: (...args: any[]) =>
    useWaveLeaderboardRendererSet(...args),
}));

const {
  WaveSmallLeaderboardDrop,
} = require("@/components/waves/small-leaderboard/WaveSmallLeaderboardDrop");

describe("WaveSmallLeaderboardDrop", () => {
  const drop = {} as any;
  const wave = { id: "w1" } as any;
  const onDropClick = jest.fn();

  beforeEach(() => {
    useWaveLeaderboardRendererSet.mockReset();
  });

  it("renders the resolved small leaderboard renderer", () => {
    const smallLeaderboardDrop = jest.fn(() => <div>quorum</div>);
    useWaveLeaderboardRendererSet.mockReturnValue({
      variant: "quorum",
      LeaderboardDrop: () => null,
      SmallLeaderboardDrop: smallLeaderboardDrop,
    });

    render(
      <WaveSmallLeaderboardDrop
        drop={drop}
        wave={wave}
        isVotingClosed={true}
        isVotingControlsLocked={true}
        onDropClick={onDropClick}
      />
    );
    expect(useWaveLeaderboardRendererSet).toHaveBeenCalledWith("w1");
    expect(smallLeaderboardDrop.mock.calls[0]?.[0]).toEqual({
      drop,
      isVotingClosed: true,
      isVotingControlsLocked: true,
      onDropClick,
    });
    expect(screen.getByText("quorum")).toBeInTheDocument();
  });
});
