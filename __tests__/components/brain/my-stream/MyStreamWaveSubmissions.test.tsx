import { fireEvent, render, screen } from "@testing-library/react";
import MyStreamWaveSubmissions from "@/components/brain/my-stream/MyStreamWaveSubmissions";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";

let searchParamsString = "";
const push = jest.fn();
const replace = jest.fn();
let mockApprovalWaveStatus = {
  winningThreshold: undefined as number | undefined,
  winningThresholdMinDurationMs: undefined as number | undefined,
  isVotingClosed: false,
  isVotingControlsLocked: false,
};

jest.mock("@/hooks/useWaveDropsLeaderboard");
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: jest.fn(() => ({ current: null })),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ leaderboardViewStyle: {} }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/waves",
  useSearchParams: () => {
    const params = new URLSearchParams(searchParamsString);

    return {
      get: (key: string) => params.get(key),
      has: (key: string) => params.has(key),
      toString: () => searchParamsString,
    };
  },
}));
jest.mock("@/components/waves/drops/participation/ParticipationDrop", () => ({
  __esModule: true,
  default: (props: any) => (
    <button
      data-testid="drop"
      data-winning-threshold={props.winningThreshold ?? ""}
      data-winning-threshold-min-duration={
        props.winningThresholdMinDurationMs ?? ""
      }
      data-is-voting-closed={String(props.isVotingClosed)}
      data-is-voting-controls-locked={String(props.isVotingControlsLocked)}
      onClick={() => props.onQuoteClick(props.drop)}
    >
      {props.drop.id}
    </button>
  ),
}));
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoading",
  () => ({
    WaveLeaderboardLoading: () => <div data-testid="loading" />,
  })
);
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar",
  () => ({
    WaveLeaderboardLoadingBar: () => <div data-testid="loading-bar" />,
  })
);
jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: () => mockApprovalWaveStatus,
}));

const useWaveDropsLeaderboardMock = useWaveDropsLeaderboard as jest.Mock;

describe("MyStreamWaveSubmissions", () => {
  const wave = { id: "1", wave: { type: "RANK" } } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    searchParamsString = "";
    mockApprovalWaveStatus = {
      winningThreshold: undefined,
      winningThresholdMinDurationMs: undefined,
      isVotingClosed: false,
      isVotingControlsLocked: false,
    };
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
  });

  it("does not forward curation_id to the submissions query", () => {
    searchParamsString = "curation_id=group-1";

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(useWaveDropsLeaderboardMock).toHaveBeenCalledWith({
      waveId: "1",
      sort: WaveDropsLeaderboardSort.RANK,
      curatedByGroupId: undefined,
    });
  });

  it("removes curation_id from the URL and preserves other params", () => {
    searchParamsString = "wave=wave-1&curation_id=group-1&drop=drop-1";

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(replace).toHaveBeenCalledWith("/waves?wave=wave-1&drop=drop-1", {
      scroll: false,
    });
  });

  it("does not replace the URL when curation_id is absent", () => {
    searchParamsString = "wave=wave-1";

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(replace).not.toHaveBeenCalled();
  });

  it("does not preserve curation_id when opening a drop", () => {
    searchParamsString = "wave=wave-1&curation_id=group-1";
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [{ id: "drop-1" }],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);
    fireEvent.click(screen.getByTestId("drop"));

    expect(push).toHaveBeenCalledWith("/waves?wave=wave-1&drop=drop-1", {
      scroll: false,
    });
  });

  it("passes approve wave state to participation drops", () => {
    const approveWave = {
      id: "1",
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 7,
        winning_threshold_min_duration_ms: 120_000,
        max_winners: 1,
        no_of_decisions_done: 1,
      },
    } as any;
    mockApprovalWaveStatus = {
      winningThreshold: 7,
      winningThresholdMinDurationMs: 120_000,
      isVotingClosed: true,
      isVotingControlsLocked: true,
    };
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [{ id: "drop-1" }],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });

    render(
      <MyStreamWaveSubmissions wave={approveWave} onDropClick={jest.fn()} />
    );

    expect(screen.getByTestId("drop")).toHaveAttribute(
      "data-winning-threshold",
      "7"
    );
    expect(screen.getByTestId("drop")).toHaveAttribute(
      "data-winning-threshold-min-duration",
      "120000"
    );
    expect(screen.getByTestId("drop")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
    expect(screen.getByTestId("drop")).toHaveAttribute(
      "data-is-voting-controls-locked",
      "true"
    );
  });

  it("does not pass threshold to non-approve participation drops", () => {
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [{ id: "drop-1" }],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(screen.getByTestId("drop")).toHaveAttribute(
      "data-winning-threshold",
      ""
    );
  });

  it("shows a retryable error state instead of the empty state", () => {
    const refetch = jest.fn();
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: true,
      isFetching: true,
      isFetchingNextPage: false,
      refetch,
    });

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(screen.getByText("Unable to load submissions.")).toBeInTheDocument();
    expect(
      screen.queryByText("No submissions to show.")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
