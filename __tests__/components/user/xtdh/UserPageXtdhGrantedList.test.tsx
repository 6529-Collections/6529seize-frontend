import { render } from "@testing-library/react";
import { SortDirection } from "@/entities/ISort";
import UserPageXtdhGrantedList from "@/components/user/xtdh/UserPageXtdhGrantedList";

const mockUseSearchParams = jest.fn();
const mockRouterPush = jest.fn();
const mockUseXtdhGrantsQuery = jest.fn();

jest.mock("@/hooks/useXtdhGrantsQuery", () => ({
  useXtdhGrantsQuery: (...args: unknown[]) => mockUseXtdhGrantsQuery(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/profiles/test", // stable path for tests
  useSearchParams: () => mockUseSearchParams(),
}));

describe("UserPageXtdhGrantedList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseXtdhGrantsQuery.mockReturnValue({
      grants: [],
      totalCount: 0,
      isLoading: false,
      isError: false,
      isFetching: false,
      errorMessage: undefined,
      refetch: jest.fn(),
      firstPage: undefined,
      data: undefined,
      error: undefined,
      failureCount: 0,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isInitialLoading: false,
      isPaused: false,
      isPending: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isSuccess: true,
      isStale: false,
      status: "success",
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      fetchStatus: "idle",
      remove: jest.fn(),
    });
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("passes the default uppercase sort direction to the query hook", () => {
    render(<UserPageXtdhGrantedList grantor="0xabc" />);

    expect(mockUseXtdhGrantsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sortDirection: SortDirection.DESC,
      })
    );
  });

  it("normalizes lowercase query params before delegating to the hook", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("dir=asc"));

    render(<UserPageXtdhGrantedList grantor="0xabc" />);

    expect(mockUseXtdhGrantsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sortDirection: SortDirection.ASC,
      })
    );
  });
});
