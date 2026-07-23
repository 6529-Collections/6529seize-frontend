import { renderHook } from "@testing-library/react";
import useDmWavesList from "@/hooks/useDmWavesList";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS } from "@/components/react-query-wrapper/utils/query-utils";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/hooks/useWavesV2", () => ({
  useWavesV2: jest.fn(),
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
const getAuthJwtMock = require("@/services/auth/auth.utils")
  .getAuthJwt as jest.Mock;
const isAuthJwtUsableMock = require("@/services/auth/auth.utils")
  .isAuthJwtUsable as jest.Mock;

describe("useDmWavesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
