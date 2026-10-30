import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";
import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";

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

  type LeaderboardResponse = {
    count: number;
    page: number;
    data: (typeof collector)[];
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
    const collectorRow = (
      await within(screen.getByRole("table")).findByText("alice")
    ).closest("tr");
    expect(collectorRow).toHaveClass(
      "tw-group",
      "even:tw-bg-iron-900/70",
      "hover:tw-bg-iron-900",
      "focus-within:tw-bg-iron-900"
    );
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

  it("does not show an empty result before the initial request finishes", async () => {
    const request = createDeferredPromise<LeaderboardResponse>();
    commonApiFetch.mockReturnValueOnce(request.promise);
    renderLeaderboard();

    expect(screen.queryByText("No Results found")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next")).not.toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve({ count: 0, page: 1, data: [] });
    });

    expect(await screen.findByText("No Results found")).toBeInTheDocument();
    expect(screen.queryByTestId("next")).not.toBeInTheDocument();
  });

  it("ignores out-of-order sort responses and aborts obsolete requests", async () => {
    const olderSort = createDeferredPromise<LeaderboardResponse>();
    const newerSort = createDeferredPromise<LeaderboardResponse>();
    const pendingDirection = createDeferredPromise<LeaderboardResponse>();
    commonApiFetch
      .mockResolvedValueOnce({ count: 1, page: 1, data: [collector] })
      .mockReturnValueOnce(olderSort.promise)
      .mockReturnValueOnce(newerSort.promise)
      .mockReturnValueOnce(pendingDirection.promise);
    const { unmount } = renderLeaderboard();
    const list = within(screen.getByRole("list"));
    await list.findByText("alice");
    const sortGroup = within(
      screen.getByRole("group", { name: "Sort collectors by" })
    );

    await userEvent.click(sortGroup.getByRole("button", { name: "TDH" }));
    const olderSignal: AbortSignal = commonApiFetch.mock.calls[1][0].signal;
    await userEvent.click(
      sortGroup.getByRole("button", { name: "Unweighted TDH" })
    );
    expect(olderSignal.aborted).toBe(true);
    expect(list.getByText("alice")).toBeInTheDocument();

    await act(async () => {
      newerSort.resolve({
        count: 1,
        page: 1,
        data: [{ ...collector, handle: "newer-result" }],
      });
    });
    await list.findByText("newer-result");

    await act(async () => {
      olderSort.resolve({
        count: 1,
        page: 1,
        data: [{ ...collector, handle: "stale-result" }],
      });
    });
    expect(list.getByText("newer-result")).toBeInTheDocument();
    expect(list.queryByText("stale-result")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("table")).getByText("newer-result")
    ).toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledTimes(3);

    await userEvent.click(
      screen.getByRole("button", { name: "Sort ascending" })
    );
    const activeSignal: AbortSignal = commonApiFetch.mock.calls[3][0].signal;
    expect(activeSignal.aborted).toBe(false);
    unmount();
    expect(activeSignal.aborted).toBe(true);
    await act(async () => {
      pendingDirection.resolve({ count: 0, page: 1, data: [] });
    });
  });

  it("keeps previous page ranks until the next page arrives", async () => {
    const nextPage = createDeferredPromise<LeaderboardResponse>();
    commonApiFetch
      .mockResolvedValueOnce({ count: 79, page: 1, data: [collector] })
      .mockReturnValueOnce(nextPage.promise);
    renderLeaderboard();
    const list = within(screen.getByRole("list"));
    await list.findByText("alice");

    await userEvent.click(screen.getByTestId("next"));
    expect(list.getByText("Rank").parentElement).toHaveTextContent(/^Rank 1$/);
    expect(list.getByText("alice")).toBeInTheDocument();
    expect(screen.queryByText("No Results found")).not.toBeInTheDocument();

    await act(async () => {
      nextPage.resolve({
        count: 79,
        page: 2,
        data: [{ ...collector, handle: "next-page-collector" }],
      });
    });
    await list.findByText("next-page-collector");
    expect(list.getByText("Rank").parentElement).toHaveTextContent(/^Rank 26$/);
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
  });

  it("shows the CSV tooltip on hover and keyboard focus without downloading", async () => {
    const user = userEvent.setup();
    commonApiFetch.mockResolvedValue({ count: 1, data: [collector] });
    renderLeaderboard();
    await within(screen.getByRole("table")).findByText("alice");
    commonApiFetch.mockClear();
    const downloadButton = screen.getByRole("button", {
      name: "Download collectors leaderboard as CSV",
    });

    await user.hover(downloadButton);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Download CSV"
    );
    await user.unhover(downloadButton);
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    );

    await user.tab();
    expect(downloadButton).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Download CSV"
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    );
    expect(downloadButton).toHaveFocus();
    expect(commonApiFetch).not.toHaveBeenCalled();
  });

  it("downloads a collectors CSV for the current leaderboard request", async () => {
    commonApiFetch.mockResolvedValue({ count: 1, data: [collector] });
    const createObjectURL = jest.fn<string, [Blob]>(() => "blob:collectors");
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
      await within(screen.getByRole("table")).findByText("alice");
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
      const blob = createObjectURL.mock.calls[0]?.[0];
      expect(blob?.size).toBeGreaterThan(0);
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
    await within(screen.getByRole("table")).findByText("alice");
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

  it.each([
    ["Balance", "balance"],
    ["TDH", "boosted_tdh"],
    ["Unweighted TDH", "tdh__raw"],
    ["Total balance", "total_balance"],
    ["Total TDH", "total_boosted_tdh"],
    ["Total unweighted TDH", "total_tdh__raw"],
  ])(
    "keeps direction while choosing %s and resets the page",
    async (label, key) => {
      commonApiFetch.mockResolvedValue({
        count: 79,
        page: 1,
        data: [collector],
      });
      renderLeaderboard();
      await within(screen.getByRole("list")).findByText("alice");
      await userEvent.click(
        screen.getByRole("button", { name: "Sort ascending" })
      );
      await userEvent.click(screen.getByTestId("next"));
      await userEvent.click(
        within(
          screen.getByRole("group", { name: "Sort collectors by" })
        ).getByRole("button", { name: label })
      );
      await waitFor(() =>
        expect(commonApiFetch).toHaveBeenLastCalledWith(
          expect.objectContaining({
            endpoint: expect.stringContaining(
              `page=1&sort=${key}&sort_direction=ASC`
            ),
          })
        )
      );
      expect(
        screen.getByRole("button", { name: "Sort ascending" })
      ).toHaveAttribute("aria-pressed", "true");
      await userEvent.click(
        screen.getByRole("button", { name: "Sort descending" })
      );
      await waitFor(() =>
        expect(commonApiFetch).toHaveBeenLastCalledWith(
          expect.objectContaining({
            endpoint: expect.stringContaining(
              `sort=${key}&sort_direction=DESC`
            ),
          })
        )
      );
    }
  );

  it("retains previous rows while loading and uses TDH ranks for filtered results", async () => {
    commonApiFetch.mockResolvedValueOnce({
      count: 79,
      page: 1,
      data: [collector],
    });
    renderLeaderboard();
    const list = within(screen.getByRole("list"));
    await list.findByText("alice");
    let finishRequest: (value: unknown) => void = () => undefined;
    commonApiFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRequest = resolve;
        })
    );
    await userEvent.click(screen.getByTestId("search"));
    expect(list.getByText("alice")).toBeInTheDocument();
    finishRequest({
      count: 1,
      page: 1,
      data: [{ ...collector, tdh_rank: 87 }],
    });
    await waitFor(() => expect(list.getByText("87")).toBeInTheDocument());
    expect(screen.queryByText("1 collector")).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Collector x1" })
    ).toBeInTheDocument();
  });

  it("shows compact totals with exact accessible values and preserves zero", async () => {
    commonApiFetch.mockResolvedValue({
      count: 1,
      page: 1,
      data: [
        {
          ...collector,
          boosted_tdh: 0,
          total_balance: 99999,
          total_boosted_tdh: 181123456,
          total_tdh__raw: 379701,
        },
      ],
    });
    renderLeaderboard();
    const list = within(screen.getByRole("list"));
    await list.findByText("alice");
    expect(list.getByText("181.1M")).toBeInTheDocument();
    expect(list.getByText("Total TDH: 181,123,456")).toBeInTheDocument();
    expect(list.getByText("379.7K")).toBeInTheDocument();
    expect(list.getByText("99,999")).toBeInTheDocument();
    expect(list.getByText("This card TDH: 0")).toBeInTheDocument();
    expect(list.getByText("This card balance: 1")).toBeInTheDocument();
    expect(list.getByText("Total", { exact: true })).toBeInTheDocument();
    for (const label of ["Balance", "TDH", "Unweighted TDH"]) {
      expect(list.getByText(label, { exact: true })).toBeInTheDocument();
    }
  });
});
