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
    expect(result.current.waves[0]?.firstUnreadDropSerialNo).toBe(10);
  });

  it("does not carry a cleared unread overlay into another viewer identity", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [createSidebarWave({ unreadDropsCount: 1 })],
    });
    const { result, rerender } = renderHook(
      ({ identityKey }) =>
        useEnhancedWavesListCore(null, wavesData, {
          supportsPinning: false,
          serverUnreadCount: 1,
          stateIdentityKey: identityKey,
        }),
      { initialProps: { identityKey: "profile-1" } }
    );

    act(() => {
      result.current.markWaveRead("wave-1");
    });
    expect(result.current.waves[0]?.unreadDropsCount).toBe(0);
    expect(result.current.unreadCount).toBe(0);

    rerender({ identityKey: "profile-2" });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(1);
    expect(result.current.unreadCount).toBe(1);

    rerender({ identityKey: "profile-1" });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it("keeps a locally read wave cleared when a later request returns the same unread snapshot", () => {
    const { result, rerender } = renderHook(
      ({ serverSnapshotRequestStartedAt }) =>
        useEnhancedWavesListCore(
          null,
          createWavesData({
            mainWavesRefetch: jest.fn(),
            refetchAllWaves: jest.fn(),
            waves: [
              createSidebarWave({
                firstUnreadDropSerialNo: 10,
                unreadDropsCount: 1,
                serverSnapshotLatestDropTimestamp: 100,
                serverSnapshotRequestStartedAt,
              }),
            ],
          }),
          {
            serverUnreadCount: 1,
            supportsPinning: false,
            stateIdentityKey: "profile-1",
          }
        ),
      { initialProps: { serverSnapshotRequestStartedAt: 90 } }
    );

    act(() => {
      result.current.markWaveRead("wave-1");
    });
    expect(result.current.waves[0]?.unreadDropsCount).toBe(0);

    rerender({ serverSnapshotRequestStartedAt: 101 });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it("restores unread when a server snapshot contains a newer drop", () => {
    const { result, rerender } = renderHook(
      ({ latestDropTimestamp }) =>
        useEnhancedWavesListCore(
          null,
          createWavesData({
            mainWavesRefetch: jest.fn(),
            refetchAllWaves: jest.fn(),
            waves: [
              createSidebarWave({
                firstUnreadDropSerialNo: 10,
                latestDropTimestamp,
                serverSnapshotLatestDropTimestamp: latestDropTimestamp,
                unreadDropsCount: 1,
              }),
            ],
          }),
          {
            supportsPinning: false,
            stateIdentityKey: "profile-1",
          }
        ),
      { initialProps: { latestDropTimestamp: 100 } }
    );

    act(() => {
      result.current.markWaveRead("wave-1");
    });
    expect(result.current.waves[0]?.unreadDropsCount).toBe(0);

    rerender({ latestDropTimestamp: 101 });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(1);
  });

  it("restores unread when the first unread serial advances at the same timestamp", () => {
    const { result, rerender } = renderHook(
      ({ firstUnreadDropSerialNo }) =>
        useEnhancedWavesListCore(
          null,
          createWavesData({
            mainWavesRefetch: jest.fn(),
            refetchAllWaves: jest.fn(),
            waves: [
              createSidebarWave({
                firstUnreadDropSerialNo,
                serverSnapshotLatestDropTimestamp: 100,
                unreadDropsCount: 1,
              }),
            ],
          }),
          {
            supportsPinning: false,
            stateIdentityKey: "profile-1",
          }
        ),
      { initialProps: { firstUnreadDropSerialNo: 10 } }
    );

    act(() => {
      result.current.markWaveRead("wave-1");
    });
    expect(result.current.waves[0]?.unreadDropsCount).toBe(0);

    rerender({ firstUnreadDropSerialNo: 11 });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(1);
  });

  it("does not expose an unread count until an unknown wave is classified", () => {
    mockedUseNewDropCounter.mockReturnValue({
      newDropsCounts: {
        "unknown-dm": {
          count: 2,
          latestDropTimestamp: 200,
          firstUnreadSerialNo: 20,
        },
      },
      resetAllWavesNewDropsCount: jest.fn(),
      resetWaveNewDropsCount: jest.fn(),
    });
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [createSidebarWave({ unreadDropsCount: 1 })],
    });

    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        supportsPinning: false,
      })
    );

    expect(result.current.unreadCount).toBe(1);
  });

  it("subtracts only the locally read wave from the server aggregate", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [
        createSidebarWave({ id: "wave-1", unreadDropsCount: 2 }),
        createSidebarWave({ id: "wave-2", unreadDropsCount: 3 }),
      ],
    });
    const { result } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        serverUnreadCount: 5,
        supportsPinning: false,
        stateIdentityKey: "profile-1",
      })
    );

    act(() => {
      result.current.markWaveRead("wave-1");
    });

    expect(result.current.waves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "wave-1", unreadDropsCount: 0 }),
        expect.objectContaining({ id: "wave-2", unreadDropsCount: 3 }),
      ])
    );
    expect(result.current.unreadCount).toBe(3);
  });

  it("stops subtracting a locally read row after a newer aggregate snapshot", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [createSidebarWave({ id: "wave-1", unreadDropsCount: 1 })],
    });
    const { result, rerender } = renderHook(
      ({ serverUnreadCount, serverUnreadDataUpdatedAt }) =>
        useEnhancedWavesListCore(null, wavesData, {
          serverUnreadCount,
          serverUnreadDataUpdatedAt,
          supportsPinning: false,
          stateIdentityKey: "profile-1",
        }),
      {
        initialProps: {
          serverUnreadCount: 2,
          serverUnreadDataUpdatedAt: 100,
        },
      }
    );

    act(() => {
      result.current.markWaveRead("wave-1");
    });
    expect(result.current.unreadCount).toBe(1);

    rerender({ serverUnreadCount: 1, serverUnreadDataUpdatedAt: 101 });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(0);
    expect(result.current.unreadCount).toBe(1);
  });

  it("shows a websocket drop that arrives after a local clear", () => {
    const resetWaveNewDropsCount = jest.fn();
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [createSidebarWave({ unreadDropsCount: 1 })],
    });
    const { result, rerender } = renderHook(() =>
      useEnhancedWavesListCore(null, wavesData, {
        serverUnreadCount: 1,
        supportsPinning: false,
        stateIdentityKey: "profile-1",
      })
    );

    act(() => {
      result.current.markWaveRead("wave-1");
    });
    expect(result.current.unreadCount).toBe(0);

    mockedUseNewDropCounter.mockReturnValue({
      newDropsCounts: {
        "wave-1": {
          count: 1,
          latestDropTimestamp: 101,
          firstUnreadSerialNo: 11,
        },
      },
      resetAllWavesNewDropsCount: jest.fn(),
      resetWaveNewDropsCount,
    });
    rerender();

    expect(result.current.waves[0]?.unreadDropsCount).toBe(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it("suppresses a forced unread count while its wave is active", () => {
    const wavesData = createWavesData({
      mainWavesRefetch: jest.fn(),
      refetchAllWaves: jest.fn(),
      waves: [createSidebarWave()],
    });
    const { result, rerender } = renderHook(
      ({ activeWaveId }) =>
        useEnhancedWavesListCore(activeWaveId, wavesData, {
          supportsPinning: false,
        }),
      { initialProps: { activeWaveId: null as string | null } }
    );

    act(() => {
      result.current.restoreWaveUnreadCount("wave-1", 2);
    });
    expect(result.current.waves[0]?.unreadDropsCount).toBe(2);

    rerender({ activeWaveId: "wave-1" });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(0);

    rerender({ activeWaveId: null });

    expect(result.current.waves[0]?.unreadDropsCount).toBe(2);
  });
});
