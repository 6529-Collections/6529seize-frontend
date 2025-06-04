import { renderHook } from '@testing-library/react';
import React from 'react';
import useEnhancedWavesList from '../../../../contexts/wave/hooks/useEnhancedWavesList';
import useWavesList from '../../../../hooks/useWavesList';
import useNewDropCounter from '../../../../contexts/wave/hooks/useNewDropCounter';
import { ApiWaveType } from '../../../../generated/models/ApiWaveType';

jest.mock('../../../../hooks/useWavesList');
jest.mock('../../../../contexts/wave/hooks/useNewDropCounter');

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
    };
    wavesListMock.mockReturnValue({
      waves: [waveA, waveB],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      addPinnedWave: jest.fn(),
      removePinnedWave: jest.fn(),
      refetchAllWaves: jest.fn(),
      pinnedWaves: [{ id: 'b' }],
    } as any);
    newDropCounterMock.mockReturnValue({
      newDropsCounts: { b: { count: 2, latestDropTimestamp: 300 } },
      resetAllWavesNewDropsCount: jest.fn(),
    } as any);

    const { result } = renderHook(() => useEnhancedWavesList('b'));
    expect(result.current.waves[0].id).toBe('b');
    expect(result.current.waves[0].newDropsCount.count).toBe(2);
    expect(result.current.waves[0].isPinned).toBe(true);
  });
});
