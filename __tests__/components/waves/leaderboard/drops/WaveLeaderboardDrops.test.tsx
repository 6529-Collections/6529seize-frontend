import { render, screen } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardDrops } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrops";
import { AuthContext, type AuthContextType } from "@/components/auth/Auth";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";

type LeaderboardHookResult = ReturnType<typeof useWaveDropsLeaderboard>;

const hook = jest.fn<LeaderboardHookResult, []>();
const proposalCardPresentationHook = jest.fn(
  (_waveId: string | null | undefined) => "default"
);
const isQuorumWave = jest.fn((_waveId: string | null | undefined) => false);
let mockVirtualizedRowsProps:
  | {
      readonly estimatedRowHeight?: number | undefined;
      readonly measureLoadedRowsAtNaturalHeight?: boolean | undefined;
    }
  | undefined;

jest.mock("@/hooks/waves/useWaveProposalCardPresentation", () => ({
  useWaveProposalCardPresentation: (waveId: string | null | undefined) =>
    proposalCardPresentationHook(waveId),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({ isQuorumWave }),
}));

jest.mock("@/hooks/useWaveDropsLeaderboard", () => {
  const actual = jest.requireActual(
    "../../../../../hooks/useWaveDropsLeaderboard"
  );
  return {
    __esModule: true,
    ...actual,
    useWaveDropsLeaderboard: () => hook(),
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
      ...props
    }: {
      readonly items: readonly ExtendedDrop[];
      readonly renderItem: (item: ExtendedDrop) => React.ReactNode;
      readonly hasNextPage: boolean;
      readonly fetchNextPage: () => void;
      readonly autoLoadNext?: boolean | undefined;
      readonly estimatedRowHeight?: number | undefined;
      readonly measureLoadedRowsAtNaturalHeight?: boolean | undefined;
    }) => {
      mockVirtualizedRowsProps = props;
      return (
        <div>
          {items.map((item) => (
            <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
          ))}
          {autoLoadNext && hasNextPage ? (
            <button onClick={fetchNextPage}>Trigger next page</button>
          ) : null}
        </div>
      );
    },
  })
);
jest.mock("@/components/waves/leaderboard/WaveLeaderboardVotingModal", () => ({
  useWaveLeaderboardVotingModal: () => ({
    votingDrop: null,
    openVotingModal: jest.fn(),
    closeVotingModal: jest.fn(),
  }),
  WaveLeaderboardVotingModal: () => null,
}));

jest.mock("@/components/waves/leaderboard/drops/WaveLeaderboardDrop", () => ({
  WaveLeaderboardDrop: (props: {
    readonly drop: ExtendedDrop;
    readonly isVotingClosed: boolean;
    readonly isVotingControlsLocked: boolean;
    readonly onDropClick: (drop: ExtendedDrop) => void;
  }) => (
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
    WaveLeaderboardEmptyState: (props: {
      readonly onCreateDrop?: (() => void) | undefined;
    }) => <div data-testid="empty" onClick={props.onCreateDrop} />,
  })
);
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoading",
  () => ({ WaveLeaderboardLoading: () => <div data-testid="loading" /> })
);
const wave = { id: "w1" } as ApiWave;
const authValue: AuthContextType = {
  connectedProfile: null,
  fetchingProfile: false,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  showWaves: false,
  sessionUpgradeRequired: false,
  requestAuth: async () => ({ success: false }),
  setToast: jest.fn(),
  setActiveProfileProxy: async () => {},
};
const makeDrop = (id: string): ExtendedDrop => ({ id }) as ExtendedDrop;

const renderComp = (
  hookReturn: Partial<LeaderboardHookResult>,
  onDropClick: (drop: ExtendedDrop) => void = jest.fn(),
  votingProps: {
    readonly isVotingClosed?: boolean;
    readonly isVotingControlsLocked?: boolean;
  } = {}
) => {
  hook.mockReturnValue({
    drops: [],
    pageMetadata: [],
    queryWindowKey: "test-window",
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    fetchPreviousPage: jest.fn(),
    hasPreviousPage: false,
    isFetchingPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    isError: false,
    isFetching: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
    manualFetch: jest.fn(),
    ...hookReturn,
  });
  const scrollContainerRef = React.createRef<HTMLDivElement>();
  return render(
    <AuthContext.Provider value={authValue}>
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
  beforeEach(() => {
    proposalCardPresentationHook.mockReturnValue("default");
    isQuorumWave.mockReturnValue(false);
    mockVirtualizedRowsProps = undefined;
  });

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
      drops: [makeDrop("d1")],
      isFetching: false,
      isFetchingNextPage: false,
      fetchNextPage,
      hasNextPage: true,
    });
    expect(screen.getByText("d1")).toBeInTheDocument();
    screen.getByRole("button", { name: "Trigger next page" }).click();
    expect(fetchNextPage).toHaveBeenCalled();
    expect(mockVirtualizedRowsProps?.measureLoadedRowsAtNaturalHeight).toBe(
      true
    );
  });

  it("uses compact virtual rows for proposal-card presentation", () => {
    proposalCardPresentationHook.mockReturnValue("proposalCard");

    renderComp({
      drops: [makeDrop("d1")],
      isFetching: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    expect(mockVirtualizedRowsProps?.estimatedRowHeight).toBe(360);
    expect(mockVirtualizedRowsProps?.measureLoadedRowsAtNaturalHeight).toBe(
      true
    );
  });

  it("uses naturally measured compact rows for Quorum proposals", () => {
    isQuorumWave.mockReturnValue(true);

    renderComp({
      drops: [makeDrop("d1")],
      isFetching: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    expect(isQuorumWave).toHaveBeenCalledWith(wave.id);
    expect(mockVirtualizedRowsProps?.estimatedRowHeight).toBe(360);
    expect(mockVirtualizedRowsProps?.measureLoadedRowsAtNaturalHeight).toBe(
      true
    );
  });

  it("passes drop clicks through to the parent handler", () => {
    const onDropClick = jest.fn();
    renderComp(
      {
        drops: [makeDrop("d1")],
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
