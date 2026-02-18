import { render, screen } from "@testing-library/react";
import React from "react";
import MyStreamWaveMyVotes from "@/components/brain/my-stream/votes/MyStreamWaveMyVotes";
import { AuthContext } from "@/components/auth/Auth";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";

let intersectionCb: () => void = () => {};
let resetProps: any = null;

jest.mock("@/hooks/useWaveDropsLeaderboard");
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: (cb: any) => {
    intersectionCb = cb;
    return { current: null };
  },
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ myVotesViewStyle: {} }),
}));
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVote",
  () => (p: any) => <div data-testid="vote">{p.drop.id}</div>
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

describe("MyStreamWaveMyVotes", () => {
  const wave = { id: "1" } as any;
  const onDropClick = jest.fn();
  const auth = { connectedProfile: { handle: "me" } } as any;

  beforeEach(() => {
    useWaveDropsLeaderboardMock.mockReset();
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
});
