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
}: {
  readonly mainWavesRefetch: jest.Mock;
  readonly refetchAllWaves: jest.Mock;
}) => ({
  waves: [],
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
  mainWavesRefetch,
  refetchAllWaves,
  addPinnedWave: jest.fn(),
  removePinnedWave: jest.fn(),
});

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
});
