import { renderHook, act } from "@testing-library/react";
import { useWavesOverview } from "@/hooks/useWavesOverview";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
}));

const useInfiniteQueryMock = require("@tanstack/react-query")
  .useInfiniteQuery as jest.Mock;

describe("useWavesOverview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("returns waves and fetchNextPage works", () => {
    const fetchNext = jest.fn(() => Promise.resolve(undefined));
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [[{ id: "1" }]] },
      fetchNextPage: fetchNext,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      status: "success",
      refetch: jest.fn(() => Promise.resolve(undefined)),
    });
    const { result, rerender } = renderHook(() =>
      useWavesOverview({ type: ApiWavesOverviewType.RecentlyDroppedTo })
    );
    expect(
      useInfiniteQueryMock.mock.calls[0]?.[0]?.refetchOnWindowFocus
    ).toBeUndefined();
    expect(result.current.waves).toHaveLength(1);
    act(() => {
      result.current.fetchNextPage();
    });
    expect(fetchNext).toHaveBeenCalled();

    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [[{ id: "1" }, { id: "2" }]] },
      fetchNextPage: fetchNext,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      status: "success",
      refetch: jest.fn(() => Promise.resolve(undefined)),
    });
    rerender();
    expect(result.current.waves).toHaveLength(2);
  });

  it("delays refetch until the remaining cooldown elapses after an error", () => {
    jest.useFakeTimers();

    const refetch = jest.fn(() => Promise.resolve(undefined));
    let queryOptions:
      | {
          retry: (failureCount: number) => boolean;
        }
      | undefined;

    useInfiniteQueryMock.mockImplementation((options: unknown) => {
      queryOptions = options;
      return {
        data: { pages: [[{ id: "1" }]] },
        fetchNextPage: jest.fn(),
        isFetching: false,
        isFetchingNextPage: false,
        hasNextPage: true,
        status: "success",
        refetch,
      };
    });

    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1000);

    const { result } = renderHook(() =>
      useWavesOverview({ type: ApiWavesOverviewType.RecentlyDroppedTo })
    );

    expect(queryOptions).toBeDefined();

    act(() => {
      queryOptions?.retry(3);
    });

    act(() => {
      nowSpy.mockReturnValue(11000);
      result.current.refetch();
    });

    expect(refetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(19999);
    });
    expect(refetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("clears scheduled cooldown actions on unmount", () => {
    jest.useFakeTimers();

    const fetchNextPage = jest.fn(() => Promise.resolve(undefined));
    const refetch = jest.fn(() => Promise.resolve(undefined));
    let queryOptions:
      | {
          retry: (failureCount: number) => boolean;
        }
      | undefined;

    useInfiniteQueryMock.mockImplementation((options: unknown) => {
      queryOptions = options;
      return {
        data: { pages: [[{ id: "1" }]] },
        fetchNextPage,
        isFetching: false,
        isFetchingNextPage: false,
        hasNextPage: true,
        status: "success",
        refetch,
      };
    });

    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1000);

    const { result, unmount } = renderHook(() =>
      useWavesOverview({ type: ApiWavesOverviewType.RecentlyDroppedTo })
    );

    act(() => {
      queryOptions?.retry(3);
    });

    act(() => {
      nowSpy.mockReturnValue(11000);
      result.current.fetchNextPage();
      result.current.refetch();
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();

    act(() => {
      unmount();
      jest.advanceTimersByTime(20000);
    });

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });
});
