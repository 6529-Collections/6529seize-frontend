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

const useAuthMock = require("@/components/auth/Auth").useAuth as jest.Mock;
const useSeizeConnectContextMock =
  require("@/components/auth/SeizeConnectContext")
    .useSeizeConnectContext as jest.Mock;
const useWavesV2Mock = require("@/hooks/useWavesV2").useWavesV2 as jest.Mock;

describe("useDmWavesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { handle: "me" },
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
        viewerIdentityKey: "0xabc:primary",
        enabled: true,
        refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
      })
    );
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

  it("re-enables the DM query after profile loading settles", () => {
    let fetchingProfile = true;
    useAuthMock.mockImplementation(() => ({
      activeProfileProxy: null,
      fetchingProfile,
      isAuthenticated: true,
    }));

    const { rerender } = renderHook(() => useDmWavesList());

    expect(useWavesV2Mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        directMessage: true,
        viewerIdentityKey: "0xabc:primary",
        enabled: false,
      })
    );

    useWavesV2Mock.mockClear();
    fetchingProfile = false;
    rerender();

    expect(useWavesV2Mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        directMessage: true,
        viewerIdentityKey: "0xabc:primary",
        enabled: true,
      })
    );
  });
});
