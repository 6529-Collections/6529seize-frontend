import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";

jest.mock("@/components/leaderboard/LeaderboardCollector", () => ({
  LeaderboardCollector: (p: any) => <div>{p.handle}</div>,
}));
jest.mock("@/components/pagination/Pagination", () => (props: any) => (
  <button data-testid="next" onClick={() => props.setPage(props.page + 1)}>
    next
  </button>
));
jest.mock("@/components/searchModal/SearchModal", () => ({
  SearchWalletsDisplay: ({ setSearchWallets }: any) => (
    <button data-testid="search" onClick={() => setSearchWallets(["0x1"])}>
      search
    </button>
  ),
  SearchModalDisplay: () => null,
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (p: any) => <svg onClick={p.onClick} />,
}));

jest.mock("@/helpers/Helpers", () => ({
  numberWithCommas: (n: number) => String(n),
  cicToType: () => "T",
}));

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const commonApiFetch = require("@/services/api/common-api")
  .commonApiFetch as jest.Mock;

function renderLeaderboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NFTLeaderboard contract="0x1" nftId={1} />
    </QueryClientProvider>
  );
}

describe("NFTLeaderboard component", () => {
  const collector = {
    id: 1,
    cic_score: 0,
    consolidation_key: "1",
    handle: "alice",
    consolidation_display: "Alice",
    pfp_url: "",
    level: 1,
    balance: 1,
    boosted_tdh: 2,
    tdh__raw: 3,
    tdh_rank: 1,
    total_balance: 4,
    total_boosted_tdh: 5,
    total_tdh__raw: 6,
    primary_wallet: "0xprimary",
  };

  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    commonApiFetch.mockReset();
  });

  it("fetches data and paginates", async () => {
    commonApiFetch.mockResolvedValue({ count: 1, data: [collector] });
    renderLeaderboard();
    await screen.findByText("alice");
    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("tdh/nft/0x1/1"),
      })
    );
    await userEvent.click(screen.getByTestId("next"));
    await waitFor(() =>
      expect(commonApiFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining("page=2"),
        })
      )
    );
  });

  it("downloads a collectors CSV for the current leaderboard request", async () => {
    commonApiFetch.mockResolvedValue({ count: 1, data: [collector] });
    const createObjectURL = jest.fn(() => "blob:collectors");
    const revokeObjectURL = jest.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation();

    try {
      renderLeaderboard();
      await screen.findByText("alice");
      commonApiFetch.mockClear();
      commonApiFetch.mockResolvedValueOnce({ count: 1, data: [collector] });

      await userEvent.click(
        screen.getByRole("button", {
          name: "Download collectors leaderboard as CSV",
        })
      );

      await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
      const exportRequest = commonApiFetch.mock.calls[0]?.[0] as {
        endpoint: string;
        signal: AbortSignal;
      };
      expect(exportRequest).toEqual(
        expect.objectContaining({
          endpoint: expect.stringContaining("tdh/nft/0x1/1?"),
          signal: expect.any(AbortSignal),
        })
      );
      expect(exportRequest.endpoint).toContain("page_size=100");
      expect(exportRequest.endpoint).toContain("page=1");
      expect(exportRequest.endpoint).toContain("sort=balance");
      expect(exportRequest.endpoint).toContain("sort_direction=DESC");
      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
      expect(blob.size).toBeGreaterThan(0);
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:collectors");
    } finally {
      clickSpy.mockRestore();
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectURL,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectURL,
      });
    }
  });

  it("shows an error when the collectors CSV download fails", async () => {
    commonApiFetch.mockResolvedValue({ count: 1, data: [collector] });
    renderLeaderboard();
    await screen.findByText("alice");
    commonApiFetch.mockClear();
    commonApiFetch.mockRejectedValueOnce(new Error("download failed"));

    await userEvent.click(
      screen.getByRole("button", {
        name: "Download collectors leaderboard as CSV",
      })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't download collectors CSV. Please try again."
    );
  });
});
