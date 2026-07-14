import { renderHook } from '@testing-library/react';
import { useNotificationsQuery, usePrefetchNotifications } from '@/hooks/useNotificationsQuery';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ApiNotificationCause } from '@/generated/models/ApiNotificationCause';
import { getIdentityNotificationsQueryKey } from '@/services/api/notifications-query';

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
      isLoadingNextPage: false,
      isSuccess: true,
      isError: false
    });
    const { result } = renderHook(() => useNotificationsQuery({ identity: 'id', reverse: true }));
    expect(result.current.items.map(i => i.id)).toEqual([3,2,1]);
    expect(result.current.isInitialQueryDone).toBe(true);
    expect(queryClientMock.prefetchInfiniteQuery).toHaveBeenCalled();
  });

  it('returns empty when no data', () => {
    useInfiniteQueryMock.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: false
    });
    const { result } = renderHook(() => useNotificationsQuery({ identity: 'id' }));
    expect(result.current.items).toEqual([]);
    expect(result.current.isInitialQueryDone).toBe(false);
  });

  it('uses the shared normalized Notifications query key', () => {
    useInfiniteQueryMock.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: false
    });

    renderHook(() => useNotificationsQuery({ identity: ' Alice ' }));

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: getIdentityNotificationsQueryKey({
          identity: ' Alice ',
          limit: '30',
          cause: null
        })
      })
    );
  });

  it('resets when identity changes', async () => {
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [{ notifications: [{ id: 1 }] }] },
      isSuccess: true,
      isError: false
    });
    const { result, rerender } = renderHook(
      ({ identity }) => useNotificationsQuery({ identity }),
      { initialProps: { identity: 'a' } }
    );
    expect(result.current.items).toHaveLength(1);

    useInfiniteQueryMock.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: false
    });
    rerender({ identity: 'b' });

    expect(result.current.items).toEqual([]);
    expect(result.current.isInitialQueryDone).toBe(false);
  });

  it('prefetches notifications', () => {
    const { result } = renderHook(() => usePrefetchNotifications());
    result.current({ identity: 'id' });
    expect(queryClientMock.prefetchInfiniteQuery).toHaveBeenCalled();
  });

  it('groups matching drop reactions across page boundaries only once', () => {
    useInfiniteQueryMock.mockReturnValue({
      data: {
        pages: [
          {
            notifications: [
              {
                id: 1,
                cause: ApiNotificationCause.DropReacted,
                created_at: 100,
                read_at: null,
                related_identity: { id: 'a' },
                related_drops: [{ id: 'drop-1' }],
                additional_context: { reaction: ':heart:' },
              },
            ],
          },
          {
            notifications: [
              {
                id: 2,
                cause: ApiNotificationCause.DropReacted,
                created_at: 200,
                read_at: null,
                related_identity: { id: 'b' },
                related_drops: [{ id: 'drop-1' }],
                additional_context: { reaction: ':fire:' },
              },
            ],
          },
        ],
      },
      isSuccess: true,
      isError: false,
    });

    const { result } = renderHook(() => useNotificationsQuery({ identity: 'id' }));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(
      expect.objectContaining({
        type: 'grouped_reactions',
        id: 2,
        createdAt: 200,
      })
    );
  });

  it('does nothing when prefetch called without identity', () => {
    const { result } = renderHook(() => usePrefetchNotifications());
    result.current({ identity: null });
    expect(queryClientMock.prefetchInfiniteQuery).not.toHaveBeenCalled();
  });
});
