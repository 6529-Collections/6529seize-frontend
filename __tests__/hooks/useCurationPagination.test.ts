import { act, renderHook } from "@testing-library/react";
import { useCurationPagination } from "@/hooks/useCurationPagination";

it("resumes a visible page request after a save refresh without another intersection", () => {
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
  act(() => result.current(true));
  expect(fetchNextPage).not.toHaveBeenCalled();
  rerender({ isFetching: false, hasNextPage: true, isError: false });
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
  rerender({ isFetching: true, hasNextPage: true, isError: false });
  act(() => result.current(false));
  rerender({ isFetching: false, hasNextPage: true, isError: false });
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
  rerender({ isFetching: false, hasNextPage: false, isError: false });
  act(() => result.current(true));
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
  rerender({ isFetching: false, hasNextPage: true, isError: true });
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
});
