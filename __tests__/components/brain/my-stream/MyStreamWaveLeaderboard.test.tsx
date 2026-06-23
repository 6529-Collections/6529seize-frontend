import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuthContext } from "@/components/auth/Auth";
import MyStreamWaveLeaderboard from "@/components/brain/my-stream/MyStreamWaveLeaderboard";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";

const useWave = jest.fn();
const useLayout = jest.fn();
const useLocalPreference = jest.fn();
const useWaveCurations = jest.fn();
const useWaveDecisions = jest.fn();
const replace = jest.fn();
let searchParamsString = "";
let dropsProps: any;
let galleryProps: any;
let gridProps: any;
let createDropProps: any[] = [];
let curationModalProps: any;
let approvalStatusProps: any;
let intersectionObserverInstances: Array<{
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit;
  readonly observe: jest.Mock;
  readonly disconnect: jest.Mock;
}> = [];
const originalIntersectionObserver = (global as any).IntersectionObserver;

const installMockIntersectionObserver = () => {
  (global as any).IntersectionObserver = class {
    public readonly observe = jest.fn();
    public readonly disconnect = jest.fn();

    constructor(
      public readonly callback: IntersectionObserverCallback,
      public readonly options: IntersectionObserverInit
    ) {
      intersectionObserverInstances.push(this);
    }
  };
};

const resetIntersectionObserver = () => {
  if (originalIntersectionObserver) {
    (global as any).IntersectionObserver = originalIntersectionObserver;
    return;
  }

  delete (global as any).IntersectionObserver;
};

jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => useWave(...args),
  SubmissionStatus: {
    NOT_STARTED: "NOT_STARTED",
    ACTIVE: "ACTIVE",
    ENDED: "ENDED",
  },
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: (...args: any[]) => useLayout(...args),
}));
jest.mock(
  "@/hooks/useLocalPreference",
  () =>
    (...args: any[]) =>
      useLocalPreference(...args)
);
jest.mock("@/hooks/waves/useWaveCurations", () => ({
  useWaveCurations: (...args: any[]) => useWaveCurations(...args),
}));
jest.mock("@/hooks/waves/useWaveDecisions", () => ({
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE: 2000,
  useWaveDecisions: (...args: any[]) => useWaveDecisions(...args),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/waves",
  useSearchParams: () => ({
    get: (key: string) => new URLSearchParams(searchParamsString).get(key),
    toString: () => searchParamsString,
  }),
}));

jest.mock("@/components/waves/leaderboard/WaveLeaderboardTime", () => ({
  WaveLeaderboardTime: () => <div data-testid="time" />,
}));
jest.mock("@/components/waves/approval/WaveApprovalStatusBar", () => ({
  __esModule: true,
  default: (props: any) => {
    approvalStatusProps = props;
    return (
      <div
        data-testid="approval-status"
        data-close-status={props.closeStatus ?? ""}
      />
    );
  },
}));
let headerProps: any;
jest.mock(
  "@/components/waves/leaderboard/header/WaveleaderboardHeader",
  () => ({
    WaveLeaderboardHeader: (props: any) => {
      headerProps = props;
      return (
        <button data-testid="header" onClick={() => props.onCreateDrop?.()} />
      );
    },
  })
);
jest.mock("@/components/waves/leaderboard/create/WaveDropCreate", () => ({
  WaveDropCreate: (props: any) => {
    createDropProps.push(props);
    return (
      <div
        data-testid="create-drop"
        data-curation-leaderboard={String(Boolean(props.isCurationLeaderboard))}
      />
    );
  },
}));
jest.mock("@/components/waves/leaderboard/drops/WaveLeaderboardDrops", () => ({
  WaveLeaderboardDrops: (props: any) => {
    dropsProps = props;
    return <div data-testid="drops" onClick={() => props.onCreateDrop?.()} />;
  },
}));
jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGallery",
  () => ({
    WaveLeaderboardGallery: (props: any) => {
      galleryProps = props;
      return <div data-testid="gallery" />;
    },
  })
);
jest.mock("@/components/waves/leaderboard/grid/WaveLeaderboardGrid", () => ({
  WaveLeaderboardGrid: (props: any) => {
    gridProps = props;
    return <div data-testid="grid" data-mode={props.mode} />;
  },
}));
jest.mock(
  "@/components/waves/memes/MemesArtSubmissionModal",
  () => (props: any) => (props.isOpen ? <div data-testid="memes" /> : null)
);
jest.mock(
  "@/components/waves/leaderboard/create/WaveLeaderboardCurationDropModal",
  () => ({
    WaveLeaderboardCurationDropModal: (props: any) => {
      curationModalProps = props;
      return props.isOpen ? (
        <button data-testid="curation-modal" onClick={props.onClose} />
      ) : null;
    },
  })
);

