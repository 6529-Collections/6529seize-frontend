import { render, screen } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrop";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const useWaveLeaderboardRendererSet = jest.fn();

jest.mock("@/components/waves/leaderboard/leaderboardRendererRegistry", () => ({
  useWaveLeaderboardRendererSet: (...args: any[]) =>
    useWaveLeaderboardRendererSet(...args),
}));

describe("WaveLeaderboardDrop", () => {
  const drop = { id: "d1" } as any;
  const wave = {
    id: "w1",
    wave: { type: ApiWaveType.Rank, winning_threshold: null },
  } as any;
  const onDropClick = jest.fn();
  let rendererProps: any;

  beforeEach(() => {
    rendererProps = undefined;
    useWaveLeaderboardRendererSet.mockReset();
    useWaveLeaderboardRendererSet.mockReturnValue({
      variant: "quorum",
      LeaderboardDrop: (props: any) => {
        rendererProps = props;
        return <div data-testid="resolved-renderer">{props.drop.id}</div>;
      },
      SmallLeaderboardDrop: () => null,
    });
    onDropClick.mockReset();
  });

  it("renders the resolved leaderboard renderer", () => {
    render(
      <WaveLeaderboardDrop drop={drop} wave={wave} onDropClick={onDropClick} />
    );

    expect(useWaveLeaderboardRendererSet).toHaveBeenCalledWith("w1");
    expect(rendererProps).toEqual({
      drop,
      wave,
      onDropClick,
      onSourceDropDeleted: undefined,
      isVotingClosed: false,
      isVotingControlsLocked: false,
      winningThreshold: null,
      winningThresholdMinDurationMs: null,
    });
    expect(screen.getByTestId("resolved-renderer")).toHaveTextContent("d1");
  });

  it("passes source deletion callback to the resolved renderer", () => {
    const onSourceDropDeleted = jest.fn();

    render(
      <WaveLeaderboardDrop
        drop={drop}
        wave={wave}
        onDropClick={onDropClick}
        onSourceDropDeleted={onSourceDropDeleted}
      />
    );

    expect(rendererProps.onSourceDropDeleted).toBe(onSourceDropDeleted);
  });

  it("passes approve threshold to the resolved renderer", () => {
    const approveWave = {
      id: "w2",
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 7,
        winning_threshold_min_duration_ms: 120_000,
      },
    } as any;

    render(
      <WaveLeaderboardDrop
        drop={drop}
        wave={approveWave}
        onDropClick={onDropClick}
      />
    );

    expect(rendererProps.winningThreshold).toBe(7);
    expect(rendererProps.winningThresholdMinDurationMs).toBe(120_000);
  });

  it("passes closed voting state to the resolved renderer", () => {
    render(
      <WaveLeaderboardDrop
        drop={drop}
        wave={wave}
        onDropClick={onDropClick}
        isVotingClosed={true}
      />
    );

    expect(rendererProps.isVotingClosed).toBe(true);
  });

  it("passes locked voting controls state to the resolved renderer", () => {
    render(
      <WaveLeaderboardDrop
        drop={drop}
        wave={wave}
        onDropClick={onDropClick}
        isVotingControlsLocked={true}
      />
    );

    expect(rendererProps.isVotingControlsLocked).toBe(true);
  });
});
