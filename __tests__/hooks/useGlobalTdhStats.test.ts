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
      tdh: 10,
      tdh_rate: 2,
      xtdh: 20,
      xtdh_rate: 4,
      xtdh_multiplier: 3,
      granted_xtdh_rate: 1,
      granted_xtdh: 5,
      granted_target_collections_count: 6,
      granted_target_tokens_count: 7,
    });

    const result = await capturedConfig.queryFn();

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "tdh-stats" })
    );
    expect(result).toEqual({
      tdh: 10,
      tdhRate: 2,
      xtdh: 20,
      xtdhRate: 4,
      xtdhMultiplier: 3,
      grantedXtdhRate: 1,
      grantedXtdh: 5,
      grantedCollectionsCount: 6,
      grantedTokensCount: 7,
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
      tdh: -5,
      tdh_rate: undefined,
      xtdh: "100",
      xtdh_rate: 8.5,
      xtdh_multiplier: null,
      granted_xtdh_rate: -3,
      granted_xtdh: 4.2,
      granted_target_collections_count: 7.8,
      granted_target_tokens_count: "n/a",
    });

    const result = await capturedConfig.queryFn();

    expect(result).toEqual({
      tdh: 0,
      tdhRate: null,
      xtdh: 0,
      xtdhRate: 8.5,
      xtdhMultiplier: null,
      grantedXtdhRate: 0,
      grantedXtdh: 4.2,
      grantedCollectionsCount: 7,
      grantedTokensCount: 0,
    });
  });
});
