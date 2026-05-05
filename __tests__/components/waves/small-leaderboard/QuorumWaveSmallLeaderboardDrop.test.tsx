import { render } from "@testing-library/react";
import React from "react";
import { QuorumWaveSmallLeaderboardDrop } from "@/components/waves/small-leaderboard/QuorumWaveSmallLeaderboardDrop";

const defaultWaveSmallLeaderboardDrop = jest.fn(() => null);

jest.mock(
  "@/components/waves/small-leaderboard/DefaultWaveSmallLeaderboardDrop",
  () => ({
    DefaultWaveSmallLeaderboardDrop: (props: any) =>
      defaultWaveSmallLeaderboardDrop(props),
  })
);

describe("QuorumWaveSmallLeaderboardDrop", () => {
  beforeEach(() => {
    defaultWaveSmallLeaderboardDrop.mockClear();
  });

  it("forwards quorumCompact content presentation", () => {
    const drop = { id: "d1" } as any;
    const onDropClick = jest.fn();

    render(
      <QuorumWaveSmallLeaderboardDrop drop={drop} onDropClick={onDropClick} />
    );

    expect(defaultWaveSmallLeaderboardDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        drop,
        onDropClick,
        contentPresentation: "quorumCompact",
        isVotingClosed: false,
        isVotingControlsLocked: false,
      })
    );
  });

  it("forwards voting state", () => {
    const drop = { id: "d1" } as any;
    const onDropClick = jest.fn();

    render(
      <QuorumWaveSmallLeaderboardDrop
        drop={drop}
        isVotingClosed={true}
        isVotingControlsLocked={true}
        onDropClick={onDropClick}
      />
    );

    expect(defaultWaveSmallLeaderboardDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        isVotingClosed: true,
        isVotingControlsLocked: true,
      })
    );
  });
});
