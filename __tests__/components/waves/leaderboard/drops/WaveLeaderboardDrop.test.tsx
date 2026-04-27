import React from "react";
import { render, screen } from "@testing-library/react";
import { WaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrop";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock(
  "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop",
  () => ({
    DefaultWaveLeaderboardDrop: (p: any) => (
      <div
        data-testid="default"
        data-winning-threshold={p.winningThreshold ?? ""}
      >
        {p.drop.id}
      </div>
    ),
  })
);
jest.mock("@/components/memes/drops/MemesLeaderboardDrop", () => ({
  MemesLeaderboardDrop: (p: any) => (
    <button data-testid="memes" onClick={p.onSourceDropDeleted}>
      {p.drop.id}
    </button>
  ),
}));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));

const useWave = require("@/hooks/useWave").useWave as jest.Mock;

describe("WaveLeaderboardDrop", () => {
  const wave = { id: "w" } as any;
  const drop = { id: "d" } as any;

  it("renders memes drop when wave is memes", () => {
    useWave.mockReturnValue({ isMemesWave: true });
    render(
      <WaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />
    );
    expect(screen.getByTestId("memes")).toHaveTextContent("d");
  });

  it("passes source deletion callback to memes drop", () => {
    const onSourceDropDeleted = jest.fn();
    useWave.mockReturnValue({ isMemesWave: true });
    render(
      <WaveLeaderboardDrop
        drop={drop}
        wave={wave}
        onDropClick={jest.fn()}
        onSourceDropDeleted={onSourceDropDeleted}
      />
    );
    screen.getByTestId("memes").click();
    expect(onSourceDropDeleted).toHaveBeenCalledTimes(1);
  });

  it("renders default drop otherwise", () => {
    useWave.mockReturnValue({ isMemesWave: false });
    render(
      <WaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />
    );
    expect(screen.getByTestId("default")).toHaveTextContent("d");
  });

  it("passes approve threshold to default drops", () => {
    const approveWave = {
      id: "w",
      wave: { type: ApiWaveType.Approve, winning_threshold: 7 },
    } as any;
    useWave.mockReturnValue({ isMemesWave: false });

    render(
      <WaveLeaderboardDrop
        drop={drop}
        wave={approveWave}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("default")).toHaveAttribute(
      "data-winning-threshold",
      "7"
    );
  });
});
