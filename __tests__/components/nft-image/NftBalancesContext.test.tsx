import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import { NftBalancesProvider } from "@/components/nft-image/NftBalancesContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NftOwner } from "@/entities/IOwner";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile }),
}));

const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const MEME_LAB = "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb";
const fetchBalances = jest.mocked(commonApiFetch);
let connectedProfile: { consolidation_key: string } | null;
let queryClient: QueryClient;

function ownershipPage(
  contract: string,
  ids: readonly number[],
  next: string | null = null
): DBResponse<NftOwner> {
  return {
    count: ids.length,
    page: 1,
    next,
    data: ids.map((token_id) => ({ contract, token_id, balance: 2 })),
  };
}

function descendingIds(count: number) {
  return Array.from({ length: count }, (_, index) => 144 - index);
}

function Grid({
  contract = MEMES,
  tokenIds = [1],
  enabled = true,
}: {
  readonly contract?: string;
  readonly tokenIds?: readonly number[];
  readonly enabled?: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <NftBalancesProvider
        consolidationKey={connectedProfile?.consolidation_key ?? null}
        contract={contract}
        tokenIds={tokenIds}
        enabled={enabled}
      >
        <ul>
          {tokenIds.map((tokenId) => (
            <li key={tokenId} aria-label={`Token ${tokenId}`}>
              <NFTImageBalance
                contract={contract}
                tokenId={tokenId}
                height={300}
              />
            </li>
          ))}
        </ul>
      </NftBalancesProvider>
    </QueryClientProvider>
  );
}

function expectBalance(tokenId: number, label: string) {
  expect(
    within(
      screen.getByRole("listitem", { name: `Token ${tokenId}` })
    ).getByText(label)
  ).toBeInTheDocument();
}

