import { act, renderHook } from "@testing-library/react";
import useEnhancedWavesListCore from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import useNewDropCounter from "@/contexts/wave/hooks/useNewDropCounter";

jest.mock("@/contexts/wave/hooks/useNewDropCounter", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    newDropsCounts: {},
    resetAllWavesNewDropsCount: jest.fn(),
    resetWaveNewDropsCount: jest.fn(),
  })),
  getNewestTimestamp: jest.fn(
    (cached: number | null | undefined, server: number | null | undefined) => {
      if (cached == null && server == null) {
        return null;
      }

      if (cached == null) {
        return server;
      }

      if (server == null) {
        return cached;
      }

      return Math.max(cached, server);
    }
  ),
}));

const mockedUseNewDropCounter = useNewDropCounter as jest.Mock;

const createWavesData = ({
  mainWavesRefetch,
  refetchAllWaves,
  waves = [],
}: {
  readonly mainWavesRefetch: jest.Mock;
  readonly refetchAllWaves: jest.Mock;
  readonly waves?: any[];
}) => ({
  waves,
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
  mainWavesRefetch,
  refetchAllWaves,
  loadSubwavesForParent: jest.fn(),
  prefetchSubwavesForParent: jest.fn(),
  addPinnedWave: jest.fn(),
  removePinnedWave: jest.fn(),
});

const createSidebarWave = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "wave-1",
    name: "Wave 1",
    type: "CHAT",
    createdAt: 0,
    picture: null,
    contributors: [],
    isDirectMessage: false,
    hasCompetition: false,
    parentWaveId: null,
    hasSubwaves: false,
    latestDropTimestamp: 100,
    latestFollowedSubwaveDropTimestamp: null,
    firstUnreadDropSerialNo: null,
    firstUnreadFollowedSubwaveDropSerialNo: null,
    unreadDropsCount: 0,
    followedSubwavesCount: 0,
    unreadSubwaveDrops: 0,
    latestReadTimestamp: 0,
    pinned: false,
    muted: false,
    ...overrides,
  }) as any;

describe("useEnhancedWavesListCore", () => {
  beforeEach(() => {
    mockedUseNewDropCounter.mockClear();
    mockedUseNewDropCounter.mockReturnValue({
      newDropsCounts: {},
      resetAllWavesNewDropsCount: jest.fn(),
      resetWaveNewDropsCount: jest.fn(),
    });
  });

  it("uses the full waves refetch for live unknown-wave recovery", () => {
    const mainWavesRefetch = jest.fn();
    const refetchAllWaves = jest.fn();
    const wavesData = createWavesData({
      mainWavesRefetch,
      refetchAllWaves,
    });

    renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: true,
      })
    );

    expect(mockedUseNewDropCounter).toHaveBeenCalledWith(
      null,
      [],
      refetchAllWaves,
      expect.any(Object)
    );
    expect(mockedUseNewDropCounter).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      mainWavesRefetch,
      expect.anything()
    );
  });

  it("passes disabled state to the new-drop counter and suppresses returned list work", () => {
    const refetchAllWaves = jest.fn();
    const fetchNextPage = jest.fn();
    const wavesData = {
      ...createWavesData({
        mainWavesRefetch: jest.fn(),
        refetchAllWaves,
        waves: [createSidebarWave()],
      }),
      fetchNextPage,
      isFetching: true,
      isFetchingNextPage: true,
      hasNextPage: true,
    };

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        enabled: false,
        supportsPinning: true,
      })
    );

    expect(mockedUseNewDropCounter).toHaveBeenCalledWith(
      null,
      wavesData.waves,
      refetchAllWaves,
      expect.objectContaining({ enabled: false })
    );
    expect(result.current.waves).toEqual([]);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isFetchingNextPage).toBe(false);
    expect(result.current.hasNextPage).toBe(false);

    result.current.fetchNextPage();
    result.current.refetchAllWaves();
    result.current.markWaveRead("wave-1");
    result.current.restoreWaveUnreadCount("wave-1", 1);

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(refetchAllWaves).not.toHaveBeenCalled();
  });

  it("preserves official marker while mapping sidebar waves", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [createSidebarWave({ isOfficial: true })],
    });

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: true,
      })
    );

    expect(result.current.waves[0]?.isOfficial).toBe(true);
  });

  it("maps followed-subwave container metadata without joining the parent", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [
        createSidebarWave({
          subscribed: false,
          latestDropTimestamp: 100,
          latestFollowedSubwaveDropTimestamp: 500,
          followedSubwavesCount: 2,
          unreadSubwaveDrops: 3,
          firstUnreadFollowedSubwaveDropSerialNo: 42,
        }),
      ],
    });

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: true,
      })
    );

    expect(result.current.waves[0]).toMatchObject({
      isFollowing: false,
      isFollowedSubwaveContainer: true,
      followedSubwavesCount: 2,
      unreadSubwaveDrops: 3,
      firstUnreadFollowedSubwaveDropSerialNo: 42,
      sidebarActivityTimestamp: 500,
      newDropsCount: expect.objectContaining({
        latestDropTimestamp: 100,
      }),
    });
  });

  it("keeps backend order when requested while still moving muted waves down", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [
        createSidebarWave({ id: "first", latestDropTimestamp: 1 }),
        createSidebarWave({
          id: "muted",
          latestDropTimestamp: 999,
          muted: true,
        }),
        createSidebarWave({ id: "second", latestDropTimestamp: 500 }),
      ],
    });

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: true,
        preserveBackendWaveOrder: true,
      })
    );

    expect(result.current.waves.map((wave) => wave.id)).toEqual([
      "first",
      "second",
      "muted",
    ]);
  });

  it("can keep muted waves in latest-message order", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [
        createSidebarWave({
          id: "older-unmuted",
          latestDropTimestamp: 100,
        }),
        createSidebarWave({
          id: "newer-muted",
          latestDropTimestamp: 300,
          muted: true,
        }),
        createSidebarWave({
          id: "middle-unmuted",
          latestDropTimestamp: 200,
        }),
      ],
    });

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: false,
        sortMutedLast: false,
      })
    );

    expect(result.current.waves.map((wave) => wave.id)).toEqual([
      "newer-muted",
      "middle-unmuted",
      "older-unmuted",
    ]);
  });

  it("does not double-count websocket drops already covered by API unread data", () => {
    mockedUseNewDropCounter.mockReturnValue({
      newDropsCounts: {
        "wave-1": {
          count: 2,
          latestDropTimestamp: 90,
          firstUnreadSerialNo: 12,
        },
      },
      resetAllWavesNewDropsCount: jest.fn(),
      resetWaveNewDropsCount: jest.fn(),
    });
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [
        createSidebarWave({
          latestDropTimestamp: 100,
          unreadDropsCount: 3,
          firstUnreadDropSerialNo: 10,
        }),
      ],
    });

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: true,
      })
    );

    expect(result.current.waves[0]?.unreadDropsCount).toBe(3);
    expect(result.current.waves[0]?.apiUnreadDropsCount).toBe(3);
    expect(result.current.waves[0]?.firstUnreadDropSerialNo).toBe(10);
  });

  it("uses a forced API unread count as the aggregate baseline", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [createSidebarWave({ unreadDropsCount: 0 })],
    });

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: true,
      })
    );

    act(() => {
      result.current.restoreWaveUnreadCount("wave-1", 1);
    });

    expect(result.current.waves[0]?.apiUnreadDropsCount).toBe(1);
    expect(result.current.waves[0]?.unreadDropsCount).toBe(1);
  });
});
