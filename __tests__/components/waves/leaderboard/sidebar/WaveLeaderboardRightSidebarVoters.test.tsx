import { render, screen } from "@testing-library/react";
import { WaveLeaderboardRightSidebarVoters } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters";
import type { ApiWave } from "@/generated/models/ObjectSerializer";
import { useAuth } from "@/components/auth/Auth";
import { useWaveTopVoters } from "@/hooks/useWaveTopVoters";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/useWaveTopVoters");
jest.mock("@/hooks/useIntersectionObserver");
jest.mock(
  "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoter",
  () => ({
    WaveLeaderboardRightSidebarVoter: (props: any) => (
      <div data-testid="voter">{props.voter.voter.handle}</div>
    ),
  })
);

const mockTopVoters = useWaveTopVoters as jest.Mock;
const mockIntersection = useIntersectionObserver as jest.Mock;

let intersectionCb: any;
mockIntersection.mockImplementation((cb: any) => {
  intersectionCb = cb;
  return { current: null };
});

describe("WaveLeaderboardRightSidebarVoters", () => {
  const wave = {
    id: "1",
    voting: { credit_type: "REP" },
  } as unknown as ApiWave;

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "connected-user" },
    });
  });

  it("shows the empty state when an authenticated profile has no voters", () => {
    mockTopVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });
    render(<WaveLeaderboardRightSidebarVoters wave={wave} />);
    expect(screen.getByText("No votes yet")).toBeInTheDocument();
  });

  it("prompts guests to connect instead of reporting an empty vote list", () => {
    (useAuth as jest.Mock).mockReturnValue({ connectedProfile: null });
    mockTopVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });

    render(<WaveLeaderboardRightSidebarVoters wave={wave} />);

    expect(screen.getByText("Connect to view votes")).toBeInTheDocument();
    expect(
      screen.getByText("Connect a profile to see who has voted.")
    ).toBeInTheDocument();
    expect(screen.queryByText("No votes yet")).not.toBeInTheDocument();
  });

  it("treats a whitespace-only connected handle as unavailable", () => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "   " },
    });
    mockTopVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });

    render(<WaveLeaderboardRightSidebarVoters wave={wave} />);

    expect(mockTopVoters).toHaveBeenCalledWith(
      expect.objectContaining({ connectedProfileHandle: undefined })
    );
    expect(screen.getByText("Connect to view votes")).toBeInTheDocument();
  });

  it("fetches next page on intersection", () => {
    const fetchNextPage = jest.fn().mockResolvedValue(undefined);
    mockTopVoters.mockReturnValue({
      voters: [{ voter: { handle: "alice" } }],
      isFetchingNextPage: false,
      fetchNextPage,
      hasNextPage: true,
      isLoading: false,
    });
    render(<WaveLeaderboardRightSidebarVoters wave={wave} />);
    expect(screen.getByTestId("voter")).toHaveTextContent("alice");
    intersectionCb();
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