describe("collection balance snapshots", () => {
  beforeEach(() => {
    connectedProfile = { consolidation_key: "profile-a" };
    fetchBalances.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.restoreAllMocks();
  });

  it.each([
    ["The Memes", MEMES],
    ["Meme Lab (including collection grids)", MEME_LAB],
  ])("retains balances across three grid pages in %s", async (_, contract) => {
    const secondPage = Promise.withResolvers<DBResponse<NftOwner>>();
    const ownedIds = Array.from({ length: 144 }, (_, index) => index + 1);
    fetchBalances
      .mockResolvedValueOnce(
        ownershipPage(contract, ownedIds.slice(0, 50), "?page=2")
      )
      .mockReturnValueOnce(secondPage.promise)
      .mockResolvedValueOnce(ownershipPage(contract, ownedIds.slice(100)));

    const { rerender } = render(
      <Grid contract={contract} tokenIds={descendingIds(48)} />
    );
    await waitFor(() => expect(fetchBalances).toHaveBeenCalledTimes(2));
    expectBalance(144, "...");
    expect(screen.queryByText("UNSEIZED")).not.toBeInTheDocument();

    await act(async () => {
      secondPage.resolve(
        ownershipPage(contract, ownedIds.slice(50, 100), "?page=3")
      );
    });
    await waitFor(() => expectBalance(144, "SEIZED x2"));
    expect(fetchBalances).toHaveBeenCalledTimes(3);
    for (const page of [1, 2, 3]) {
      expect(fetchBalances).toHaveBeenNthCalledWith(page, {
        endpoint: "nft-owners/consolidation/profile-a",
        params: { contract, page: String(page), page_size: "100" },
        signal: expect.any(AbortSignal),
        errorMode: "structured",
      });
    }

    for (const count of [96, 144]) {
      rerender(<Grid contract={contract} tokenIds={descendingIds(count)} />);
      expect(screen.getAllByText("SEIZED x2")).toHaveLength(count);
      expectBalance(144, "SEIZED x2");
      expect(fetchBalances).toHaveBeenCalledTimes(3);
    }

    // Sorting and narrowing to a collection/season reuse the complete snapshot.
    rerender(<Grid contract={contract} tokenIds={[1, 144]} />);
    expectBalance(1, "SEIZED x2");
    expectBalance(144, "SEIZED x2");
    expect(fetchBalances).toHaveBeenCalledTimes(3);
  });

  it("marks absent tokens unseized only after the last balance page resolves", async () => {
    const lastPage = Promise.withResolvers<DBResponse<NftOwner>>();
    fetchBalances
      .mockResolvedValueOnce(ownershipPage(MEMES, [1], "?page=2"))
      .mockReturnValueOnce(lastPage.promise);
    render(<Grid tokenIds={[1, 2]} />);
    await waitFor(() => expect(fetchBalances).toHaveBeenCalledTimes(2));
    expectBalance(1, "...");
    expectBalance(2, "...");
    await act(async () => {
      lastPage.resolve(ownershipPage(MEMES, []));
    });
    await waitFor(() => expectBalance(1, "SEIZED x2"));
    expectBalance(2, "UNSEIZED");
  });

  it("shows an error instead of publishing a partial balance snapshot", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    fetchBalances
      .mockResolvedValueOnce(ownershipPage(MEMES, [1], "?page=2"))
      .mockRejectedValueOnce(new Error("Second balance page failed"));
    render(<Grid tokenIds={[1, 2]} />);
    await waitFor(() => expect(screen.getAllByText("N/A")).toHaveLength(2));
    expect(screen.queryByText("UNSEIZED")).not.toBeInTheDocument();
    expect(screen.queryByText("SEIZED x2")).not.toBeInTheDocument();
  });

  it("stops a nonterminating API response without exposing partial balances", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    fetchBalances.mockResolvedValue(ownershipPage(MEMES, [1], "?page=2"));
    render(<Grid />);
    await waitFor(() => expectBalance(1, "N/A"));
    expect(fetchBalances).toHaveBeenCalledTimes(100);
    expect(screen.queryByText("SEIZED x2")).not.toBeInTheDocument();
  });

  it.each([undefined, null, {}])(
    "rejects malformed page data (%p) instead of assuming zero",
    async (data) => {
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      fetchBalances
        .mockResolvedValueOnce(ownershipPage(MEMES, [1], "?page=2"))
        .mockResolvedValueOnce({ count: 2, page: 2, next: null, data });
      render(<Grid tokenIds={[1, 2]} />);
      await waitFor(() => expect(screen.getAllByText("N/A")).toHaveLength(2));
      expect(screen.queryByText("UNSEIZED")).not.toBeInTheDocument();
      expect(fetchBalances).toHaveBeenCalledTimes(2);
    }
  );

  it.each([undefined, false, 0, {}, "", " "])(
    "rejects malformed pagination (%p) without publishing partial balances",
    async (next) => {
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      fetchBalances
        .mockResolvedValueOnce(ownershipPage(MEMES, [1], "?page=2"))
        .mockResolvedValueOnce({ ...ownershipPage(MEMES, []), next });
      render(<Grid tokenIds={[1, 2]} />);
      await waitFor(() => expect(screen.getAllByText("N/A")).toHaveLength(2));
      expect(screen.queryByText("UNSEIZED")).not.toBeInTheDocument();
      expect(screen.queryByText("SEIZED x2")).not.toBeInTheDocument();
      expect(fetchBalances).toHaveBeenCalledTimes(2);
    }
  );

  it("rejects an empty intermediate page without requesting more pages", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    fetchBalances.mockResolvedValue(ownershipPage(MEMES, [], "?page=2"));
    render(<Grid />);
    await waitFor(() => expectBalance(1, "N/A"));
    expect(fetchBalances).toHaveBeenCalledTimes(1);
  });

  it("encodes the consolidation key as a single path segment", async () => {
    connectedProfile = {
      consolidation_key: "profile/with?reserved#characters",
    };
    fetchBalances.mockResolvedValueOnce(ownershipPage(MEMES, [1]));
    render(<Grid />);
    await waitFor(() => expectBalance(1, "SEIZED x2"));
    expect(fetchBalances).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint:
          "nft-owners/consolidation/profile%2Fwith%3Freserved%23characters",
      })
    );
  });

  it("cancels a later page when signing out without fetching another page", async () => {
    const lastPage = Promise.withResolvers<DBResponse<NftOwner>>();
    fetchBalances
      .mockResolvedValueOnce(ownershipPage(MEMES, [1], "?page=2"))
      .mockReturnValueOnce(lastPage.promise);
    const { rerender } = render(<Grid />);
    await waitFor(() => expect(fetchBalances).toHaveBeenCalledTimes(2));
    const signal = fetchBalances.mock.calls[1]?.[0].signal;
    connectedProfile = null;
    rerender(<Grid />);
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      lastPage.resolve(ownershipPage(MEMES, [2], "?page=3"));
    });
    expect(fetchBalances).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("SEIZED x2")).not.toBeInTheDocument();
  });

  it("loads an initially empty grid and preserves cached ownership when filters reset", async () => {
    queryClient.setDefaultOptions({
      queries: { retry: false, gcTime: Infinity, staleTime: 10000 },
    });
    fetchBalances.mockResolvedValueOnce(ownershipPage(MEMES, [1, 2]));
    const { rerender } = render(<Grid tokenIds={[]} />);
    expect(fetchBalances).not.toHaveBeenCalled();
    rerender(<Grid tokenIds={[1]} />);
    await waitFor(() => expectBalance(1, "SEIZED x2"));
    rerender(<Grid tokenIds={[]} />);
    rerender(<Grid tokenIds={[2, 1]} />);
    expectBalance(1, "SEIZED x2");
    expectBalance(2, "SEIZED x2");
    expect(fetchBalances).toHaveBeenCalledTimes(1);
  });

  it.each(["profile", "contract"])(
    "isolates balances when the %s changes",
    async (scope) => {
      fetchBalances.mockResolvedValueOnce(ownershipPage(MEMES, [1]));
      const { rerender } = render(<Grid />);
      await waitFor(() => expectBalance(1, "SEIZED x2"));

      const newSnapshot = Promise.withResolvers<DBResponse<NftOwner>>();
      fetchBalances.mockReturnValueOnce(newSnapshot.promise);
      const nextContract = scope === "contract" ? MEME_LAB : MEMES;
      if (scope === "profile")
        connectedProfile = { consolidation_key: "profile-b" };
      rerender(<Grid contract={nextContract} />);
      expectBalance(1, "...");
      await act(async () => {
        newSnapshot.resolve(ownershipPage(nextContract, []));
      });
      await waitFor(() => expectBalance(1, "UNSEIZED"));
      expect(fetchBalances).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endpoint: `nft-owners/consolidation/${connectedProfile?.consolidation_key}`,
          params: { contract: nextContract, page: "1", page_size: "100" },
        })
      );
    }
  );

  it("replaces old holdings with a complete refreshed snapshot after a transfer", async () => {
    fetchBalances.mockResolvedValueOnce(ownershipPage(MEMES, [1]));
    render(<Grid />);
    await waitFor(() => expectBalance(1, "SEIZED x2"));
    fetchBalances.mockResolvedValueOnce(ownershipPage(MEMES, []));
    await act(async () => {
      await queryClient.invalidateQueries();
    });
    await waitFor(() => expectBalance(1, "UNSEIZED"));
  });

  it("cancels an abandoned profile snapshot without leaking its late result", async () => {
    const oldSnapshot = Promise.withResolvers<DBResponse<NftOwner>>();
    fetchBalances.mockReturnValueOnce(oldSnapshot.promise);
    const { rerender } = render(<Grid />);
    await waitFor(() => expect(fetchBalances).toHaveBeenCalledTimes(1));
    const oldSignal = fetchBalances.mock.calls[0]?.[0].signal;
    connectedProfile = { consolidation_key: "profile-b" };
    fetchBalances.mockResolvedValueOnce(ownershipPage(MEMES, []));
    rerender(<Grid />);
    await waitFor(() => expectBalance(1, "UNSEIZED"));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => {
      oldSnapshot.resolve(ownershipPage(MEMES, [1]));
    });
    expectBalance(1, "UNSEIZED");
    connectedProfile = null;
    rerender(<Grid />);
    expect(screen.queryByText("UNSEIZED")).not.toBeInTheDocument();
    expect(fetchBalances).toHaveBeenCalledTimes(2);
  });

  it("uses one cache entry for different contract casing", async () => {
    fetchBalances.mockResolvedValueOnce(ownershipPage(MEMES, [1]));
    const { rerender } = render(<Grid />);
    await waitFor(() => expectBalance(1, "SEIZED x2"));
    rerender(<Grid contract={MEMES.toUpperCase()} />);
    expectBalance(1, "SEIZED x2");
    expect(fetchBalances).toHaveBeenCalledTimes(1);
  });

  it("does not fetch before a grid has cards or while disabled or signed out", () => {
    const { rerender } = render(<Grid tokenIds={[]} />);
    rerender(<Grid enabled={false} />);
    connectedProfile = null;
    rerender(<Grid />);
    expect(fetchBalances).not.toHaveBeenCalled();
  });
});
