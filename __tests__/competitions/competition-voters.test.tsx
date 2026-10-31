import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import CompetitionVoters from "@/components/competitions/CompetitionVoters";
import { commonApiFetch } from "@/services/api/common-api";

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
    data: {
      pages: [
        {
          data: [
            { profile_id: "p1", votes: 5, credit_spent: 5 },
            { profile_id: "p2", votes: 3, credit_spent: 3 },
            { profile_id: "p3", votes: 1, credit_spent: 1 },
          ],
        },
      ],
    },
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
    }: {
      readonly voter: { readonly voter: { readonly handle: string } };
    }) => <div data-testid="voter-row">{voter.voter.handle}</div>,
  })
);

const mockFetch = commonApiFetch as jest.Mock;

type ObserverRecord = {
  readonly callback: IntersectionObserverCallback;
  readonly elements: Set<Element>;
};
let observers: ObserverRecord[] = [];
const originalIntersectionObserver = globalThis.IntersectionObserver;

class MockIntersectionObserver {
  private readonly record: ObserverRecord;
  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, elements: new Set() };
    observers.push(this.record);
  }
  observe(element: Element) {
    this.record.elements.add(element);
  }
  unobserve(element: Element) {
    this.record.elements.delete(element);
  }
  disconnect() {
    this.record.elements.clear();
  }
  takeRecords() {
    return [];
  }
}

const bringIntoView = (element: Element) => {
  const record = observers.find((item) => item.elements.has(element));
  if (!record) {
    throw new Error("Element is not observed");
  }
  act(() => {
    record.callback(
      [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  });
};

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
  observers = [];
  mockFetch.mockReset();
  mockFetch.mockImplementation(async ({ endpoint }: { endpoint: string }) => ({
    handle: `handle-${endpoint.split("/").pop()}`,
    pfp: null,
    primary_wallet: "0x1",
  }));
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

it("looks up voter identities only for rows near the viewport", async () => {
  renderVoters();

  const skeletons = screen.getAllByTestId("competition-voter-skeleton");
  expect(skeletons).toHaveLength(3);
  expect(mockFetch).not.toHaveBeenCalled();

  bringIntoView(skeletons[1]!.parentElement!);

  await waitFor(() =>
    expect(screen.getByTestId("voter-row")).toHaveTextContent("handle-p2")
  );
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledWith(
    expect.objectContaining({ endpoint: "identities/p2" })
  );
  expect(screen.getAllByTestId("competition-voter-skeleton")).toHaveLength(2);

  bringIntoView(
    screen.getAllByTestId("competition-voter-skeleton")[0]!.parentElement!
  );
  await waitFor(() =>
    expect(screen.getAllByTestId("voter-row")).toHaveLength(2)
  );
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
