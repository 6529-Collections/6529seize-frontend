import { render, screen } from "@testing-library/react";
import LeaderboardCardsCollectedComponent from "@/components/leaderboard/LeaderboardCardsCollected";
import { Content, Collector } from "@/components/leaderboard/Leaderboard";

jest.mock("@/components/leaderboard/leaderboard_helpers", () => {
  const original = jest.requireActual(
    "../../../components/leaderboard/leaderboard_helpers"
  );
  return {
    ...original,
    useFetchLeaderboard: jest.fn(),
  };
});

const useFetchLeaderboard =
  require("@/components/leaderboard/leaderboard_helpers")
    .useFetchLeaderboard as jest.Mock;

const baseProps = {
  block: 1,
  content: Content.ALL,
  collector: Collector.ALL,
  selectedSeason: 1,
  searchWallets: [],
  seasons: [],
  isLoading: false,
  setIsLoading: jest.fn(),
};

function renderComponent(data: any, loading = false, globalChange?: number) {
  useFetchLeaderboard.mockReturnValue({
    myFetchUrl: "/api",
    totalResults: data ? data.length : 0,
    leaderboard: data,
  });
  render(
    <LeaderboardCardsCollectedComponent
      {...baseProps}
      globalTdhRateChange={globalChange}
      isLoading={loading}
    />
  );
}

describe("LeaderboardCardsCollectedComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders no content when leaderboard is undefined", () => {
    renderComponent(undefined, false);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("shows message when no results and not loading", () => {
    renderComponent([], false);
    expect(
      screen.getByText("No results found. Change filters and try again.")
    ).toBeInTheDocument();
  });

  it("renders leaderboard rows with calculated values", () => {
    const leaderboard = [
      {
        consolidation_key: "0x1",
        handle: "alice",
        consolidation_display: "Alice",
        pfp_url: "",
        cic_type: undefined,
        level: 2,
        balance: 5,
        unique_memes: 3,
        unique_memes_total: 10,
        memes_cards_sets: 1,
        boosted_tdh: 42,
        day_change: 10,
        total_tdh: 100,
      },
      {
        consolidation_key: "0x2",
        handle: "bob",
        consolidation_display: "Bob",
        pfp_url: "",
        cic_type: undefined,
        level: 1,
        balance: 1,
        unique_memes: 0,
        unique_memes_total: 5,
        memes_cards_sets: 0,
        boosted_tdh: 5,
        day_change: 0,
        total_tdh: 50,
      },
      {
        consolidation_key: "0x3",
        handle: "carol",
        consolidation_display: "Carol",
        pfp_url: "",
        cic_type: undefined,
        level: 3,
        balance: 468,
        unique_memes: 468,
        unique_memes_total: 469,
        memes_cards_sets: 12,
        boosted_tdh: 99,
        day_change: 5,
        total_tdh: 250,
      },
      {
        consolidation_key: "0x4",
        handle: "dave",
        consolidation_display: "Dave",
        pfp_url: "",
        cic_type: undefined,
        level: 4,
        balance: 1999,
        unique_memes: 1999,
        unique_memes_total: 2000,
        memes_cards_sets: 20,
        boosted_tdh: 101,
        day_change: 2,
        total_tdh: 400,
      },
    ];
    renderComponent(leaderboard, false, 20);

    const rows = screen.getAllByRole("row");
    // First row corresponds to table header, others to data
    expect(rows).toHaveLength(5);

    // check rank numbering
    expect(rows[1]).toHaveTextContent("1");
    expect(rows[2]).toHaveTextContent("2");
    expect(rows[3]).toHaveTextContent("3");
    expect(rows[4]).toHaveTextContent("4");

    expect(rows[1]).toHaveTextContent(/3\s*\/\s*10\s*\(30%\)/);
    expect(rows[2]).toHaveTextContent(/0\s*\/\s*5\s*\(0%\)/);
    expect(rows[3]).toHaveTextContent(/468\s*\/\s*469\s*\(99\.8%\)/);
    expect(rows[4]).toHaveTextContent(/1,999\s*\/\s*2,000\s*\(99\.9%\)/);

    // tdh change with percentage and vs network
    expect(rows[1]).toHaveTextContent("+10");
    expect(rows[1]).toHaveTextContent("(10.00%)");
    expect(rows[1]).toHaveTextContent("0.50x");

    // second row with zero change shows dash and dash vs network
    expect(rows[2]).toHaveTextContent("-");
  });
});
