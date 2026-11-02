import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import CompetitionVoters from "@/components/competitions/CompetitionVoters";
import { commonApiFetch } from "@/services/api/common-api";

type MockVoter = {
  readonly profile_id: string;
  readonly votes: number;
  readonly credit_spent: number;
  readonly voter?: {
    readonly id: string;
    readonly handle: string | null;
    readonly pfp: string | null;
    readonly primary_address: string;
  };
};

let mockVoters: MockVoter[] = [];

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: { id: "c1", wave_id: "w1", voting: { credit_type: "REP" } },
  }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionResource: () => ({
    isPending: false,
    isError: false,
    data: { pages: [{ data: mockVoters }] },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
  }),
}));
jest.mock(
  "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoter",
  () => ({
    WaveLeaderboardRightSidebarVoter: ({
      voter,
      position,
    }: {
      readonly position: number;
      readonly voter: {
        readonly voter: {
          readonly id: string;
          readonly handle: string | null;
          readonly primary_address: string;
        };
        readonly absolute_votes_summed: number;
        readonly positive_votes_summed: number;
        readonly negative_votes_summed: number;
      };
    }) => (
      <div data-testid="voter-row">
        {[
          position,
          voter.voter.id,
          voter.voter.handle,
          voter.voter.primary_address,
          voter.absolute_votes_summed,
          voter.positive_votes_summed,
          voter.negative_votes_summed,
        ].join("|")}
      </div>
    ),
  })
);

const mockFetch = commonApiFetch as jest.Mock;

// Fallback rows defer their lookup until they near the viewport; report every
// observed row as visible so the fallback path runs.
class VisibleIntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(element: Element) {
    this.callback(
      [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
const originalIntersectionObserver = globalThis.IntersectionObserver;

const renderVoters = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CompetitionVoters />
    </QueryClientProvider>
  );

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async ({ endpoint }: { endpoint: string }) => ({
    handle: `looked-up-${endpoint.split("/").pop()}`,
    pfp: null,
    primary_wallet: "0xfallback",
  }));
  globalThis.IntersectionObserver =
    VisibleIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

it("renders embedded voter profiles without per-row identity requests", () => {
  mockVoters = [
    {
      profile_id: "p1",
      votes: 6,
      credit_spent: 10,
      voter: { id: "p1", handle: "alice", pfp: null, primary_address: "0xa" },
    },
    {
      profile_id: "p2",
      votes: -2,
      credit_spent: 4,
      voter: { id: "p2", handle: null, pfp: null, primary_address: "0xb" },
    },
  ];

  renderVoters();

  expect(
    screen.getAllByTestId("voter-row").map((row) => row.textContent)
  ).toEqual(["1|p1|alice|0xa|10|8|2", "2|p2||0xb|4|1|3"]);
  expect(screen.queryByTestId("competition-voter-skeleton")).toBeNull();
  expect(mockFetch).not.toHaveBeenCalled();
});

it("looks up the identity only for voters without an embedded profile", async () => {
  mockVoters = [
    {
      profile_id: "p1",
      votes: 5,
      credit_spent: 5,
      voter: { id: "p1", handle: "alice", pfp: null, primary_address: "0xa" },
    },
    { profile_id: "p2", votes: 3, credit_spent: 3 },
  ];

  renderVoters();

  expect(screen.getByTestId("voter-row")).toHaveTextContent(
    "1|p1|alice|0xa|5|5|0"
  );
  await waitFor(() =>
    expect(
      screen.getAllByTestId("voter-row").map((row) => row.textContent)
    ).toEqual(["1|p1|alice|0xa|5|5|0", "2|p2|looked-up-p2|0xfallback|3|3|0"])
  );
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledWith(
    expect.objectContaining({ endpoint: "identities/p2" })
  );
});
