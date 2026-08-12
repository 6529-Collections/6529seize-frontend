import { render, screen } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardDrops } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrops";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";

const hook = jest.fn();

jest.mock("@/hooks/useWaveDropsLeaderboard", () => {
  const actual = jest.requireActual(
    "../../../../../hooks/useWaveDropsLeaderboard"
  );
  return {
    __esModule: true,
    ...actual,
    useWaveDropsLeaderboard: (...args: any[]) => hook(...args),
  };
});

jest.mock(
  "@/components/waves/leaderboard/WaveLeaderboardVirtualizedRows",
  () => ({
    useLeaderboardLeadingItemCount: () => 0,
    WaveLeaderboardVirtualizedRows: ({
      items,
      renderItem,
      hasNextPage,
      fetchNextPage,
      autoLoadNext,
    }: any) => (
      <div>
        {items.map((item: any) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
        {autoLoadNext && hasNextPage ? (
          <button onClick={fetchNextPage}>Trigger next page</button>
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

jest.mock("@/components/waves/leaderboard/drops/WaveLeaderboardDrop", () => ({
  WaveLeaderboardDrop: (props: any) => (
    <button
      data-testid="drop"
      data-is-voting-closed={String(props.isVotingClosed)}
      data-is-voting-controls-locked={String(props.isVotingControlsLocked)}
      onClick={() => props.onDropClick(props.drop)}
    >
      {props.drop.id}
    </button>
  ),
}));
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardEmptyState",
  () => ({
    WaveLeaderboardEmptyState: (props: any) => (
      <div data-testid="empty" onClick={props.onCreateDrop} />
    ),
  })
);
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoading",
  () => ({ WaveLeaderboardLoading: () => <div data-testid="loading" /> })
);
const wave = { id: "w1" } as ApiWave;

const renderComp = (
  hookReturn: any,
  onDropClick: (drop: { id: string }) => void = jest.fn(),
  votingProps: {
    readonly isVotingClosed?: boolean;
    readonly isVotingControlsLocked?: boolean;
  } = {}
) => {
  hook.mockReturnValue({
    pageMetadata: [],
    queryWindowKey: "test-window",
    fetchPreviousPage: jest.fn(),
    hasPreviousPage: false,
    isFetchingPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    refetch: jest.fn(),
    ...hookReturn,
  });
  const scrollContainerRef = React.createRef<HTMLDivElement>();
  return render(
    <AuthContext.Provider value={{ connectedProfile: null } as any}>
      <WaveLeaderboardDrops
        wave={wave}
        sort={WaveDropsLeaderboardSort.RANK}
        onDropClick={onDropClick}
        onCreateDrop={jest.fn()}
        isVotingClosed={votingProps.isVotingClosed}
        isVotingControlsLocked={votingProps.isVotingControlsLocked}
        scrollContainerRef={scrollContainerRef}
      />
    </AuthContext.Provider>
  );
};

describe("WaveLeaderboardDrops", () => {
  it("shows loading when fetching and empty", () => {
    renderComp({
      drops: [],
      isFetching: true,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("shows empty state when no drops", () => {
    renderComp({
      drops: [],
      isFetching: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    expect(screen.getByTestId("empty")).toBeInTheDocument();
  });

  it("renders drops and enables automatic next-page loading", () => {
    const fetchNextPage = jest.fn();
    renderComp({
      drops: [{ id: "d1" }],
      isFetching: false,
      isFetchingNextPage: false,
      fetchNextPage,
      hasNextPage: true,
    });
    expect(screen.getByText("d1")).toBeInTheDocument();
    screen.getByRole("button", { name: "Trigger next page" }).click();
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("passes drop clicks through to the parent handler", () => {
    const onDropClick = jest.fn();
    renderComp(
      {
        drops: [{ id: "d1" }],
        isFetching: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
      },
      onDropClick,
      { isVotingClosed: true, isVotingControlsLocked: true }
    );
    expect(screen.getByTestId("drop")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
    expect(screen.getByTestId("drop")).toHaveAttribute(
      "data-is-voting-controls-locked",
      "true"
    );
    screen.getByTestId("drop").click();
    expect(onDropClick).toHaveBeenCalledWith({ id: "d1" });
  });
});
