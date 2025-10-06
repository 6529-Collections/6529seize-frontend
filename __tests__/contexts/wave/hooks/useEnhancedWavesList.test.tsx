import { renderHook } from '@testing-library/react';
import useEnhancedWavesList from '@/contexts/wave/hooks/useEnhancedWavesList';
import useWavesList from '@/hooks/useWavesList';
import useNewDropCounter from '@/contexts/wave/hooks/useNewDropCounter';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

jest.mock('@/hooks/useWavesList');
jest.mock('@/contexts/wave/hooks/useNewDropCounter', () => {
  const actual = jest.requireActual('../../../../contexts/wave/hooks/useNewDropCounter');
  return {
    __esModule: true,
    ...actual,
    default: jest.fn(),
  };
});

const wavesListMock = useWavesList as jest.MockedFunction<typeof useWavesList>;
const newDropCounterMock = useNewDropCounter as jest.MockedFunction<typeof useNewDropCounter>;

describe('useEnhancedWavesList', () => {
  it('maps and sorts waves using new drop counts', () => {
    const waveA: any = {
      id: 'a',
      name: 'A',
      picture: 'p',
      contributors_overview: [{ contributor_pfp: '1.png' }],
      metrics: { latest_drop_timestamp: 100 },
      wave: { type: ApiWaveType.Chat },
    };
    const waveB: any = {
      id: 'b',
      name: 'B',
      picture: null,
      contributors_overview: [{ contributor_pfp: '2.png' }],
      metrics: { latest_drop_timestamp: 200 },
      wave: { type: ApiWaveType.Rank },
      isPinned: true,
    };
    const fetchNextPage = jest.fn();
    const addPinnedWave = jest.fn();
    const removePinnedWave = jest.fn();
    const refetchAllWaves = jest.fn();
    const mainWavesRefetch = jest.fn();

    wavesListMock.mockReturnValue({
      waves: [waveA, waveB],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage,
      addPinnedWave,
      removePinnedWave,
      refetchAllWaves,
      mainWavesRefetch,
      pinnedWaves: [{ id: 'b' }],
    } as any);
    newDropCounterMock.mockReturnValue({
      newDropsCounts: { b: { count: 2, latestDropTimestamp: 300 } },
      resetAllWavesNewDropsCount: jest.fn(),
    } as any);

    const { result } = renderHook(() => useEnhancedWavesList('b'));
    expect(result.current.waves[0].id).toBe('b');
    expect(result.current.waves[0].newDropsCount.count).toBe(2);
    expect(result.current.waves[0].newDropsCount.latestDropTimestamp).toBe(300);
    expect(result.current.waves[0].isPinned).toBe(true);
  });
});
