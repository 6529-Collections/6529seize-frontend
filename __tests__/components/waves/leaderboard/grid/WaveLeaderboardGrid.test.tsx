import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WaveLeaderboardGrid } from "@/components/waves/leaderboard/grid/WaveLeaderboardGrid";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/hooks/useWaveDropsLeaderboard", () => ({
  useWaveDropsLeaderboard: jest.fn(),
  WaveDropsLeaderboardSort: { RANK: "RANK" },
  WAVE_DROPS_LEADERBOARD_MAX_PAGES: 10,
}));
jest.mock(
  "@/components/waves/leaderboard/WaveLeaderboardVirtualizedRows",
  () => ({
    useLeaderboardLeadingItemCount: () => 0,
    WaveLeaderboardVirtualizedRows: ({
      items,
      renderItem,
      hasNextPage,
      fetchNextPage,
    }: any) => (
      <div>
        {items.map((item: any) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
        {hasNextPage ? (
          <button onClick={fetchNextPage}>Load more drops</button>
        ) : null}
      </div>
    ),
  })
);
jest.mock(
  "@/components/waves/leaderboard/WaveLeaderboardVotingModal",
  () => ({
    useWaveLeaderboardVotingModal: () => ({
      votingDrop: null,
      openVotingModal: jest.fn(),
      closeVotingModal: jest.fn(),
    }),
    WaveLeaderboardVotingModal: () => null,
  })
);

jest.mock(
  "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem",
  () => ({
    WaveLeaderboardGridItem: ({
      drop,
      isVotingClosed,
      isVotingControlsLocked,
      mode,
      onDropClick,
    }: any) => (
      <div
        data-testid="grid-item"
        data-is-voting-closed={String(isVotingClosed)}
        data-is-voting-controls-locked={String(isVotingControlsLocked)}
        onClick={() => onDropClick(drop)}
      >
        {drop.id}:{mode}
      </div>
    ),
  })
);

const { useWaveDropsLeaderboard } = require("@/hooks/useWaveDropsLeaderboard");

const wave = {
  id: "1",
  wave: { type: ApiWaveType.Rank, winning_threshold: null },
} as any;

describe("WaveLeaderboardGrid", () => {
  const scrollContainerRef = React.createRef<HTMLDivElement>();

  it("shows loading state", () => {
    (useWaveDropsLeaderboard as jest.Mock).mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: true,
      isFetchingNextPage: false,
      pageMetadata: [],
      queryWindowKey: "test-window",
    });

    const { container } = render(
      <WaveLeaderboardGrid
        wave={wave}
        sort="RANK"
        mode="compact"
        onDropClick={jest.fn()}
        scrollContainerRef={scrollContainerRef}
      />
    );

    expect(
      screen.getByRole("status", { name: "Loading drops" })
    ).toBeInTheDocument();
    const loadingMedia = container.querySelector(".tw-aspect-square");
    expect(loadingMedia).toBeInTheDocument();
    expect(loadingMedia).not.toHaveClass("tw-aspect-[16/9]");
    expect(loadingMedia).toHaveClass("tw-min-h-[14rem]");
    expect(loadingMedia).toHaveClass("md:tw-min-h-[15rem]");
    expect(loadingMedia).toHaveClass("tw-animate-pulse");
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
      isFetchingPreviousPage: false,
      isFetchNextPageError: false,
      isFetchPreviousPageError: false,
      fetchPreviousPage: jest.fn(),
      hasPreviousPage: false,
      pageMetadata: [],
      queryWindowKey: "test-window",
    });

    render(
      <WaveLeaderboardGrid
        wave={wave}
        sort="RANK"
        mode="content_only"
        isVotingClosed={true}
        isVotingControlsLocked={true}
        onDropClick={onDropClick}
        scrollContainerRef={scrollContainerRef}
      />
    );

    expect(screen.getByTestId("grid-item")).toHaveTextContent(
      "d1:content_only"
    );
    expect(screen.getByTestId("grid-item")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
    expect(screen.getByTestId("grid-item")).toHaveAttribute(
      "data-is-voting-controls-locked",
      "true"
    );
    fireEvent.click(screen.getByRole("button", { name: "Load more drops" }));
    expect(fetchNextPage).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("grid-item"));
    expect(onDropClick).toHaveBeenCalledWith({ id: "d1" });
  });
});
