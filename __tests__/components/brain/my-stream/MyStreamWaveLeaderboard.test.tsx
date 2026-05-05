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
  beforeEach(() => {
    jest.clearAllMocks();
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
