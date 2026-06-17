import { renderHook } from "@testing-library/react";
import useEnhancedWavesListCore from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import useNewDropCounter from "@/contexts/wave/hooks/useNewDropCounter";

jest.mock("@/contexts/wave/hooks/useNewDropCounter", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    newDropsCounts: {},
    resetAllWavesNewDropsCount: jest.fn(),
  })),
  getNewestTimestamp: jest.fn(
    (cached: number | null | undefined, server: number | null | undefined) =>
      cached ?? server ?? null
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
    firstUnreadDropSerialNo: null,
    unreadDropsCount: 0,
    latestReadTimestamp: 0,
    pinned: false,
    muted: false,
    ...overrides,
  }) as any;

describe("useEnhancedWavesListCore", () => {
  beforeEach(() => {
    mockedUseNewDropCounter.mockClear();
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
});
