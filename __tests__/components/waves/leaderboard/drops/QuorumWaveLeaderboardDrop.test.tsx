import { render } from "@testing-library/react";
import React from "react";
import { QuorumWaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/QuorumWaveLeaderboardDrop";

const defaultWaveLeaderboardDrop = jest.fn(() => null);

jest.mock(
  "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop",
  () => ({
    DefaultWaveLeaderboardDrop: (props: any) =>
      defaultWaveLeaderboardDrop(props),
  })
);

describe("QuorumWaveLeaderboardDrop", () => {
  beforeEach(() => {
    defaultWaveLeaderboardDrop.mockClear();
  });

  it("forwards quorumCompact content presentation", () => {
    const drop = { id: "d1" } as any;
    const onDropClick = jest.fn();

    render(<QuorumWaveLeaderboardDrop drop={drop} onDropClick={onDropClick} />);

    expect(defaultWaveLeaderboardDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        drop,
        onDropClick,
        contentPresentation: "quorumCompact",
      })
    );
  });
});
