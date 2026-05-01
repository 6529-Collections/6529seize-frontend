import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import MyStreamWaveMyVotes from "@/components/brain/my-stream/votes/MyStreamWaveMyVotes";
import { AuthContext } from "@/components/auth/Auth";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";

let intersectionCb: () => void = () => {};
let resetProps: any = null;
const mockApprovalStatus = jest.fn(() => ({
  isApprovalStatusLoading: false,
  isVotingClosed: false,
}));

jest.mock("@/hooks/useWaveDropsLeaderboard");
jest.mock("@/hooks/waves/useWaveDecisions", () => ({
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE: 2000,
  useWaveDecisions: jest.fn(),
}));
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: (cb: any) => {
    intersectionCb = cb;
    return { current: null };
  },
}));
jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: (...args: any) => mockApprovalStatus(...args),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ myVotesViewStyle: {} }),
}));
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVote",
  () => (p: any) => (
    <button
      type="button"
      data-testid="vote"
      data-is-checked={String(p.isChecked)}
      data-is-voting-closed={String(p.isVotingClosed)}
      onClick={() => p.onToggleCheck(p.drop.id)}
    >
      {p.drop.id}
    </button>
  )
);
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVotesReset",
  () => (p: any) => {
    resetProps = p;
    return <div data-testid="reset" />;
  }
);
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar",
  () => ({ WaveLeaderboardLoadingBar: () => <div data-testid="loading" /> })
);

const useWaveDropsLeaderboardMock = useWaveDropsLeaderboard as jest.Mock;
const useWaveDecisionsMock = useWaveDecisions as jest.Mock;

describe("MyStreamWaveMyVotes", () => {
  const wave = {
    id: "1",
    wave: {
      type: ApiWaveType.Rank,
      no_of_decisions_done: 0,
      no_of_decisions_left: null,
    },
  } as any;
  const onDropClick = jest.fn();
  const auth = { connectedProfile: { handle: "me" } } as any;

  beforeEach(() => {
    useWaveDropsLeaderboardMock.mockReset();
    useWaveDecisionsMock.mockReset();
    mockApprovalStatus.mockReset();
    useWaveDecisionsMock.mockReturnValue({
      decisionPoints: [],
      isFetching: false,
      isLoading: false,
      hasLoadedAllPages: false,
      isLoadingAllPages: false,
    });
    mockApprovalStatus.mockReturnValue({
      isApprovalStatusLoading: false,
      isVotingClosed: false,
    });
    resetProps = null;
  });

  it("shows empty message when no drops", () => {
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });
    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );
    expect(
      screen.getByText("You haven't voted on any submissions in this wave yet.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("reset")).not.toBeInTheDocument();
  });

  it("renders drops and fetches more on intersection", () => {
    const fetchNextPage = jest.fn();
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [
        {
          id: "a",
          context_profile_context: { rating: 2, max_rating: 10 },
        },
      ],
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
    });
    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("vote")).toHaveTextContent("a");
    expect(resetProps?.availableVotes).toBe(8);
    intersectionCb();
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("shows loading bar when fetching next page", () => {
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [
        {
          id: "a",
          context_profile_context: { rating: 1, max_rating: 5 },
        },
      ],
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: true,
    });
    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(resetProps?.availableVotes).toBe(4);
  });

  it("loads decision points for approve waves with missing decision counts", () => {
    const approveWave = {
      id: "approve-1",
      wave: {
        type: ApiWaveType.Approve,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as any;
    const decisionPoints = [
      {
        decision_time: 1,
        winners: [{ place: 1, awards: [], drop: { id: "winner-1" } }],
      },
    ];
    useWaveDecisionsMock.mockReturnValue({
      decisionPoints,
      isFetching: false,
      isLoading: false,
      hasLoadedAllPages: true,
      isLoadingAllPages: false,
    });
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [
        {
          id: "a",
          context_profile_context: { rating: 1, max_rating: 5 },
        },
      ],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });

    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={approveWave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "approve-1",
      enabled: true,
      loadAllPages: true,
      pageSize: 2000,
    });
    expect(mockApprovalStatus).toHaveBeenCalledWith({
      wave: approveWave,
      decisionPoints,
      areDecisionPointsComplete: true,
    });
  });

  it("does not pass decision points when approve decision counts exist", () => {
    const approveWave = {
      id: "approve-1",
      wave: {
        type: ApiWaveType.Approve,
        no_of_decisions_done: 1,
        no_of_decisions_left: null,
      },
    } as any;
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [
        {
          id: "a",
          context_profile_context: { rating: 1, max_rating: 5 },
        },
      ],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });

    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={approveWave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "approve-1",
      enabled: false,
      loadAllPages: false,
      pageSize: undefined,
    });
    expect(mockApprovalStatus).toHaveBeenCalledWith({ wave: approveWave });
  });

  it("locks voting controls while approve decision points are loading", () => {
    const approveWave = {
      id: "approve-1",
      wave: {
        type: ApiWaveType.Approve,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as any;
    useWaveDecisionsMock.mockReturnValue({
      decisionPoints: [],
      isFetching: true,
      isLoading: true,
      hasLoadedAllPages: false,
      isLoadingAllPages: true,
    });
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [
        {
          id: "a",
          context_profile_context: { rating: 1, max_rating: 5 },
        },
      ],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });

    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={approveWave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );

    const vote = screen.getByTestId("vote");
    expect(screen.queryByTestId("reset")).not.toBeInTheDocument();
    expect(vote).toHaveAttribute("data-is-voting-closed", "true");

    fireEvent.click(vote);

    expect(vote).toHaveAttribute("data-is-checked", "false");
  });

  it("keeps voting controls unlocked during approve decision point refetches", () => {
    const approveWave = {
      id: "approve-1",
      wave: {
        type: ApiWaveType.Approve,
        no_of_decisions_done: null,
        no_of_decisions_left: null,
      },
    } as any;
    useWaveDecisionsMock.mockReturnValue({
      decisionPoints: [
        {
          decision_time: 1,
          winners: [{ place: 1, awards: [], drop: { id: "winner-1" } }],
        },
      ],
      isFetching: true,
      isLoading: false,
      hasLoadedAllPages: true,
      isLoadingAllPages: false,
    });
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [
        {
          id: "a",
          context_profile_context: { rating: 1, max_rating: 5 },
        },
      ],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });

    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={approveWave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );

    const vote = screen.getByTestId("vote");
    expect(screen.getByTestId("reset")).toBeInTheDocument();
    expect(vote).toHaveAttribute("data-is-voting-closed", "false");

    fireEvent.click(vote);

    expect(vote).toHaveAttribute("data-is-checked", "true");
  });

  it("renders closed approval votes as read-only", () => {
    mockApprovalStatus.mockReturnValue({
      isApprovalStatusLoading: false,
      isVotingClosed: true,
    });
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [
        {
          id: "a",
          context_profile_context: { rating: 1, max_rating: 5 },
        },
      ],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });
    render(
      <AuthContext.Provider value={auth}>
        <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
      </AuthContext.Provider>
    );

    expect(screen.queryByTestId("reset")).not.toBeInTheDocument();
    expect(resetProps).toBeNull();
    expect(screen.getByTestId("vote")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
  });
});
