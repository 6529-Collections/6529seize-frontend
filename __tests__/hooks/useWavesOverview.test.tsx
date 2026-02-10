import { renderHook, act } from '@testing-library/react';
import { useWavesOverview } from '@/hooks/useWavesOverview';
import { ApiWavesOverviewType } from '@/generated/models/ApiWavesOverviewType';

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
}));

const useInfiniteQueryMock = require('@tanstack/react-query').useInfiniteQuery as jest.Mock;

describe('useWavesOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns waves and fetchNextPage works', () => {
    const fetchNext = jest.fn();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [[{ id: '1' }]] },
      fetchNextPage: fetchNext,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      status: 'success',
      refetch: jest.fn(),
    });
    const { result, rerender } = renderHook(() =>
      useWavesOverview({ type: ApiWavesOverviewType.RecentlyDroppedTo })
    );
    expect(result.current.waves).toHaveLength(1);
    act(() => {
      result.current.fetchNextPage();
    });
    expect(fetchNext).toHaveBeenCalled();

    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [[{ id: '1' }, { id: '2' }]] },
      fetchNextPage: fetchNext,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      status: 'success',
      refetch: jest.fn(),
    });
    rerender();
    expect(result.current.waves).toHaveLength(2);
  });
});
