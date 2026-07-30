import { renderHook } from "@testing-library/react";
import useDmWavesList from "@/hooks/useDmWavesList";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS } from "@/components/react-query-wrapper/utils/query-utils";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/hooks/useWavesV2", () => ({
  useWavesV2: jest.fn(),
}));

jest.mock("@/hooks/useUnreadDmDrops", () => ({
  useUnreadDmDrops: jest.fn(),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "valid-jwt"),
  isAuthJwtUsable: jest.fn(() => true),
}));

const useAuthMock = require("@/components/auth/Auth").useAuth as jest.Mock;
const useSeizeConnectContextMock =
  require("@/components/auth/SeizeConnectContext")
    .useSeizeConnectContext as jest.Mock;
const useWavesV2Mock = require("@/hooks/useWavesV2").useWavesV2 as jest.Mock;
const useUnreadDmDropsMock = require("@/hooks/useUnreadDmDrops")
  .useUnreadDmDrops as jest.Mock;
const useQueryClientMock = require("@tanstack/react-query")
  .useQueryClient as jest.Mock;
const getAuthJwtMock = require("@/services/auth/auth.utils")
  .getAuthJwt as jest.Mock;
const isAuthJwtUsableMock = require("@/services/auth/auth.utils")
  .isAuthJwtUsable as jest.Mock;

