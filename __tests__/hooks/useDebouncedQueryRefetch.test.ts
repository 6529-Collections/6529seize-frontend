import { act, renderHook } from "@testing-library/react";
import { useDebouncedQueryRefetch } from "@/hooks/useDebouncedQueryRefetch";

describe("useDebouncedQueryRefetch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("refetches immediately when idle", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDebouncedQueryRefetch({
        refetch,
        isFetching: false,
        isFetchingNextPage: false,
      })
    );

    act(() => {
      result.current();
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("debounces repeated refetch requests inside the wait window", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDebouncedQueryRefetch({
        refetch,
        isFetching: false,
        isFetchingNextPage: false,
      })
    );

    act(() => {
      result.current();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(200);
      result.current();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(799);
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it("waits for in-flight fetching to finish before refetching again", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({
        isFetching,
        isFetchingNextPage,
      }: {
        readonly isFetching: boolean;
        readonly isFetchingNextPage: boolean;
      }) =>
        useDebouncedQueryRefetch({
          refetch,
          isFetching,
          isFetchingNextPage,
        }),
      {
        initialProps: {
          isFetching: false,
          isFetchingNextPage: false,
        },
      }
    );

    act(() => {
      result.current();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(200);
      rerender({
        isFetching: true,
        isFetchingNextPage: false,
      });
      result.current();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      rerender({
        isFetching: false,
        isFetchingNextPage: false,
      });
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(799);
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it("clears scheduled refetches on unmount", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() =>
      useDebouncedQueryRefetch({
        refetch,
        isFetching: false,
        isFetchingNextPage: false,
      })
    );

    act(() => {
      result.current();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(200);
      result.current();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
