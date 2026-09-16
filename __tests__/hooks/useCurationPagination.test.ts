import { act, renderHook } from "@testing-library/react";
import { useCurationPagination } from "@/hooks/useCurationPagination";

it("refreshes the sentinel after a save releases the fetch lock", () => {
  const fetchNextPage = jest.fn().mockResolvedValue(undefined);
  const { result, rerender } = renderHook(
    ({ isFetching, hasNextPage, isError }) =>
      useCurationPagination({
        fetchNextPage,
        isFetching,
        hasNextPage,
        isError,
      }),
    { initialProps: { isFetching: true, hasNextPage: true, isError: false } }
  );
  const lockedKey = result.current.sentinelKey;
  act(() => result.current.onIntersection(true));
  expect(fetchNextPage).not.toHaveBeenCalled();
  rerender({ isFetching: false, hasNextPage: true, isError: false });
  expect(result.current.sentinelKey).not.toBe(lockedKey);
  act(() => result.current.onIntersection(true));
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
  rerender({ isFetching: true, hasNextPage: true, isError: false });
  act(() => result.current.onIntersection(false));
  rerender({ isFetching: false, hasNextPage: true, isError: false });
  act(() => result.current.onIntersection(false));
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
  rerender({ isFetching: false, hasNextPage: false, isError: false });
  act(() => result.current.onIntersection(true));
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
  rerender({ isFetching: false, hasNextPage: true, isError: true });
  act(() => result.current.onIntersection(true));
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
});