describe("useDmWavesList", () => {
  const dmWavesQueryKey = ["waves-v2", { direct_message: true }] as const;
  const refetchQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useQueryClientMock.mockReturnValue({ refetchQueries });
    getAuthJwtMock.mockReturnValue("valid-jwt");
    isAuthJwtUsableMock.mockReturnValue(true);
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { id: "profile-1", handle: "me" },
      fetchingProfile: false,
      isAuthenticated: true,
    });
    useSeizeConnectContextMock.mockReturnValue({
      address: "0xABC",
      hasValidWalletAuth: true,
    });
    useUnreadDmDropsMock.mockReturnValue({
      unreadDmDropsCount: 0,
    });
    useWavesV2Mock.mockReturnValue({
      waves: [
        { id: "older", latestDropTimestamp: 100 },
        { id: "newer", latestDropTimestamp: 200 },
      ],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      refetch: jest.fn(),
      queryKey: dmWavesQueryKey,
      dataUpdatedAt: 100,
    });
  });

  it("sorts DMs by latest drop and uses foreground polling", () => {
    const { result } = renderHook(() => useDmWavesList());

    expect(result.current.waves.map((wave: any) => wave.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(useWavesV2Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
        pageSize: 20,
        directMessage: true,
        viewerIdentityKey: "0xabc:profile:profile-1:primary",
        enabled: true,
        refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
      })
    );
  });

  it("bounds retries and re-arms on a later successful DM snapshot", () => {
    let isFetching = false;
    let unreadDmDropsCount = 1;
    let dataUpdatedAt = 100;
    useUnreadDmDropsMock.mockReturnValue({
      get unreadDmDropsCount() {
        return unreadDmDropsCount;
      },
    });
    useWavesV2Mock.mockImplementation(() => ({
      waves: [
        {
          id: "wave-1",
          latestDropTimestamp: 200,
          unreadDropsCount: 0,
        },
      ],
      isFetching,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      refetch: jest.fn(),
      queryKey: dmWavesQueryKey,
      get dataUpdatedAt() {
        return dataUpdatedAt;
      },
    }));

    const { rerender } = renderHook(() => useDmWavesList());

    expect(refetchQueries).toHaveBeenCalledTimes(1);
    expect(refetchQueries).toHaveBeenCalledWith({
      queryKey: dmWavesQueryKey,
      exact: true,
      type: "active",
    });

    isFetching = true;
    rerender();
    unreadDmDropsCount = 2;
    isFetching = false;
    rerender();

    expect(refetchQueries).toHaveBeenCalledTimes(1);

    dataUpdatedAt = 200;
    rerender();
    expect(refetchQueries).toHaveBeenCalledTimes(2);

    dataUpdatedAt = 300;
    rerender();
    expect(refetchQueries).toHaveBeenCalledTimes(2);

    dataUpdatedAt =
      100 + SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS * 5;
    rerender();
    expect(refetchQueries).toHaveBeenCalledTimes(3);

    dataUpdatedAt += 100;
    rerender();
    expect(refetchQueries).toHaveBeenCalledTimes(4);

    dataUpdatedAt += 100;
    rerender();
    expect(refetchQueries).toHaveBeenCalledTimes(4);

    unreadDmDropsCount = 0;
    rerender();
    unreadDmDropsCount = 1;
    rerender();

    expect(refetchQueries).toHaveBeenCalledTimes(5);
  });

  it("does not refetch when the DM rows account for the unread summary", () => {
    const refetch = jest.fn();
    useUnreadDmDropsMock.mockReturnValue({
      unreadDmDropsCount: 1,
    });
    useWavesV2Mock.mockReturnValue({
      waves: [
        {
          id: "wave-1",
          latestDropTimestamp: 200,
          unreadDropsCount: 1,
        },
      ],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      refetch,
      queryKey: dmWavesQueryKey,
      dataUpdatedAt: 100,
    });

    renderHook(() => useDmWavesList());

    expect(refetchQueries).not.toHaveBeenCalled();
  });

  it("disables the DM query while the auth JWT is unusable", () => {
    isAuthJwtUsableMock.mockReturnValue(false);

    const { result } = renderHook(() => useDmWavesList());

    expect(useWavesV2Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        directMessage: true,
        viewerIdentityKey: null,
        enabled: false,
      })
    );
    expect(result.current.waves).toEqual([]);
  });

  it("disables the DM query while wallet auth is invalid", () => {
    const fetchNextPage = jest.fn();
    const refetch = jest.fn();
    useSeizeConnectContextMock.mockReturnValue({
      address: "0xABC",
      hasValidWalletAuth: false,
    });
    useWavesV2Mock.mockReturnValue({
      waves: [
        { id: "older", latestDropTimestamp: 100 },
        { id: "newer", latestDropTimestamp: 200 },
      ],
      isFetching: true,
      isFetchingNextPage: true,
      hasNextPage: true,
      fetchNextPage,
      status: "success",
      refetch,
      queryKey: dmWavesQueryKey,
      dataUpdatedAt: 100,
    });

    const { result } = renderHook(() => useDmWavesList());

    expect(useWavesV2Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        directMessage: true,
        viewerIdentityKey: null,
        enabled: false,
      })
    );
    expect(result.current.waves).toEqual([]);
    expect(result.current.mainWaves).toEqual([]);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isFetchingNextPage).toBe(false);
    expect(result.current.hasNextPage).toBe(false);

    result.current.fetchNextPage();
    result.current.mainWavesRefetch();
    result.current.refetchAllWaves();

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it("respects enabled=false without enabling the full DM query", () => {
    const fetchNextPage = jest.fn();
    const refetch = jest.fn();
    useWavesV2Mock.mockReturnValue({
      waves: [
        { id: "older", latestDropTimestamp: 100 },
        { id: "newer", latestDropTimestamp: 200 },
      ],
      isFetching: true,
      isFetchingNextPage: true,
      hasNextPage: true,
      fetchNextPage,
      status: "success",
      refetch,
      queryKey: dmWavesQueryKey,
      dataUpdatedAt: 100,
    });

    const { result } = renderHook(() => useDmWavesList({ enabled: false }));

    expect(useWavesV2Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        directMessage: true,
        viewerIdentityKey: "0xabc:profile:profile-1:primary",
        enabled: false,
      })
    );
    expect(result.current.waves).toEqual([]);
    expect(result.current.mainWaves).toEqual([]);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isFetchingNextPage).toBe(false);
    expect(result.current.hasNextPage).toBe(false);

    result.current.fetchNextPage();
    result.current.mainWavesRefetch();
    result.current.refetchAllWaves();

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it("re-enables the DM query after profile loading settles", () => {
    let fetchingProfile = true;
    useAuthMock.mockImplementation(() => ({
      activeProfileProxy: null,
      connectedProfile: fetchingProfile
        ? null
        : { id: "profile-1", handle: "me" },
      fetchingProfile,
      isAuthenticated: true,
    }));

    const { rerender } = renderHook(() => useDmWavesList());

    expect(useWavesV2Mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        directMessage: true,
        viewerIdentityKey: null,
        enabled: false,
      })
    );

    useWavesV2Mock.mockClear();
    fetchingProfile = false;
    rerender();

    expect(useWavesV2Mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        directMessage: true,
        viewerIdentityKey: "0xabc:profile:profile-1:primary",
        enabled: true,
      })
    );
  });

  it("keeps the DM cache identity stable across JWT refreshes", () => {
    const { rerender } = renderHook(() => useDmWavesList());
    const firstViewerIdentityKey = useWavesV2Mock.mock.lastCall?.[0]
      .viewerIdentityKey as string;

    getAuthJwtMock.mockReturnValue("refreshed-valid-jwt");
    rerender();

    const secondViewerIdentityKey = useWavesV2Mock.mock.lastCall?.[0]
      .viewerIdentityKey as string;
    expect(secondViewerIdentityKey).toBe(firstViewerIdentityKey);
  });

  it("changes the DM cache identity when the connected profile changes", () => {
    let connectedProfile = { id: "profile-1", handle: "first" };
    useAuthMock.mockImplementation(() => ({
      activeProfileProxy: null,
      connectedProfile,
      fetchingProfile: false,
      isAuthenticated: true,
    }));

    const { rerender } = renderHook(() => useDmWavesList());
    const firstViewerIdentityKey = useWavesV2Mock.mock.lastCall?.[0]
      .viewerIdentityKey as string;

    connectedProfile = { id: "profile-2", handle: "second" };
    rerender();

    const secondViewerIdentityKey = useWavesV2Mock.mock.lastCall?.[0]
      .viewerIdentityKey as string;
    expect(firstViewerIdentityKey).toContain(":profile:profile-1:");
    expect(secondViewerIdentityKey).toContain(":profile:profile-2:");
    expect(secondViewerIdentityKey).not.toBe(firstViewerIdentityKey);
  });
});
