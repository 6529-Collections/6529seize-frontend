import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemeLabLeaderboard from "@/components/leaderboard/MemeLabLeaderboard";
import { SortDirection } from "@/entities/ISort";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/components/leaderboard/NFTLeaderboard", () => ({
  fetchNftTdhResults: jest.fn(),
  PAGE_SIZE: 25,
  setScrollPosition: jest.fn(),
}));

jest.mock("@/components/leaderboard/LeaderboardCollector", () => ({
  LeaderboardCollector: (p: any) => (
    <div data-testid="collector">{p.handle}</div>
  ),
}));

jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <button
    type="button"
    data-testid="pagination"
    onClick={() => props.setPage(props.page + 1)}
  >
    next
  </button>
));

const {
  fetchNftTdhResults,
  setScrollPosition,
} = require("@/components/leaderboard/NFTLeaderboard");

const baseData = [
  {
    consolidation_key: "0x1",
    handle: "alice",
    consolidation_display: "Alice",
    pfp_url: "",
    cic_type: undefined,
    level: 1,
    balance: 5,
  },
  {
    consolidation_key: "0x2",
    handle: "bob",
    consolidation_display: "Bob",
    pfp_url: "",
    cic_type: undefined,
    level: 1,
    balance: 2,
  },
];

function setup() {
  (fetchNftTdhResults as jest.Mock)
    .mockResolvedValueOnce({ count: baseData.length, data: baseData })
    .mockResolvedValueOnce({ count: baseData.length, data: baseData })
    .mockResolvedValueOnce({ count: baseData.length, data: baseData });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemeLabLeaderboard contract="0x1" nftId={1} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (fetchNftTdhResults as jest.Mock).mockReset();
});

test("renders leaderboard and sorts when caret clicked", async () => {
  setup();

  await waitFor(() => expect(fetchNftTdhResults).toHaveBeenCalled());
  expect(setScrollPosition).not.toHaveBeenCalled();
  expect(
    screen.getByRole("heading", { name: "Collectors leaderboard" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: "Rank" })
  ).toBeInTheDocument();
  await screen.findByText("alice");
  await screen.findByText("bob");
  expect(
    screen.getByRole("columnheader", { name: "Collector x2" })
  ).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole("button", { name: "Sort Balance ascending" })
  );

  await waitFor(() => expect(fetchNftTdhResults).toHaveBeenCalledTimes(2));
  expect(fetchNftTdhResults.mock.calls[1][0]).toEqual(
    expect.objectContaining({ sortDirection: SortDirection.ASC })
  );
  expect(setScrollPosition).not.toHaveBeenCalled();
});

test("shows message when no results", async () => {
  (fetchNftTdhResults as jest.Mock).mockResolvedValueOnce({
    count: 0,
    data: [],
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemeLabLeaderboard contract="0x1" nftId={1} />
    </QueryClientProvider>
  );
  await screen.findByText("No Results found");
});
