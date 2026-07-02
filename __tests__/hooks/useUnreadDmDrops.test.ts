import { renderHook } from "@testing-library/react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useUnreadDmDrops } from "@/hooks/useUnreadDmDrops";

const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/services/auth/auth-token-fingerprint", () => ({
  getAuthTokenFingerprint: jest.fn(() => "jwt-fingerprint"),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "jwt"),
  isAuthJwtUsable: jest.fn(() => true),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));

const { commonApiFetch } = jest.requireMock("@/services/api/common-api") as {
  commonApiFetch: jest.Mock;
};
const { isAuthJwtUsable } = jest.requireMock("@/services/auth/auth.utils") as {
  isAuthJwtUsable: jest.Mock;
};

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

describe("useUnreadDmDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthJwtUsable.mockReturnValue(true);
    mockUseQuery.mockReturnValue(defaultQueryResult);
  });

  it("configures the query to fetch unread DM drop count", async () => {
    let capturedConfig: any;
    mockUseQuery.mockImplementation((config) => {
      capturedConfig = config;
      return {
        ...defaultQueryResult,
        data: { count: 3 },
      };
    });

    const { result } = renderHook(() => useUnreadDmDrops("alice"));

    expect(result.current).toEqual({
      unreadDmDrops: { count: 3 },
      unreadDmDropsCount: 3,
      haveUnreadDmDrops: true,
    });
    expect(capturedConfig.queryKey).toEqual([
      QueryKey.DM_DROPS_UNREAD,
      { identity: "alice", auth: "jwt-fingerprint" },
    ]);
    expect(capturedConfig.enabled).toBe(true);

    commonApiFetch.mockResolvedValueOnce({ count: 3 });
    await expect(capturedConfig.queryFn()).resolves.toEqual({ count: 3 });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "dm-drops/unread",
      errorMode: "structured",
    });
  });

  it("does not enable polling without a usable auth token", () => {
    let capturedConfig: any;
    isAuthJwtUsable.mockReturnValue(false);
    mockUseQuery.mockImplementation((config) => {
      capturedConfig = config;
      return defaultQueryResult;
    });

    const { result } = renderHook(() => useUnreadDmDrops("alice"));

    expect(capturedConfig.enabled).toBe(false);
    expect(result.current).toEqual({
      unreadDmDrops: undefined,
      unreadDmDropsCount: 0,
      haveUnreadDmDrops: false,
    });
  });

  it("clamps invalid API counts to zero", () => {
    mockUseQuery.mockReturnValue({
      ...defaultQueryResult,
      data: { count: -1 },
    });

    const { result } = renderHook(() => useUnreadDmDrops("alice"));

    expect(result.current.unreadDmDropsCount).toBe(0);
    expect(result.current.haveUnreadDmDrops).toBe(false);
  });
});
