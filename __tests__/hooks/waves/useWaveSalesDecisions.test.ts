import { renderHook } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useWaveSalesDecisions } from "@/hooks/waves/useWaveSalesDecisions";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
}));
jest.mock("@/services/api/common-api");

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const fetchMock = commonApiFetch as jest.Mock;

describe("useWaveSalesDecisions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [], pageParams: [] },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  it("uses a sales-specific query key and merges paginated decision pages", () => {
    const fetchNextPage = jest.fn();
    const pageOneDecision = {
      decision_time: 2,
      winners: [{ place: 2 }, { place: 1 }],
    };

    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [
          {
            page: 1,
            next: true,
            data: [
              { decision_time: 3, winners: [{ place: 3 }, { place: 1 }] },
              pageOneDecision,
            ],
          },
          {
            page: 2,
            next: false,
            data: [
              { decision_time: 2, winners: [{ place: 99 }] },
              { decision_time: 1, winners: [{ place: 1 }] },
            ],
          },
        ],
        pageParams: [1, 2],
      },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    const { result } = renderHook(() =>
      useWaveSalesDecisions({ waveId: "w1" })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QueryKey.WAVE_DECISIONS_SALES, { waveId: "w1" }],
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
    expect(result.current.fetchNextPage).toBe(fetchNextPage);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("requests the current page and advances based on the API next flag", async () => {
    fetchMock.mockResolvedValue({
      page: 3,
      next: true,
      count: 250,
      data: [],
    });

    renderHook(() => useWaveSalesDecisions({ waveId: "w1" }));

    const options = useInfiniteQueryMock.mock.calls[0][0];
    await options.queryFn({ pageParam: 3 });

    expect(fetchMock).toHaveBeenCalledWith({
      endpoint: "waves/w1/decisions",
      params: {
        sort_direction: "DESC",
        sort: "decision_time",
        page: "3",
        page_size: "100",
      },
    });
    expect(options.getNextPageParam({ page: 3, next: true })).toBe(4);
    expect(options.getNextPageParam({ page: 3, next: false })).toBeUndefined();
  });
});
