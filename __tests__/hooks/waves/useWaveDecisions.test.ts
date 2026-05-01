import { renderHook, waitFor } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
  useWaveDecisions,
} from "@/hooks/waves/useWaveDecisions";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
}));
jest.mock("@/services/api/common-api");

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const fetchMock = commonApiFetch as jest.Mock;
const makeWinner = (place: number, id = `drop-${place}`) => ({
  place,
  drop: { id },
});

describe("useWaveDecisions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [], pageParams: [] },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
    });
  });

  it("configures a paginated query and sorts loaded decisions", () => {
    const unsortedDecision = {
      decision_time: 2,
      winners: [makeWinner(2), makeWinner(1)],
    };

    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [
          {
            page: 1,
            next: false,
            data: [
              { decision_time: 3, winners: [makeWinner(3), makeWinner(1)] },
              unsortedDecision,
              { decision_time: 1, winners: [makeWinner(1)] },
            ],
          },
        ],
        pageParams: [1],
      },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
    });

    const { result } = renderHook(() => useWaveDecisions({ waveId: "w1" }));

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QueryKey.WAVE_DECISIONS, { waveId: "w1", pageSize: 100 }],
        enabled: true,
        initialPageParam: 1,
      })
    );
    expect(
      result.current.decisionPoints.map((point) => point.decision_time)
    ).toEqual([1, 2, 3]);
    expect(
      result.current.decisionPoints[1]?.winners.map((winner) => winner.place)
    ).toEqual([1, 2]);
    expect(result.current.hasLoadedAllPages).toBe(true);
  });

  it("merges multiple pages and dedupes duplicate decision times", () => {
    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [
          {
            page: 1,
            next: true,
            data: [
              { decision_time: 3, winners: [makeWinner(3)] },
              { decision_time: 2, winners: [makeWinner(2), makeWinner(1)] },
            ],
          },
          {
            page: 2,
            next: false,
            data: [
              { decision_time: 2, winners: [makeWinner(99)] },
              { decision_time: 1, winners: [makeWinner(1)] },
            ],
          },
        ],
        pageParams: [1, 2],
      },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
    });

    const { result } = renderHook(() => useWaveDecisions({ waveId: "w1" }));

    expect(
      result.current.decisionPoints.map((point) => point.decision_time)
    ).toEqual([1, 2, 3]);
    expect(
      result.current.decisionPoints[1]?.winners.map((winner) => winner.place)
    ).toEqual([1, 2]);
  });

  it("warns when winners are missing drop data and keeps sorted winners", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [
          {
            page: 1,
            next: false,
            data: [
              {
                decision_time: 2,
                winners: [makeWinner(2), { place: 1 }],
              },
            ],
          },
        ],
        pageParams: [1],
      },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
    });

    const { result } = renderHook(() => useWaveDecisions({ waveId: "w1" }));

    expect(
      result.current.decisionPoints[0]?.winners.map((winner) => winner.place)
    ).toEqual([1, 2]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Found 1 winner(s) without drop data")
    );

    warnSpy.mockRestore();
  });

  it("returns the query loading state", () => {
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [], pageParams: [] },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: true,
      isLoading: true,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
    });

    const { result } = renderHook(() => useWaveDecisions({ waveId: "w1" }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isLoadingAllPages).toBe(true);
  });

  it("requests the requested page and page size", async () => {
    fetchMock.mockResolvedValue({
      page: 3,
      next: true,
      count: 250,
      data: [],
    });

    renderHook(() => useWaveDecisions({ waveId: "w1", pageSize: 250 }));

    const options = useInfiniteQueryMock.mock.calls[0][0];
    await options.queryFn({ pageParam: 3 });

    expect(fetchMock).toHaveBeenCalledWith({
      endpoint: "waves/w1/decisions",
      params: {
        sort_direction: "DESC",
        sort: "decision_time",
        page: "3",
        page_size: "250",
      },
    });
    expect(options.getNextPageParam({ page: 3, next: true })).toBe(4);
    expect(options.getNextPageParam({ page: 3, next: false })).toBeUndefined();
  });

  it("auto-fetches next pages when loadAllPages is true", async () => {
    const fetchNextPage = jest.fn();
    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [{ page: 1, next: true, data: [] }],
        pageParams: [1],
      },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      isLoading: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchNextPageError: false,
      isFetchingNextPage: false,
    });

    const { result } = renderHook(() =>
      useWaveDecisions({
        waveId: "w1",
        loadAllPages: true,
        pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
      })
    );

    await waitFor(() => {
      expect(fetchNextPage).toHaveBeenCalled();
    });
    expect(result.current.isLoadingAllPages).toBe(true);
    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.WAVE_DECISIONS,
          { waveId: "w1", pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE },
        ],
      })
    );
  });

  it("stops loading all pages after a next-page error without retrying", () => {
    const fetchNextPage = jest.fn();
    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [{ page: 1, next: true, data: [] }],
        pageParams: [1],
      },
      isError: true,
      error: new Error("next page failed"),
      refetch: jest.fn(),
      isFetching: false,
      isLoading: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchNextPageError: true,
      isFetchingNextPage: false,
    });

    const { result } = renderHook(() =>
      useWaveDecisions({
        waveId: "w1",
        loadAllPages: true,
        pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
      })
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(result.current.isLoadingAllPages).toBe(false);
    expect(result.current.hasLoadedAllPages).toBe(false);
    expect(result.current.fetchNextPage).toBe(fetchNextPage);
  });
});
