import { renderHook } from "@testing-library/react";
import { SortDirection } from "@/entities/ISort";
import { useXtdhGrantsQuery } from "@/hooks/useXtdhGrantsQuery";

const mockUseInfiniteQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: Symbol("keepPreviousData"),
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetch =
  require("@/services/api/common-api").commonApiFetch as jest.Mock;

const defaultQueryResult = {
  data: undefined,
  error: undefined,
  failureCount: 0,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetching: false,
  isFetchingNextPage: false,
  isInitialLoading: false,
  isLoading: false,
  isError: false,
  isPaused: false,
  isPending: false,
  isPlaceholderData: false,
  isRefetchError: false,
  isRefetching: false,
  isSuccess: true,
  isStale: false,
  status: "success" as const,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  fetchStatus: "idle" as const,
  refetch: jest.fn(),
  remove: jest.fn(),
};

describe("useXtdhGrantsQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInfiniteQuery.mockReturnValue(defaultQueryResult);
  });

  it("builds the query with the provided filters", async () => {
    let capturedConfig: any;
    mockUseInfiniteQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    renderHook(() =>
      useXtdhGrantsQuery({
        grantor: "0xabc",
        page: 2,
        pageSize: 10,
        status: "GRANTED",
        sortField: "created_at",
        sortDirection: SortDirection.ASC,
      })
    );

    expect(capturedConfig).toBeTruthy();
    await capturedConfig.queryFn({ pageParam: 2 });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          grantor: "0xabc",
          page: "2",
          page_size: "10",
          status: "GRANTED",
          sort: "created_at",
          sort_direction: SortDirection.ASC,
        }),
      })
    );
  });

  it("disables the query when no grantor is provided", () => {
    let capturedConfig: any;
    mockUseInfiniteQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    renderHook(() =>
      useXtdhGrantsQuery({
        grantor: "",
        sortField: "tdh_rate",
        sortDirection: SortDirection.DESC,
      })
    );

    expect(capturedConfig.enabled).toBe(false);
  });

  it("normalizes invalid page numbers to 1", () => {
    let capturedConfig: any;
    mockUseInfiniteQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    renderHook(() =>
      useXtdhGrantsQuery({
        grantor: "0xabc",
        page: 0,
        sortField: "tdh_rate",
        sortDirection: SortDirection.DESC,
      })
    );

    expect(capturedConfig.initialPageParam).toBe(1);
  });
});
