import { renderHook } from "@testing-library/react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useGlobalTdhStats } from "@/hooks/useGlobalTdhStats";

const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
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
  isError: false,
  isFetched: true,
  isFetchedAfterMount: true,
  isFetching: false,
  isInitialLoading: false,
  isLoading: false,
  isPending: false,
  isPlaceholderData: false,
  isPaused: false,
  isRefetchError: false,
  isRefetching: false,
  isStale: false,
  isSuccess: true,
  status: "success" as const,
  fetchStatus: "idle" as const,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  refetch: jest.fn(),
  remove: jest.fn(),
};

describe("useGlobalTdhStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue(defaultQueryResult);
  });

  it("configures the query to hit the global tdh endpoint", async () => {
    let capturedConfig: any;
    mockUseQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    renderHook(() => useGlobalTdhStats());

    expect(capturedConfig.queryKey).toEqual([QueryKey.GLOBAL_TDH_STATS]);

    commonApiFetch.mockResolvedValueOnce({
      xtdh: 20,
      xtdh_rate: 4,
      multiplier: 3,
      outgoing_rate: 1,
      outgoing_total: 5,
      outgoing_collections_count: 6,
      outgoing_tokens_count: 7,
    });

    const result = await capturedConfig.queryFn();

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "xtdh/stats" })
    );
    expect(result).toEqual({
      xtdh: 20,
      xtdhRate: 4,
      multiplier: 3,
      outgoingRate: 1,
      outgoingTotal: 5,
      outgoingCollectionsCount: 6,
      outgoingTokensCount: 7,
    });
  });

  it("sanitizes unexpected values from the API", async () => {
    let capturedConfig: any;
    mockUseQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    renderHook(() => useGlobalTdhStats());

    commonApiFetch.mockResolvedValueOnce({
      xtdh: "100",
      xtdh_rate: 8.5,
      multiplier: null,
      outgoing_rate: -3,
      outgoing_total: 4.2,
      outgoing_collections_count: 7.8,
      outgoing_tokens_count: "n/a",
    });

    const result = await capturedConfig.queryFn();

    expect(result).toEqual({
      xtdh: 0,
      xtdhRate: 8.5,
      multiplier: null,
      outgoingRate: 0,
      outgoingTotal: 4.2,
      outgoingCollectionsCount: 7,
      outgoingTokensCount: 0,
    });
  });
});
