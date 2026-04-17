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

jest.mock("@/hooks/useWavesOverview", () => ({
  useWavesOverview: jest.fn(),
}));

const useAuthMock = require("@/components/auth/Auth").useAuth as jest.Mock;
const useSeizeConnectContextMock =
  require("@/components/auth/SeizeConnectContext")
    .useSeizeConnectContext as jest.Mock;
const useWavesOverviewMock = require("@/hooks/useWavesOverview")
  .useWavesOverview as jest.Mock;

describe("useDmWavesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({ activeProfileProxy: null });
    useSeizeConnectContextMock.mockReturnValue({ address: "0xABC" });
    useWavesOverviewMock.mockReturnValue({
      waves: [
        { id: "older", metrics: { latest_drop_timestamp: 100 } },
        { id: "newer", metrics: { latest_drop_timestamp: 200 } },
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
    expect(useWavesOverviewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ApiWavesOverviewType.RecentlyDroppedTo,
        directMessage: true,
        viewerIdentityKey: "0xabc:primary",
        refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
        refetchIntervalInBackground: false,
      })
    );
  });
});
