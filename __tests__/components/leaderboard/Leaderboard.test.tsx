import Leaderboard from "@/components/leaderboard/Leaderboard";
import { LeaderboardFocus } from "@/types/enums";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const fetchUrl = jest.fn();
const commonApiFetch = jest.fn();

jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: any[]) => fetchUrl(...args),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: any[]) => commonApiFetch(...args),
}));

jest.mock("@/components/leaderboard/LeaderboardCardsCollected", () => () => (
  <div data-testid="cards" />
));
jest.mock("@/components/leaderboard/LeaderboardInteractions", () => () => (
  <div data-testid="interactions" />
));
jest.mock("@/components/searchModal/SearchModal", () => ({
  SearchModalDisplay: () => <div data-testid="modal" />,
  SearchWalletsDisplay: () => <div data-testid="search" />,
}));
jest.mock("@/components/dotLoader/DotLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  Spinner: () => <div data-testid="spinner" />,
}));

beforeEach(() => {
  fetchUrl.mockResolvedValue({ data: [{ block_number: 1, timestamp: 0 }] });
  commonApiFetch.mockResolvedValue([]);
});

test("shows view all link when not on network page", async () => {
  globalThis.location.pathname = "/";
  render(<Leaderboard focus={LeaderboardFocus.TDH} setFocus={jest.fn()} />);
  await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
  expect(screen.getByText("View All")).toBeInTheDocument();
});

test("renders seasons and switches focus", async () => {
  globalThis.history.pushState({}, "", "/network");
  commonApiFetch.mockResolvedValue([{ id: 1, display: "S1" }]);
  const setFocus = jest.fn();
  const user = userEvent.setup();
  render(<Leaderboard focus={LeaderboardFocus.TDH} setFocus={setFocus} />);
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
  expect(screen.queryByText("View All")).toBeNull();

  // Switch to Interactions focus
  await user.click(screen.getByText("Interactions"));
  expect(setFocus).toHaveBeenCalledWith(LeaderboardFocus.INTERACTIONS);

  // Change collector to MEMES to enable seasons dropdown
  await user.click(screen.getByText("Collectors: All"));
  await user.click(screen.getByText("Memes"));

  // Now seasons dropdown should be enabled and we can find S1
  await user.click(screen.getByText("SZN: All"));
  expect(await screen.findByText("S1")).toBeInTheDocument();
});
