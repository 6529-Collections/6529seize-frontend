import { renderHook, act } from "@testing-library/react";
import {
  useWaveDropsLeaderboard,
  WAVE_DROPS_LEADERBOARD_MAX_PAGES,
} from "@/hooks/useWaveDropsLeaderboard";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  useQueryClient: jest.fn(),
  keepPreviousData: {},
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/waves/wave-drops.helpers", () => ({
  generateUniqueKeys: jest.fn((a) => a),
  mapToExtendedDrops: jest.fn((pages) => pages.flatMap((p: any) => p.drops)),
}));

const queryClientMock = {
  removeQueries: jest.fn(),
};
(useQueryClient as jest.Mock).mockReturnValue(queryClientMock);

const mockInfiniteQueryReturn = ({
  data = { pages: [] },
  fetchNextPage = jest.fn(),
  hasNextPage = true,
  isError = false,
}: {
  readonly data?: unknown;
  readonly fetchNextPage?: jest.Mock;
  readonly hasNextPage?: boolean;
  readonly isError?: boolean;
} = {}) => {
  (useInfiniteQuery as jest.Mock).mockReturnValue({
    data,
    fetchNextPage,
    fetchPreviousPage: jest.fn(),
    hasNextPage,
    hasPreviousPage: false,
    isError,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    refetch: jest.fn(),
  });
};

const getLatestInfiniteQueryOptions = () => {
  const calls = (useInfiniteQuery as jest.Mock).mock.calls;
  const latestCall = calls[calls.length - 1];
  expect(latestCall).toBeDefined();
  return latestCall![0];
};

describe("useWaveDropsLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInfiniteQueryReturn();
  });

  it("calls fetchNextPage via manualFetch when more pages", async () => {
    const fetchNext = jest.fn();
    mockInfiniteQueryReturn({ fetchNextPage: fetchNext });
    const { result } = renderHook(() =>
      useWaveDropsLeaderboard({ waveId: "1" })
    );
    await act(async () => {
      await result.current.manualFetch();
    });
    expect(fetchNext).toHaveBeenCalled();
  });

  it("removes queries on unmount", () => {
    const { unmount } = renderHook(() =>
      useWaveDropsLeaderboard({ waveId: "2" })
    );
    unmount();
    expect(queryClientMock.removeQueries).toHaveBeenCalledWith({
      queryKey: ["DROPS_LEADERBOARD", { waveId: "2" }],
    });
  });

  it("does not fetch next page when none left", async () => {
    const fetchNext = jest.fn();
    mockInfiniteQueryReturn({ fetchNextPage: fetchNext, hasNextPage: false });
    const { result } = renderHook(() =>
      useWaveDropsLeaderboard({ waveId: "3" })
    );
    await act(async () => {
      await result.current.manualFetch();
    });
    expect(fetchNext).not.toHaveBeenCalled();
  });

  it("returns the leaderboard query error state", () => {
    mockInfiniteQueryReturn({ hasNextPage: false, isError: true });

    const { result } = renderHook(() =>
      useWaveDropsLeaderboard({ waveId: "4" })
    );

    expect(result.current.isError).toBe(true);
  });

  it("enables the main query only when enabled and waveId are truthy", () => {
    const { rerender } = renderHook(
      ({ enabled, waveId }: { enabled: boolean; waveId: string }) =>
        useWaveDropsLeaderboard({ waveId, enabled }),
      {
        initialProps: { enabled: true, waveId: "1" },
      }
    );

    expect(getLatestInfiniteQueryOptions().enabled).toBe(true);

    rerender({ enabled: false, waveId: "1" });
    expect(getLatestInfiniteQueryOptions().enabled).toBe(false);

    rerender({ enabled: true, waveId: "" });
    expect(getLatestInfiniteQueryOptions().enabled).toBe(false);
  });

  it("does not report fetching while disabled before data initializes", () => {
    mockInfiniteQueryReturn({ data: null });

    const { result } = renderHook(() =>
      useWaveDropsLeaderboard({ waveId: "1", enabled: false })
    );

    expect(getLatestInfiniteQueryOptions().enabled).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it("keeps a bounded bidirectional page window", () => {
    renderHook(() =>
      useWaveDropsLeaderboard({
        waveId: "1",
        maxPages: WAVE_DROPS_LEADERBOARD_MAX_PAGES,
      })
    );

    const options = getLatestInfiniteQueryOptions();
    expect(options.maxPages).toBe(WAVE_DROPS_LEADERBOARD_MAX_PAGES);
    expect(options.queryKey[1].page_window).toBe(
      WAVE_DROPS_LEADERBOARD_MAX_PAGES
    );
    expect(options.getPreviousPageParam({ page: 3 })).toBe(2);
    expect(options.getPreviousPageParam({ page: 1 })).toBeNull();
  });

  it("leaves non-leaderboard consumers unbounded", () => {
    renderHook(() => useWaveDropsLeaderboard({ waveId: "1" }));

    const options = getLatestInfiniteQueryOptions();
    expect(options).not.toHaveProperty("maxPages");
    expect(options.queryKey[1].page_window).toBeNull();
  });
});
