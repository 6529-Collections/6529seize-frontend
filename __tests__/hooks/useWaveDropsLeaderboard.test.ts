import { renderHook, act } from '@testing-library/react';
import { useWaveDropsLeaderboard } from '../../hooks/useWaveDropsLeaderboard';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'react-use';

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
  generateUniqueKeys: jest.fn((a) => a),
  mapToExtendedDrops: jest.fn((pages) => pages.flatMap((p: any) => p.drops)),
}));

const queryClientMock = { prefetchInfiniteQuery: jest.fn(), removeQueries: jest.fn() };
(useQueryClient as jest.Mock).mockReturnValue(queryClientMock);
(useInfiniteQuery as jest.Mock).mockReturnValue({
  data: { pages: [] },
  fetchNextPage: jest.fn(),
  hasNextPage: true,
  isFetching: false,
  isFetchingNextPage: false,
  refetch: jest.fn(),
});
(useQuery as jest.Mock).mockReturnValue({});

describe('useWaveDropsLeaderboard', () => {
  it('calls fetchNextPage via manualFetch when more pages', async () => {
    const fetchNext = jest.fn();
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [] },
      fetchNextPage: fetchNext,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() => useWaveDropsLeaderboard({ waveId: '1', connectedProfileHandle: 'h' }));
    await act(async () => {
      await result.current.manualFetch();
    });
    expect(fetchNext).toHaveBeenCalled();
  });

  it('removes queries on unmount', () => {
    const { unmount } = renderHook(() => useWaveDropsLeaderboard({ waveId: '2', connectedProfileHandle: 'h' }));
    unmount();
    expect(queryClientMock.removeQueries).toHaveBeenCalledWith({ queryKey: ['DROPS', { waveId: '2' }] });
  });

  it('does not fetch next page when none left', async () => {
    const fetchNext = jest.fn();
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [] },
      fetchNextPage: fetchNext,
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
    const { result } = renderHook(() => useWaveDropsLeaderboard({ waveId: '3', connectedProfileHandle: 'h' }));
    await act(async () => {
      await result.current.manualFetch();
    });
    expect(fetchNext).not.toHaveBeenCalled();
  });
});