const wave = {
  id: "1",
  participation: {},
  wave: { type: ApiWaveType.Rank },
} as ApiWave;

const makeOpenApproveWave = (): ApiWave =>
  ({
    ...wave,
    voting: { period: { max: Date.now() + 60_000 } },
    wave: {
      type: ApiWaveType.Approve,
      winning_threshold: 10,
      max_winners: 1,
      no_of_decisions_done: 0,
    },
  }) as ApiWave;

const approvalDecisionPoints = [
  {
    decision_time: 1100,
    winners: [{ place: 1, awards: [], drop: { id: "drop-1" } }],
  },
  {
    decision_time: 1200,
    winners: [{ place: 1, awards: [], drop: { id: "drop-2" } }],
  },
];

const renderLeaderboard = (leaderboardWave: ApiWave = wave) =>
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "tester" },
          activeProfileProxy: null,
        } as any
      }
    >
      <MyStreamWaveLeaderboard wave={leaderboardWave} onDropClick={jest.fn()} />
    </AuthContext.Provider>
  );

describe("MyStreamWaveLeaderboard", () => {
  afterAll(() => {
    resetIntersectionObserver();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    intersectionObserverInstances = [];
    resetIntersectionObserver();
    searchParamsString = "";
    dropsProps = null;
    galleryProps = null;
    gridProps = null;
    createDropProps = [];
    curationModalProps = undefined;
    approvalStatusProps = undefined;
    useLayout.mockReturnValue({ leaderboardViewStyle: {} });
    useWaveCurations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    useWaveDecisions.mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      hasLoadedAllPages: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    useLocalPreference.mockImplementation((_: any, def: any) => [
      def,
      jest.fn(),
    ]);
  });

  it("uses list view for non memes wave and opens create drop on demand", async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]); // view mode
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]); // sort
    renderLeaderboard();

    const stickyHeader = screen.getByTestId("header").parentElement;
    expect(stickyHeader).toHaveClass("tw-sticky");
    expect(stickyHeader).toHaveClass("tw-z-30");
    expect(stickyHeader).toHaveClass("tw-flex-none");
    expect(headerProps.viewMode).toBe("list");
    expect(headerProps.onPriceRangeChange).toBeUndefined();
    expect(screen.queryByTestId("create-drop")).not.toBeInTheDocument();
    expect(headerProps.onCreateDrop).toEqual(expect.any(Function));

    await user.click(screen.getByTestId("header"));
    expect(screen.getByTestId("create-drop")).toBeInTheDocument();
    expect(
      createDropProps[createDropProps.length - 1]?.isCurationLeaderboard
    ).toBeUndefined();
  });

  it("keeps approve list controls non-sticky before the status sentinel leaves", () => {
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      isQuorumWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(makeOpenApproveWave());

    expect(
      screen.getByTestId("approval-controls-sticky-sentinel")
    ).toBeInTheDocument();
    const controls = screen.getByTestId("header").parentElement;
    expect(controls).not.toHaveClass("tw-sticky");
    expect(controls).toHaveClass("tw-flex-none");
  });

  it("toggles approve list controls sticky state when the status sentinel moves", () => {
    installMockIntersectionObserver();
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      isQuorumWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(makeOpenApproveWave());

    const sentinel = screen.getByTestId("approval-controls-sticky-sentinel");
    const controls = screen.getByTestId("header").parentElement;
    const observer = intersectionObserverInstances[0];

    expect(observer?.options.root).toBe(sentinel.parentElement);
    expect(observer?.observe).toHaveBeenCalledWith(sentinel);
    expect(controls).not.toHaveClass("tw-sticky");

    act(() => {
      observer?.callback(
        [
          {
            isIntersecting: false,
            boundingClientRect: { top: -2, bottom: -1 } as DOMRectReadOnly,
            rootBounds: { top: 0 } as DOMRectReadOnly,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(controls).toHaveClass("tw-sticky");
    expect(controls).toHaveClass("tw-z-30");
    expect(controls).toHaveClass("tw-flex-none");

    act(() => {
      observer?.callback(
        [
          {
            isIntersecting: true,
            boundingClientRect: { top: 0, bottom: 1 } as DOMRectReadOnly,
            rootBounds: { top: 0 } as DOMRectReadOnly,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    expect(controls).not.toHaveClass("tw-sticky");
  });

  it("keeps approve grid controls sticky", () => {
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      isQuorumWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["grid", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(makeOpenApproveWave());

    expect(
      screen.queryByTestId("approval-controls-sticky-sentinel")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("header").parentElement).toHaveClass("tw-sticky");
  });

  it("uses rank for saved projected vote sort when the wave has no time lock", () => {
    const setSort = jest.fn();
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RATING_PREDICTION,
      setSort,
    ]);

    renderLeaderboard({
      ...wave,
      wave: { type: ApiWaveType.Rank, time_lock_ms: null },
    } as ApiWave);

    expect(headerProps.sort).toBe(WaveDropsLeaderboardSort.RANK);
    expect(dropsProps.sort).toBe(WaveDropsLeaderboardSort.RANK);
    expect(setSort).not.toHaveBeenCalled();

    act(() => {
      headerProps.onSortChange(WaveDropsLeaderboardSort.RATING_PREDICTION);
    });

    expect(setSort).toHaveBeenCalledWith(WaveDropsLeaderboardSort.RANK);
  });

  it("uses realtime vote for saved approve projected vote sort", () => {
    const setSort = jest.fn();
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RATING_PREDICTION,
      setSort,
    ]);

    renderLeaderboard({
      ...makeOpenApproveWave(),
      wave: {
        ...makeOpenApproveWave().wave,
        time_lock_ms: 300_000,
      },
    } as ApiWave);

    expect(headerProps.sort).toBe(WaveDropsLeaderboardSort.REALTIME_VOTE);
    expect(dropsProps.sort).toBe(WaveDropsLeaderboardSort.REALTIME_VOTE);

    act(() => {
      headerProps.onSortChange(WaveDropsLeaderboardSort.REALTIME_VOTE);
    });

    expect(setSort).toHaveBeenCalledWith(
      WaveDropsLeaderboardSort.REALTIME_VOTE
    );
  });

  it("uses grid view for memes wave and opens meme modal", async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({
      isMemesWave: true,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["grid", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);
    renderLeaderboard();

    expect(headerProps.viewMode).toBe("grid");
    expect(galleryProps.isVotingClosed).toBe(false);
    expect(galleryProps.isVotingControlsLocked).toBe(false);
    await user.click(screen.getByTestId("header"));
    expect(screen.getByTestId("memes")).toBeInTheDocument();
  });

  it("keeps identity submission on the normal inline create path", async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
          } as any
        }
      >
        <MyStreamWaveLeaderboard
          wave={{
            ...wave,
            participation: {
              submission_strategy: {
                type: "IDENTITY",
                config: {
                  who_can_be_submitted: "EVERYONE",
                  duplicates: "NEVER_ALLOW",
                },
              },
            },
          }}
          onDropClick={jest.fn()}
        />
      </AuthContext.Provider>
    );

    await user.click(screen.getByTestId("header"));

    expect(screen.getByTestId("create-drop")).toBeInTheDocument();
    expect(screen.queryByTestId("memes")).not.toBeInTheDocument();
    expect(screen.queryByTestId("curation-modal")).not.toBeInTheDocument();
  });

  it("routes quorum proposal creation through the create flow", async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isQuorumWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard();

    await user.click(screen.getByTestId("header"));

    expect(screen.getByTestId("create-drop")).toBeInTheDocument();
    expect(screen.queryByTestId("memes")).not.toBeInTheDocument();
    expect(screen.queryByTestId("curation-modal")).not.toBeInTheDocument();
  });

  it("renders non-meme content-only grid mode", () => {
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["grid_content_only", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);
    renderLeaderboard();

    expect(headerProps.viewMode).toBe("grid_content_only");
    expect(screen.getByTestId("grid")).toHaveAttribute(
      "data-mode",
      "content_only"
    );
    expect(gridProps.isVotingClosed).toBe(false);
    expect(gridProps.isVotingControlsLocked).toBe(false);
  });

  it("reads curation group from URL and keeps price filters local", () => {
    searchParamsString = "curation_id=group-1&min_price=1.5&max_price=4.2";
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveCurations.mockReturnValue({
      data: [{ id: "group-1", name: "Curators", group_id: "g1" }],
      isLoading: false,
      isError: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard();

    expect(headerProps.curatedByGroupId).toBe("group-1");
    expect(headerProps.minPrice).toBeUndefined();
    expect(headerProps.maxPrice).toBeUndefined();
    expect(headerProps.onCreateDrop).toEqual(expect.any(Function));
    expect(dropsProps.curatedByGroupId).toBe("group-1");
    expect(dropsProps.minPrice).toBeUndefined();
    expect(dropsProps.maxPrice).toBeUndefined();
    expect(dropsProps.priceCurrency).toBeUndefined();
    expect(dropsProps.onCreateDrop).toEqual(expect.any(Function));
    expect(screen.queryByTestId("create-drop")).not.toBeInTheDocument();
  });

  it("opens curation drop modal from header create action", async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard();

    expect(screen.queryByTestId("curation-modal")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("header"));
    expect(screen.getByTestId("curation-modal")).toBeInTheDocument();
    expect(curationModalProps.wave).toEqual(wave);
  });

  it("updates URL when curation filter changes", () => {
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveCurations.mockReturnValue({
      data: [{ id: "group-1", name: "Curators", group_id: "g1" }],
      isLoading: false,
      isError: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard();

    headerProps.onCurationGroupChange("group-1");
    expect(replace).toHaveBeenCalledWith("/waves?curation_id=group-1", {
      scroll: false,
    });

    headerProps.onCurationGroupChange(null);
    expect(replace).toHaveBeenCalledWith("/waves", { scroll: false });
  });

  it("updates local price filters without touching URL", () => {
    searchParamsString = "curation_id=group-1";
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveCurations.mockReturnValue({
      data: [{ id: "group-1", name: "Curators", group_id: "g1" }],
      isLoading: false,
      isError: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard();

    act(() => {
      headerProps.onPriceRangeChange({ minPrice: 1.25, maxPrice: undefined });
    });
    expect(replace).not.toHaveBeenCalled();
    expect(dropsProps.minPrice).toBe(1.25);
    expect(dropsProps.maxPrice).toBeUndefined();
    expect(dropsProps.priceCurrency).toBe("ETH");

    act(() => {
      headerProps.onPriceRangeChange({
        minPrice: undefined,
        maxPrice: undefined,
      });
    });
    expect(replace).not.toHaveBeenCalled();
    expect(dropsProps.minPrice).toBeUndefined();
    expect(dropsProps.maxPrice).toBeUndefined();
    expect(dropsProps.priceCurrency).toBeUndefined();
  });

  it("resets local price filters when wave changes", async () => {
    useWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });

    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    const authContextValue = {
      connectedProfile: { handle: "tester" },
      activeProfileProxy: null,
    } as any;

    const waveA = { ...wave, id: "1" } as ApiWave;
    const waveB = { ...wave, id: "2" } as ApiWave;
    const onDropClick = jest.fn();

    const { rerender } = render(
      <AuthContext.Provider value={authContextValue}>
        <MyStreamWaveLeaderboard
          key={waveA.id}
          wave={waveA}
          onDropClick={onDropClick}
        />
      </AuthContext.Provider>
    );

    act(() => {
      headerProps.onPriceRangeChange({ minPrice: 2, maxPrice: 5 });
    });

    expect(dropsProps.minPrice).toBe(2);
    expect(dropsProps.maxPrice).toBe(5);

    rerender(
      <AuthContext.Provider value={authContextValue}>
        <MyStreamWaveLeaderboard
          key={waveB.id}
          wave={waveB}
          onDropClick={onDropClick}
        />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(dropsProps.minPrice).toBeUndefined();
      expect(dropsProps.maxPrice).toBeUndefined();
      expect(dropsProps.priceCurrency).toBeUndefined();
    });
  });

  it("shows approve status without loading decisions when counters close the wave", async () => {
    const user = userEvent.setup();
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() + 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: 1,
        no_of_decisions_done: 1,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(screen.getByTestId("approval-status")).toHaveAttribute(
      "data-close-status",
      "max_reached"
    );
    expect(approvalStatusProps.approvedCount).toBe(1);
    expect(
      useWaveDecisions.mock.calls.some(([args]) => args.enabled === true)
    ).toBe(false);
    expect(useWaveDecisions).toHaveBeenCalledWith({
      waveId: "1",
      enabled: false,
      loadAllPages: true,
      pageSize: 2000,
    });
    expect(dropsProps.isVotingClosed).toBe(true);
    expect(dropsProps.isVotingControlsLocked).toBe(true);
    expect(headerProps.onCreateDrop).toBeUndefined();
    expect(dropsProps.onCreateDrop).toBeUndefined();

    await user.click(screen.getByTestId("header"));

    expect(screen.queryByTestId("create-drop")).not.toBeInTheDocument();
  });

  it("blocks create drop while capped approval status is loading", async () => {
    const user = userEvent.setup();
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() + 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: 2,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(
      useWaveDecisions.mock.calls.some(
        ([args]) =>
          args.enabled === true &&
          args.loadAllPages === true &&
          args.pageSize === 2000
      )
    ).toBe(true);
    expect(approvalStatusProps.approvedCount).toBeNull();
    expect(dropsProps.isVotingClosed).toBe(false);
    expect(dropsProps.isVotingControlsLocked).toBe(true);
    expect(headerProps.onCreateDrop).toBeUndefined();
    expect(dropsProps.onCreateDrop).toBeUndefined();

    await user.click(screen.getByTestId("header"));

    expect(screen.queryByTestId("create-drop")).not.toBeInTheDocument();
  });

  it("loads full decisions for uncapped approve waves with missing server counts", () => {
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() + 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: null,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveDecisions.mockReturnValue({
      decisionPoints: approvalDecisionPoints,
      isFetching: false,
      hasLoadedAllPages: true,
      isLoadingAllPages: false,
      isLoadingAllPagesError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(
      useWaveDecisions.mock.calls.filter(([args]) => args.enabled === true)
    ).toHaveLength(1);
    expect(useWaveDecisions.mock.calls[0][0]).toEqual({
      waveId: "1",
      enabled: true,
      loadAllPages: true,
      pageSize: 2000,
    });
    expect(approvalStatusProps.approvedCount).toBe(2);
    expect(approvalStatusProps.closeStatus).toBeNull();
  });

  it("counts uncapped approve decision winners without drop data", () => {
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() + 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: null,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveDecisions.mockReturnValue({
      decisionPoints: [
        ...approvalDecisionPoints,
        {
          decision_time: 1300,
          winners: [{ place: 1, awards: [] }],
        },
      ] as any,
      isFetching: false,
      hasLoadedAllPages: true,
      isLoadingAllPages: false,
      isLoadingAllPagesError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(screen.getByTestId("approval-status")).toBeInTheDocument();
    expect(approvalStatusProps.approvedCount).toBe(3);
  });

  it("loads full decisions for ended approve waves with missing server counts", () => {
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() - 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: 2,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveDecisions.mockReturnValue({
      decisionPoints: approvalDecisionPoints.slice(0, 1),
      isFetching: false,
      hasLoadedAllPages: true,
      isLoadingAllPages: false,
      isLoadingAllPagesError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(
      useWaveDecisions.mock.calls.filter(([args]) => args.enabled === true)
    ).toHaveLength(1);
    expect(useWaveDecisions.mock.calls[0][0]).toEqual({
      waveId: "1",
      enabled: true,
      loadAllPages: true,
      pageSize: 2000,
    });
    expect(approvalStatusProps.approvedCount).toBe(1);
    expect(approvalStatusProps.closeStatus).toBe("ended");
  });

  it("shows count retry without locking uncapped approve waves when count loading fails", async () => {
    const user = userEvent.setup();
    const retryApprovalDecisions = jest.fn();
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() + 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: null,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      isQuorumWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveDecisions.mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      hasLoadedAllPages: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      refetch: retryApprovalDecisions,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(approvalStatusProps.approvedCount).toBeNull();
    expect(approvalStatusProps.isApprovalStatusError).toBe(false);
    expect(approvalStatusProps.retryApprovalStatus).toBeNull();
    expect(approvalStatusProps.isApprovalCountError).toBe(true);
    expect(approvalStatusProps.retryApprovalCount).toEqual(
      expect.any(Function)
    );
    expect(dropsProps.isVotingClosed).toBe(false);
    expect(dropsProps.isVotingControlsLocked).toBe(false);
    expect(headerProps.onCreateDrop).toEqual(expect.any(Function));
    expect(dropsProps.onCreateDrop).toEqual(expect.any(Function));

    approvalStatusProps.retryApprovalCount();

    expect(retryApprovalDecisions).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("header"));

    expect(screen.getByTestId("create-drop")).toBeInTheDocument();
  });

  it("shows count retry while keeping ended approve waves closed when count loading fails", () => {
    const retryApprovalDecisions = jest.fn();
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() - 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: 2,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      isQuorumWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveDecisions.mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      hasLoadedAllPages: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      refetch: retryApprovalDecisions,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(approvalStatusProps.approvedCount).toBeNull();
    expect(approvalStatusProps.closeStatus).toBe("ended");
    expect(approvalStatusProps.isApprovalStatusError).toBe(false);
    expect(approvalStatusProps.retryApprovalStatus).toBeNull();
    expect(approvalStatusProps.isApprovalCountError).toBe(true);
    expect(approvalStatusProps.retryApprovalCount).toEqual(
      expect.any(Function)
    );
    expect(dropsProps.isVotingClosed).toBe(true);
    expect(dropsProps.isVotingControlsLocked).toBe(true);
    expect(headerProps.onCreateDrop).toBeUndefined();
    expect(dropsProps.onCreateDrop).toBeUndefined();

    approvalStatusProps.retryApprovalCount();

    expect(retryApprovalDecisions).toHaveBeenCalledTimes(1);
  });

  it("blocks create drop and passes retry when approval status loading fails", async () => {
    const user = userEvent.setup();
    const retryApprovalDecisions = jest.fn();
    const approveWave = {
      ...wave,
      voting: { period: { max: Date.now() + 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: 2,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useWaveDecisions.mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      hasLoadedAllPages: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      refetch: retryApprovalDecisions,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    renderLeaderboard(approveWave);

    expect(approvalStatusProps.approvedCount).toBeNull();
    expect(approvalStatusProps.isApprovalStatusError).toBe(true);
    expect(approvalStatusProps.retryApprovalStatus).toEqual(
      expect.any(Function)
    );
    expect(approvalStatusProps.isApprovalCountError).toBe(false);
    expect(approvalStatusProps.retryApprovalCount).toBeNull();
    expect(dropsProps.isVotingClosed).toBe(false);
    expect(dropsProps.isVotingControlsLocked).toBe(true);
    expect(headerProps.onCreateDrop).toBeUndefined();
    expect(dropsProps.onCreateDrop).toBeUndefined();

    approvalStatusProps.retryApprovalStatus();

    expect(retryApprovalDecisions).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("header"));

    expect(screen.queryByTestId("create-drop")).not.toBeInTheDocument();
  });

  it("removes open create drop UI when an approve wave closes", async () => {
    const user = userEvent.setup();
    const openApproveWave = {
      ...wave,
      voting: { period: { max: Date.now() + 60_000 } },
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 10,
        max_winners: 1,
        no_of_decisions_done: 0,
      },
    } as ApiWave;
    const closedApproveWave = {
      ...openApproveWave,
      wave: {
        ...openApproveWave.wave,
        no_of_decisions_done: 1,
      },
    } as ApiWave;
    useWave.mockReturnValue({
      isApproveWave: true,
      isMemesWave: false,
      isCurationWave: false,
      participation: {
        isEligible: true,
        canSubmitNow: true,
        hasReachedLimit: false,
      },
    });
    useLocalPreference.mockReturnValueOnce(["list", jest.fn()]);
    useLocalPreference.mockReturnValueOnce([
      WaveDropsLeaderboardSort.RANK,
      jest.fn(),
    ]);

    const { rerender } = renderLeaderboard(openApproveWave);

    await user.click(screen.getByTestId("header"));
    expect(screen.getByTestId("create-drop")).toBeInTheDocument();

    rerender(
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "tester" },
            activeProfileProxy: null,
          } as any
        }
      >
        <MyStreamWaveLeaderboard
          wave={closedApproveWave}
          onDropClick={jest.fn()}
        />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId("create-drop")).not.toBeInTheDocument();
    });
    expect(headerProps.onCreateDrop).toBeUndefined();
    expect(dropsProps.onCreateDrop).toBeUndefined();
  });
});
