import { renderHook, waitFor } from "@testing-library/react";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import {
  useInfiniteQuery,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
  keepPreviousData: {},
}));
jest.mock("react-use", () => ({ useDebounce: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/hooks/useCapacitor", () => () => ({ isCapacitor: false }));
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

  it("prefetches with correct sort", () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        sort: WaveDropsLeaderboardSort.CREATED_AT,
      })
    );
    const call = (queryClientMock.prefetchInfiniteQuery as jest.Mock).mock
      .calls[0][0];
    expect(call.queryKey[1].sort).toBe(WaveDropsLeaderboardSort.CREATED_AT);
  });

  it("includes curation and price params in query key and request params", async () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        curatedByGroupId: "curation-group-1",
        minPrice: 0.5,
        maxPrice: 2.75,
        priceCurrency: "ETH",
        sort: WaveDropsLeaderboardSort.PRICE,
      })
    );

    const call = (queryClientMock.prefetchInfiniteQuery as jest.Mock).mock
      .calls[0][0];
    expect(call.queryKey[1].curated_by_group).toBe("curation-group-1");
    expect(call.queryKey[1].min_price).toBe(0.5);
    expect(call.queryKey[1].max_price).toBe(2.75);
    expect(call.queryKey[1].price_currency).toBe("ETH");

    await call.queryFn({ pageParam: null });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "waves/2/leaderboard",
        params: expect.objectContaining({
          sort: WaveDropsLeaderboardSort.PRICE,
          curated_by_group: "curation-group-1",
          min_price: "0.5",
          max_price: "2.75",
          price_currency: "ETH",
        }),
      })
    );
  });

  it("swaps inverted min and max price bounds before request params", async () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "2",
        minPrice: 2.75,
        maxPrice: 0.5,
        priceCurrency: "ETH",
        sort: WaveDropsLeaderboardSort.PRICE,
      })
    );

    const call = (queryClientMock.prefetchInfiniteQuery as jest.Mock).mock
      .calls[0][0];
    await call.queryFn({ pageParam: null });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "waves/2/leaderboard",
        params: expect.objectContaining({
          sort: WaveDropsLeaderboardSort.PRICE,
          min_price: "0.5",
          max_price: "2.75",
          price_currency: "ETH",
        }),
      })
    );
  });
});
