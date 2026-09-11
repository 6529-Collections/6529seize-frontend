import { useCollectCatalog } from "@/components/collect/useCollectCatalog";
import type { CollectIntent } from "@/components/collect/collect.types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockFetchListings = jest.fn();
const mockFetchAssets = jest.fn();

jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { MARKET_LISTINGS: "market-listings" },
}));
jest.mock("@/services/api/market-api", () => ({
  fetchMarketListings: (...args: unknown[]) => mockFetchListings(...args),
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssets: (...args: unknown[]) => mockFetchAssets(...args),
}));

const entry = { asset: { asset_key: "asset-one" } };
function setupClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchListings.mockResolvedValue({ entries: [], next: null });
});

it.each<CollectIntent>([
  "full_set",
  "season",
  "artist",
  "pebbles_set",
  "tdh",
  "explore",
  "specific",
])("does not browse or expose cached listings in %s mode", (intent) => {
  const { client, wrapper } = setupClient();
  client.setQueryData(["market-listings", "memes"], {
    pages: [{ entries: [entry], next: "next-page" }],
    pageParams: [null],
  });
  const { result } = renderHook(() => useCollectCatalog("memes", intent), {
    wrapper,
  });
  expect(result.current.entries).toEqual([]);
  expect(result.current.pending).toBe(false);
  expect(result.current.hasMore).toBe(false);
  act(() => {
    result.current.retry();
    result.current.loadMore();
  });
  expect(mockFetchListings).not.toHaveBeenCalled();
  expect(mockFetchAssets).not.toHaveBeenCalled();
});

it("loads only observed listings with their cursor and abort signal", async () => {
  const { wrapper } = setupClient();
  mockFetchListings
    .mockResolvedValueOnce({ entries: [entry], next: "next-page" })
    .mockResolvedValueOnce({ entries: [], next: null });
  const { result } = renderHook(
    () => useCollectCatalog("gradients", "lowest"),
    {
      wrapper,
    }
  );
  await waitFor(() => expect(result.current.entries).toEqual([entry]));
  expect(mockFetchListings).toHaveBeenNthCalledWith(
    1,
    "gradients",
    null,
    expect.any(AbortSignal)
  );
  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.hasMore).toBe(false));
  expect(mockFetchListings).toHaveBeenNthCalledWith(
    2,
    "gradients",
    "next-page",
    expect.any(AbortSignal)
  );
  expect(mockFetchAssets).not.toHaveBeenCalled();
});

it("retries a failed listing request without falling back to an artwork catalogue", async () => {
  const { wrapper } = setupClient();
  mockFetchListings
    .mockRejectedValueOnce(new Error("Listing source unavailable"))
    .mockResolvedValueOnce({ entries: [entry], next: null });
  const { result } = renderHook(() => useCollectCatalog("pebbles", "lowest"), {
    wrapper,
  });
  await waitFor(() => expect(result.current.failed).toBe(true));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.entries).toEqual([entry]));
  expect(result.current.failed).toBe(false);
  expect(mockFetchListings).toHaveBeenCalledTimes(2);
  expect(mockFetchAssets).not.toHaveBeenCalled();
});
