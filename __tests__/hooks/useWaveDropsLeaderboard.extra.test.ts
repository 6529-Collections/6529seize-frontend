import { renderHook, waitFor } from '@testing-library/react';
import { useWaveDropsLeaderboard, WaveDropsLeaderboardSort } from '../../hooks/useWaveDropsLeaderboard';
import { useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
  keepPreviousData: {},
}));
jest.mock('react-use', () => ({ useDebounce: jest.fn() }));
jest.mock('../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));
jest.mock('../../hooks/useCapacitor', () => () => ({ isCapacitor: false }));
jest.mock('../../helpers/waves/wave-drops.helpers', () => ({
  generateUniqueKeys: jest.fn((a:any)=>a),
  mapToExtendedDrops: jest.fn((pages:any)=> pages.flatMap((p:any)=>p.drops)),
}));

const fetchNextPage = jest.fn();
const queryClientMock = { prefetchInfiniteQuery: jest.fn(), removeQueries: jest.fn() };
(useQueryClient as jest.Mock).mockReturnValue(queryClientMock);
(useQuery as jest.Mock).mockReturnValue({});

beforeEach(() => {
  jest.clearAllMocks();
  (useInfiniteQuery as jest.Mock).mockReturnValue({
    data: { pages: [] },
    fetchNextPage,
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
  });
});

describe('useWaveDropsLeaderboard extra', () => {
  it('maps pages to drops', async () => {
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [{ wave: {}, drops: [{ id: 'a' }, { id: 'b' }] }] },
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() =>
      useWaveDropsLeaderboard({ waveId: '1', connectedProfileHandle: 'h' })
    );
    await waitFor(() => result.current.drops.length === 2);
    expect(result.current.drops).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(result.current.isFetching).toBe(false);
  });

  it('prefetches with correct sort', () => {
    renderHook(() =>
      useWaveDropsLeaderboard({ waveId: '2', connectedProfileHandle: 'h', sort: WaveDropsLeaderboardSort.CREATED_AT })
    );
    const call = (queryClientMock.prefetchInfiniteQuery as jest.Mock).mock.calls[0][0];
    expect(call.queryKey[1].sort).toBe(WaveDropsLeaderboardSort.CREATED_AT);
  });
});
