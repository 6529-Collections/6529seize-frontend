import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useWavesList from "@/hooks/useWavesList";
import { AuthContext } from "@/components/auth/Auth";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/hooks/useAnnouncementWaveActivity", () => ({
  useAnnouncementWaveActivity: jest.fn((wave) => wave),
}));
jest.mock("@/hooks/useWavesV2", () => ({
  ...jest.requireActual("@/hooks/useWavesV2"),
  useWavesV2: jest.fn(),
}));
jest.mock("@/hooks/usePinnedWavesServer", () => ({
  usePinnedWavesServer: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({ address: "0xABC" })),
}));
jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));
jest.mock("@/hooks/useShowFollowingWaves", () => ({
  useShowFollowingWaves: jest.fn(() => [false]),
}));
jest.mock("@/hooks/useWaveSubwaves", () => ({
  useWaveSubwavesMap: jest.fn(),
  getWaveSubwavesQueryKey: jest.fn(() => ["WAVE_SUBWAVES"]),
  getWaveSubwavesQueryOptions: jest.fn(() => ({
    queryKey: ["WAVE_SUBWAVES"],
    queryFn: jest.fn().mockResolvedValue([]),
  })),
}));
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

const useWavesV2Mock = jest.requireMock("@/hooks/useWavesV2")
  .useWavesV2 as jest.Mock;
const usePinnedWavesServerMock = jest.requireMock(
  "@/hooks/usePinnedWavesServer"
).usePinnedWavesServer as jest.Mock;
const useWaveByIdMock = jest.requireMock("@/hooks/useWaveById")
  .useWaveById as jest.Mock;
const useWaveSubwavesMapMock = jest.requireMock("@/hooks/useWaveSubwaves")
  .useWaveSubwavesMap as jest.Mock;
const useSeizeSettingsMock = jest.requireMock("@/contexts/SeizeSettingsContext")
  .useSeizeSettings as jest.Mock;

const sidebarWave = (id: string, latestDropTimestamp: number) => ({
  id,
  name: id,
  type: ApiWaveType.Chat,
  createdAt: 0,
  picture: null,
  contributors: [],
  isDirectMessage: false,
  hasCompetition: false,
  parentWaveId: null,
  hasSubwaves: false,
  descriptionDrop: { contents: null, media: [] },
  totalDropsCount: 0,
  isPrivate: false,
  latestDropTimestamp,
  latestFollowedSubwaveDropTimestamp: null,
  firstUnreadDropSerialNo: null,
  firstUnreadFollowedSubwaveDropSerialNo: null,
  unreadDropsCount: 0,
  followedSubwavesCount: 0,
  unreadSubwaveDrops: 0,
  latestReadTimestamp: 0,
  pinned: false,
  muted: false,
  subscribed: true,
});

const recentWaves = [sidebarWave("a", 300), sidebarWave("b", 200)];
const pinnedWaves = [{ ...sidebarWave("p", 100), pinned: true }];
const announcementWave = { ...sidebarWave("announce", 50) };

describe("useWavesList identity", () => {
  beforeEach(() => {
    // Upstream hooks return equal data in new wrappers on every render, as
    // query results do: new functions, new id arrays, new subwave maps.
    useWavesV2Mock.mockImplementation(() => ({
      waves: recentWaves,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      refetch: jest.fn(),
      refetchIfStale: jest.fn(),
      retryLoading: jest.fn(),
      hasLoadingError: false,
    }));
    usePinnedWavesServerMock.mockImplementation(() => ({
      pinnedIds: ["p"],
      pinnedWaves,
      pinWave: jest.fn(),
      unpinWave: jest.fn(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      refetchIfStale: jest.fn(),
    }));
    // TanStack's own refetch keeps its identity.
    const announcementRefetch = jest.fn();
    useWaveByIdMock.mockImplementation(() => ({
      wave: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: announcementRefetch,
      isFetching: false,
    }));
    useWaveSubwavesMapMock.mockImplementation(() => ({
      subwaves: [],
      subwavesByParentId: new Map(),
      isFetching: false,
      refetch: jest.fn(),
    }));
    useSeizeSettingsMock.mockImplementation(() => ({
      seizeSettings: { announcements_wave_id: null },
      isAnnouncementsWave: (waveId: string) => waveId === announcementWave.id,
      isLoaded: true,
      loadError: null,
    }));
  });

  it("keeps the result, lists and callbacks across renders with equal inputs", () => {
    const queryClient = new QueryClient();
    const auth = {
      connectedProfile: { handle: "me" },
      activeProfileProxy: null,
    } as never;
    const wrapper = ({ children }: { readonly children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
    const { result, rerender } = renderHook(() => useWavesList(), {
      wrapper,
    });
    const first = result.current;
    expect(first.waves.map((wave) => wave.id)).toEqual(["p", "a", "b"]);

    rerender();

    expect(result.current).toBe(first);
    expect(result.current.waves).toBe(first.waves);
    expect(result.current.pinnedWaves).toBe(first.pinnedWaves);
    expect(result.current.mainWaves).toBe(first.mainWaves);
    expect(result.current.fetchNextPage).toBe(first.fetchNextPage);
    expect(result.current.retryRecommendations).toBe(
      first.retryRecommendations
    );
    expect(result.current.retryLoading).toBe(first.retryLoading);
    expect(result.current.addPinnedWave).toBe(first.addPinnedWave);
    expect(result.current.removePinnedWave).toBe(first.removePinnedWave);
    expect(result.current.refetchAllWaves).toBe(first.refetchAllWaves);
    expect(result.current.refreshActivityList).toBe(first.refreshActivityList);
    expect(result.current.refreshStaleWaves).toBe(first.refreshStaleWaves);
    expect(result.current.mainWavesRefetch).toBe(first.mainWavesRefetch);
    expect(result.current.loadSubwavesForParent).toBe(
      first.loadSubwavesForParent
    );
    expect(result.current.prefetchSubwavesForParent).toBe(
      first.prefetchSubwavesForParent
    );
    expect(result.current.loadingSubwaveParentIds).toBe(
      first.loadingSubwaveParentIds
    );
  });
});
