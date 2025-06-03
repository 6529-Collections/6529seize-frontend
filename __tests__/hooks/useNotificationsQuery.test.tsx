import { renderHook } from '@testing-library/react';
import { useNotificationsQuery, usePrefetchNotifications } from '../../hooks/useNotificationsQuery';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

const queryClientMock = { prefetchInfiniteQuery: jest.fn() };
(useQueryClient as jest.Mock).mockReturnValue(queryClientMock);

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;

describe('useNotificationsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flattens and reverses data', () => {
    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [
          { notifications: [{ id: 1 }, { id: 2 }] },
          { notifications: [{ id: 3 }] }
        ]
      },
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isLoading: false,
      isLoadingNextPage: false
    });
    const { result } = renderHook(() => useNotificationsQuery({ identity: 'id', reverse: true }));
    expect(result.current.items.map(i => i.id)).toEqual([3,2,1]);
    expect(result.current.isInitialQueryDone).toBe(true);
    expect(queryClientMock.prefetchInfiniteQuery).toHaveBeenCalled();
  });

  it('returns empty when no data', () => {
    useInfiniteQueryMock.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useNotificationsQuery({ identity: 'id' }));
    expect(result.current.items).toEqual([]);
    expect(result.current.isInitialQueryDone).toBe(false);
  });

  it('resets when identity changes', async () => {
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [{ notifications: [{ id: 1 }] }] }
    });
    const { result, rerender } = renderHook(
      ({ identity }) => useNotificationsQuery({ identity }),
      { initialProps: { identity: 'a' } }
    );
    expect(result.current.items).toHaveLength(1);

    useInfiniteQueryMock.mockReturnValue({ data: undefined });
    rerender({ identity: 'b' });

    expect(result.current.items).toEqual([]);
    expect(result.current.isInitialQueryDone).toBe(false);
  });

  it('prefetches notifications', () => {
    const { result } = renderHook(() => usePrefetchNotifications());
    result.current({ identity: 'id' });
    expect(queryClientMock.prefetchInfiniteQuery).toHaveBeenCalled();
  });

  it('does nothing when prefetch called without identity', () => {
    const { result } = renderHook(() => usePrefetchNotifications());
    result.current({ identity: null });
    expect(queryClientMock.prefetchInfiniteQuery).not.toHaveBeenCalled();
  });
});
