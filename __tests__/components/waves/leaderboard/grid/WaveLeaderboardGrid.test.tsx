import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WaveLeaderboardGrid } from "@/components/waves/leaderboard/grid/WaveLeaderboardGrid";

jest.mock("@/hooks/useWaveDropsLeaderboard", () => ({
  useWaveDropsLeaderboard: jest.fn(),
  WaveDropsLeaderboardSort: { RANK: "RANK" },
}));

jest.mock(
  "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem",
  () => ({
    WaveLeaderboardGridItem: ({ drop, mode, onDropClick }: any) => (
      <div data-testid="grid-item" onClick={() => onDropClick(drop)}>
        {drop.id}:{mode}
      </div>
    ),
  })
);

const { useWaveDropsLeaderboard } = require("@/hooks/useWaveDropsLeaderboard");

const wave = { id: "1" } as any;

describe("WaveLeaderboardGrid", () => {
  it("shows loading state", () => {
    (useWaveDropsLeaderboard as jest.Mock).mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: true,
      isFetchingNextPage: false,
    });

    render(
      <WaveLeaderboardGrid
        wave={wave}
        sort="RANK"
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByText("Loading drops...")).toBeInTheDocument();
  });

  it("renders drops and load more action", () => {
    const fetchNextPage = jest.fn();
    const onDropClick = jest.fn();

    (useWaveDropsLeaderboard as jest.Mock).mockReturnValue({
      drops: [{ id: "d1" }],
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
    });

    render(
      <WaveLeaderboardGrid
        wave={wave}
        sort="RANK"
        mode="content_only"
        onDropClick={onDropClick}
      />
    );

    expect(screen.getByTestId("grid-item")).toHaveTextContent(
      "d1:content_only"
    );
    fireEvent.click(screen.getByRole("button", { name: "Load more drops" }));
    expect(fetchNextPage).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("grid-item"));
    expect(onDropClick).toHaveBeenCalledWith({ id: "d1" });
  });
});
