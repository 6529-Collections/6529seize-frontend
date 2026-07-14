import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { WaveLeaderboardGallery } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGallery";
import { AuthContext } from "@/components/auth/Auth";
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
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem",
  () => ({
    WaveLeaderboardGalleryItem: ({
      drop,
      isVotingClosed,
      isVotingControlsLocked,
      onDropClick,
    }: any) => (
      <div
        data-testid="item"
        data-is-voting-closed={String(isVotingClosed)}
        data-is-voting-controls-locked={String(isVotingControlsLocked)}
        onClick={() => onDropClick(drop)}
      >
        {drop.id}
      </div>
    ),
  })
);

const { useWaveDropsLeaderboard } = require("@/hooks/useWaveDropsLeaderboard");

const wave = {
  id: "1",
  wave: { type: ApiWaveType.Rank, winning_threshold: null },
} as any;
const authValue = { connectedProfile: { handle: "user" } } as any;

function renderGallery(overrides: any) {
  (useWaveDropsLeaderboard as jest.Mock).mockReturnValue({
    drops: overrides.drops || [],
    fetchNextPage: overrides.fetchNextPage || jest.fn(),
    hasNextPage: overrides.hasNextPage || false,
    isFetching: overrides.isFetching || false,
    isFetchingNextPage: overrides.isFetchingNextPage || false,
    isFetchingPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    fetchPreviousPage: jest.fn(),
    hasPreviousPage: false,
    pageMetadata: [],
    queryWindowKey: "test-window",
  });
  const scrollContainerRef = React.createRef<HTMLDivElement>();
  return render(
    <AuthContext.Provider value={authValue}>
      <WaveLeaderboardGallery
        wave={wave}
        sort="RANK"
        isVotingClosed={overrides.isVotingClosed}
        isVotingControlsLocked={overrides.isVotingControlsLocked}
        onDropClick={overrides.onDropClick || jest.fn()}
        scrollContainerRef={scrollContainerRef}
      />
    </AuthContext.Provider>
  );
}

it("shows loading when fetching and no drops", () => {
  renderGallery({ isFetching: true });
  expect(
    screen.getByText("Loading drops...", { selector: "div" })
  ).toBeInTheDocument();
});

it("shows empty message when no drops", () => {
  renderGallery({});
  expect(screen.getByText("No drops to show")).toBeInTheDocument();
});

it("renders drops with load more button", () => {
  const fetchNextPage = jest.fn();
  const onDropClick = jest.fn();
  const drops = [
    { id: "d1", parts: [{ media: [{ url: "a", mime_type: "image/jpeg" }] }] },
  ];
  renderGallery({
    drops,
    hasNextPage: true,
    fetchNextPage,
    isVotingClosed: true,
    isVotingControlsLocked: true,
    onDropClick,
  });
  expect(screen.getByTestId("item")).toHaveTextContent("d1");
  expect(screen.getByTestId("item")).toHaveAttribute(
    "data-is-voting-closed",
    "true"
  );
  expect(screen.getByTestId("item")).toHaveAttribute(
    "data-is-voting-controls-locked",
    "true"
  );
  const button = screen.getByRole("button", { name: "Load more drops" });
  fireEvent.click(button);
  expect(fetchNextPage).toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("item"));
  expect(onDropClick).toHaveBeenCalledWith(drops[0]);
});
