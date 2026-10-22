import { renderHook, act } from "@testing-library/react";
import { useWaveFollowers } from "@/hooks/useWaveFollowers";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { getWaveFollowersCountQueryKey } from "@/hooks/useWaveFollowersCount";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const setQueryData = jest.fn();

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (useQueryClient as jest.Mock).mockReturnValue({ setQueryData });
});

test("fetches next page on intersection when enough followers loaded", () => {
  const fetchNextPage = jest.fn();
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [{ data: Array(100).fill({}), next: true, page: 1 }] },
    fetchNextPage,
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    status: "success",
  });
  const { result } = renderHook(() => useWaveFollowers("w1"));
  act(() => result.current.onBottomIntersection(true));
  expect(fetchNextPage).toHaveBeenCalled();
});

test("does not fetch when less than request size", () => {
  const fetchNextPage = jest.fn();
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [{ data: [{}], next: false, page: 1 }] },
    fetchNextPage,
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    status: "success",
  });
  const { result } = renderHook(() => useWaveFollowers("w1"));
  act(() => result.current.onBottomIntersection(true));
  expect(fetchNextPage).not.toHaveBeenCalled();
});

test.each([null, 2])(
  "refreshes the header count from follower page %s",
  async (pageParam) => {
    useInfiniteQueryMock.mockReturnValue({
      data: undefined,
      status: "pending",
    });
    jest
      .mocked(commonApiFetch)
      .mockResolvedValue({ data: [], count: 3, page: 1, next: false });
    renderHook(() => useWaveFollowers("w1"));
    const options = useInfiniteQueryMock.mock.calls.at(-1)![0];
    await options.queryFn({ pageParam, signal: new AbortController().signal });
    expect(setQueryData).toHaveBeenCalledWith(
      getWaveFollowersCountQueryKey("w1"),
      3
    );
  }
);
