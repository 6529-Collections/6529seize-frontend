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
      metrics: { 
        latest_drop_timestamp: 100,
        your_unread_drops_count: 0,
        your_latest_read_timestamp: 0,
        first_unread_drop_serial_no: null,
        muted: false,
      },
      wave: { type: ApiWaveType.Chat },
    };
    const waveB: any = {
      id: 'b',
      name: 'B',
      picture: null,
      contributors_overview: [{ contributor_pfp: '2.png' }],
      metrics: { 
        latest_drop_timestamp: 200,
        your_unread_drops_count: 5,
        your_latest_read_timestamp: 150,
        first_unread_drop_serial_no: 42,
        muted: false,
      },
      wave: { type: ApiWaveType.Rank },
      pinned: true,
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
    expect(result.current.waves[0]?.id).toBe('b');
    expect(result.current.waves[0]?.newDropsCount.count).toBe(2);
    expect(result.current.waves[0]?.newDropsCount.latestDropTimestamp).toBe(300);
    expect(result.current.waves[0]?.isPinned).toBe(true);
  });

  it('maps unreadDropsCount and firstUnreadDropSerialNo from wave metrics', () => {
    const waveWithUnread: any = {
      id: 'unread-wave',
      name: 'Unread Wave',
      picture: null,
      contributors_overview: [],
      metrics: { 
        latest_drop_timestamp: 100,
        your_unread_drops_count: 15,
        your_latest_read_timestamp: 90,
        first_unread_drop_serial_no: 123,
        muted: false,
      },
      wave: { type: ApiWaveType.Chat },
    };

    wavesListMock.mockReturnValue({
      waves: [waveWithUnread],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      addPinnedWave: jest.fn(),
      removePinnedWave: jest.fn(),
      refetchAllWaves: jest.fn(),
      mainWavesRefetch: jest.fn(),
      pinnedWaves: [],
    } as any);
    newDropCounterMock.mockReturnValue({
      newDropsCounts: {},
      resetAllWavesNewDropsCount: jest.fn(),
    } as any);

    const { result } = renderHook(() => useEnhancedWavesList(null));
    expect(result.current.waves[0]?.unreadDropsCount).toBe(15);
    expect(result.current.waves[0]?.latestReadTimestamp).toBe(90);
    expect(result.current.waves[0]?.firstUnreadDropSerialNo).toBe(123);
  });

  it('maps isMuted from wave metrics', () => {
    const mutedWave: any = {
      id: 'muted-wave',
      name: 'Muted Wave',
      picture: null,
      contributors_overview: [],
      metrics: { 
        latest_drop_timestamp: 100,
        your_unread_drops_count: 0,
        your_latest_read_timestamp: 0,
        first_unread_drop_serial_no: null,
        muted: true,
      },
      wave: { type: ApiWaveType.Chat },
    };

    wavesListMock.mockReturnValue({
      waves: [mutedWave],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      addPinnedWave: jest.fn(),
      removePinnedWave: jest.fn(),
      refetchAllWaves: jest.fn(),
      mainWavesRefetch: jest.fn(),
      pinnedWaves: [],
    } as any);
    newDropCounterMock.mockReturnValue({
      newDropsCounts: {},
      resetAllWavesNewDropsCount: jest.fn(),
    } as any);

    const { result } = renderHook(() => useEnhancedWavesList(null));
    expect(result.current.waves[0]?.isMuted).toBe(true);
  });

  it('sets firstUnreadDropSerialNo to null when first_unread_drop_serial_no is undefined', () => {
    const waveNoUnreadSerial: any = {
      id: 'no-serial-wave',
      name: 'No Serial Wave',
      picture: null,
      contributors_overview: [],
      metrics: { 
        latest_drop_timestamp: 100,
        your_unread_drops_count: 0,
        your_latest_read_timestamp: 0,
        muted: false,
      },
      wave: { type: ApiWaveType.Chat },
    };

    wavesListMock.mockReturnValue({
      waves: [waveNoUnreadSerial],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      addPinnedWave: jest.fn(),
      removePinnedWave: jest.fn(),
      refetchAllWaves: jest.fn(),
      mainWavesRefetch: jest.fn(),
      pinnedWaves: [],
    } as any);
    newDropCounterMock.mockReturnValue({
      newDropsCounts: {},
      resetAllWavesNewDropsCount: jest.fn(),
    } as any);

    const { result } = renderHook(() => useEnhancedWavesList(null));
    expect(result.current.waves[0]?.firstUnreadDropSerialNo).toBeNull();
  });
});
