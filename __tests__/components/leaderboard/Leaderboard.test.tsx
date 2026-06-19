import Leaderboard from "@/components/leaderboard/Leaderboard";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { LeaderboardFocus } from "@/types/enums";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const fetchUrl = jest.fn();
const commonApiFetch = jest.fn();
const usePathnameMock = jest.fn();

jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: any[]) => fetchUrl(...args),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: any[]) => commonApiFetch(...args),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
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
  jest.clearAllMocks();
  fetchUrl.mockResolvedValue({ data: [{ block_number: 1, timestamp: 0 }] });
  commonApiFetch.mockResolvedValue([]);
  usePathnameMock.mockReturnValue("/");
});

test("shows view all link when not on network page", async () => {
  render(
    <Leaderboard
      focus={LeaderboardFocus.TDH}
      setFocus={jest.fn()}
      tdhView={ApiConsolidatedTdhView.Boosted}
      setTdhView={jest.fn()}
    />
  );
  await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
  expect(screen.getByText("View All")).toBeInTheDocument();
});

test("renders seasons and switches focus", async () => {
  usePathnameMock.mockReturnValue("/network/nerd/cards-collected");
  commonApiFetch.mockResolvedValue([{ id: 1, display: "S1" }]);
  const setFocus = jest.fn();
  const user = userEvent.setup();
  render(
    <Leaderboard
      focus={LeaderboardFocus.TDH}
      setFocus={setFocus}
      tdhView={ApiConsolidatedTdhView.Boosted}
      setTdhView={jest.fn()}
    />
  );
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
  expect(screen.queryByText("View All")).toBeNull();

  // Switch to Interactions focus
  await user.click(screen.getByRole("button", { name: "Interactions" }));
  expect(setFocus).toHaveBeenCalledWith(LeaderboardFocus.INTERACTIONS);

  // Change collector to MEMES to enable seasons dropdown
  await user.click(screen.getByText("Collectors: All"));
  await user.click(screen.getByText("Memes"));

  // Now seasons dropdown should be enabled and we can find S1
  await user.click(screen.getByText("SZN: All"));
  expect(await screen.findByText("S1")).toBeInTheDocument();
});

test("shows zero daily change without a loader when selected network TDH is zero", async () => {
  usePathnameMock.mockReturnValue("/network/nerd/cards-collected");
  fetchUrl.mockImplementation((url: string) => {
    if (url.includes("tdh_global_history")) {
      return Promise.resolve({
        data: [
          {
            block: 1,
            date: new Date(0),
            created_tdh: 0,
            destroyed_tdh: 0,
            net_tdh: 0,
            created_boosted_tdh: 0,
            destroyed_boosted_tdh: 0,
            net_boosted_tdh: 0,
            created_tdh__raw: 0,
            destroyed_tdh__raw: 0,
            net_tdh__raw: 0,
            memes_balance: 0,
            gradients_balance: 0,
            total_boosted_tdh: 0,
            total_tdh: 0,
            total_tdh__raw: 0,
            gradients_boosted_tdh: 0,
            gradients_tdh: 0,
            gradients_tdh__raw: 0,
            memes_boosted_tdh: 0,
            memes_tdh: 0,
            memes_tdh__raw: 0,
            total_consolidated_wallets: 0,
            total_wallets: 0,
          },
        ],
      });
    }

    return Promise.resolve({ data: [{ block_number: 1, timestamp: 0 }] });
  });

  render(
    <Leaderboard
      focus={LeaderboardFocus.TDH}
      setFocus={jest.fn()}
      tdhView={ApiConsolidatedTdhView.Boosted}
      setTdhView={jest.fn()}
    />
  );

  expect(await screen.findByText("(n/a)")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByTestId("loader")).toBeNull());
});
