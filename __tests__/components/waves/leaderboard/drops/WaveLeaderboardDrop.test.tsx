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
  const onDropClick = jest.fn();

  beforeEach(() => {
    useWaveLeaderboardRendererSet.mockReset();
    onDropClick.mockReset();
  });

  it("renders the resolved leaderboard renderer", () => {
    let rendererProps: any;

    useWaveLeaderboardRendererSet.mockReturnValue({
      variant: "quorum",
      LeaderboardDrop: (props: any) => {
        rendererProps = props;
        return <div data-testid="quorum" />;
      },
      SmallLeaderboardDrop: () => null,
    });

    render(
      <WaveLeaderboardDrop drop={drop} wave={wave} onDropClick={onDropClick} />
    );

    expect(useWaveLeaderboardRendererSet).toHaveBeenCalledWith("w1");
    expect(rendererProps).toEqual({ drop, wave, onDropClick });
    expect(screen.getByTestId("quorum")).toBeInTheDocument();
  });
});
