import { render, waitFor } from "@testing-library/react";
import {
  getLeaderboardDownloadFileName,
  useFetchLeaderboard,
} from "../../../components/leaderboard/leaderboard_helpers";
import { SortDirection } from "../../../entities/ISort";
import {
  Content,
  Collector,
} from "../../../components/leaderboard/Leaderboard";

jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(() =>
    Promise.resolve({ count: 1, data: [{ cic_score: 1 }], page: 1, next: null })
  ),
}));

function TestComponent() {
  const result = useFetchLeaderboard<any>(
    "endpoint",
    1,
    { sort: "level", sort_direction: SortDirection.ASC },
    {
      searchWallets: ["a"],
      content: Content.ALL,
      collector: Collector.ALL,
      selectedSeason: 0,
    },
    jest.fn()
  );
  return <div data-testid="url">{result.myFetchUrl}</div>;
}

describe("leaderboard helpers", () => {
  it("formats download filename", () => {
    expect(getLeaderboardDownloadFileName("lead", 10, 2)).toBe(
      "lead-10-page2.csv"
    );
    expect(getLeaderboardDownloadFileName("lead", 0, 0)).toBe("lead.csv");
  });

  it("fetches data", async () => {
    process.env.API_ENDPOINT = "https://test.6529.io";
    const { findByTestId } = render(<TestComponent />);
    const div = await findByTestId("url");
    await waitFor(() =>
      expect(div.textContent).toBe(
        "https://test.6529.io/api/endpoint?page_size=50&page=1&sort=level&sort_direction=ASC&search=a"
      )
    );
  });
});
