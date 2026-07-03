import { renderHook, waitFor } from "@testing-library/react";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
  keepPreviousData: {},
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/waves/wave-drops.helpers", () => ({
  generateUniqueKeys: jest.fn((a: any) => a),
  mapToExtendedDrops: jest.fn((pages: any) =>
    pages.flatMap((p: any) => p.drops)
  ),
}));

const fetchNextPage = jest.fn();
const queryClientMock = {
  prefetchInfiniteQuery: jest.fn(),
  removeQueries: jest.fn(),
};
(useQueryClient as jest.Mock).mockReturnValue(queryClientMock);
(useQuery as jest.Mock).mockReturnValue({});

beforeEach(() => {
  jest.clearAllMocks();
  (commonApiFetch as jest.Mock).mockResolvedValue({
    wave: {},
    drops: [],
    page: 1,
    next: false,
  });
  (useInfiniteQuery as jest.Mock).mockReturnValue({
    data: { pages: [] },
    fetchNextPage,
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
  });
});

const getMainQueryOptions = () => {
  const firstCall = (useInfiniteQuery as jest.Mock).mock.calls[0];
  expect(firstCall).toBeDefined();
  return firstCall![0];
};

describe("useWaveDropsLeaderboard extra", () => {
  it("maps pages to drops", async () => {
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [{ wave: {}, drops: [{ id: "a" }, { id: "b" }] }] },
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() =>
      useWaveDropsLeaderboard({ waveId: "1" })
    );
    await waitFor(() => result.current.drops.length === 2);
    expect(result.current.drops).toEqual([{ id: "a" }, { id: "b" }]);
    expect(result.current.isFetching).toBe(false);
  });

  it("uses the correct sort in the main query key", () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        sort: WaveDropsLeaderboardSort.CREATED_AT,
      })
    );
    const call = getMainQueryOptions();
    expect(call.queryKey[1].sort).toBe(WaveDropsLeaderboardSort.CREATED_AT);
  });

  it("requests my realtime votes in descending order", async () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        sort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
      })
    );

    const call = getMainQueryOptions();
    expect(call.queryKey[1].sort_direction).toBe("DESC");

    await call.queryFn({ pageParam: null });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/2/leaderboard",
        params: expect.objectContaining({
          sort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
          sort_direction: "DESC",
        }),
      })
    );
  });

  it("does not prefetch or start a polling query on mount", () => {
    renderHook(() => useWaveDropsLeaderboard({ waveId: "2" }));

    expect(queryClientMock.prefetchInfiniteQuery).not.toHaveBeenCalled();
    expect(useQuery).not.toHaveBeenCalled();
  });

  it("includes price params in query key and request params", async () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        minPrice: 0.5,
        maxPrice: 2.75,
        priceCurrency: " ETH ",
        sort: WaveDropsLeaderboardSort.PRICE,
      })
    );

    const call = getMainQueryOptions();
    expect(call.queryKey[1]).not.toHaveProperty("curation_id");
    expect(call.queryKey[1].min_price).toBe("0.5");
    expect(call.queryKey[1].max_price).toBe("2.75");
    expect(call.queryKey[1].price_currency).toBe("ETH");

    await call.queryFn({ pageParam: null });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/2/leaderboard",
        params: expect.objectContaining({
          sort: WaveDropsLeaderboardSort.PRICE,
          min_price: "0.5",
          max_price: "2.75",
          price_currency: "ETH",
        }),
      })
    );
    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.not.objectContaining({
          curation_id: expect.any(String),
        }),
      })
    );
  });

  it("swaps inverted min and max price bounds for query key and request params", async () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        minPrice: 2.75,
        maxPrice: 0.5,
        priceCurrency: "ETH",
        sort: WaveDropsLeaderboardSort.PRICE,
      })
    );

    const call = getMainQueryOptions();
    expect(call.queryKey[1].min_price).toBe("0.5");
    expect(call.queryKey[1].max_price).toBe("2.75");

    await call.queryFn({ pageParam: null });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/2/leaderboard",
        params: expect.objectContaining({
          sort: WaveDropsLeaderboardSort.PRICE,
          min_price: "0.5",
          max_price: "2.75",
          price_currency: "ETH",
        }),
      })
    );
  });

  it("normalizes whitespace-only currency to null in key and omits request param", async () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        minPrice: 0.5,
        maxPrice: 2.75,
        priceCurrency: "   ",
        sort: WaveDropsLeaderboardSort.PRICE,
      })
    );

    const call = getMainQueryOptions();
    expect(call.queryKey[1].price_currency).toBeNull();

    await call.queryFn({ pageParam: null });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/2/leaderboard",
        params: expect.not.objectContaining({
          price_currency: expect.any(String),
        }),
      })
    );
  });
});
