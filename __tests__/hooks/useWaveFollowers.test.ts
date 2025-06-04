import { renderHook, act } from '@testing-library/react';
import { useWaveFollowers } from '../../hooks/useWaveFollowers';
import { useInfiniteQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useInfiniteQuery: jest.fn() }));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test('fetches next page on intersection when enough followers loaded', () => {
  const fetchNextPage = jest.fn();
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [{ data: Array(100).fill({}), next: true, page: 1 }] },
    fetchNextPage,
    hasNextPage: true,
    isFetching: false,
    isFetchingNextPage: false,
    status: 'success',
  });
  const { result } = renderHook(() => useWaveFollowers('w1'));
  act(() => result.current.onBottomIntersection(true));
  expect(fetchNextPage).toHaveBeenCalled();
});

test('does not fetch when less than request size', () => {
  const fetchNextPage = jest.fn();
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [{ data: [{}], next: false, page: 1 }] },
    fetchNextPage,
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    status: 'success',
  });
  const { result } = renderHook(() => useWaveFollowers('w1'));
  act(() => result.current.onBottomIntersection(true));
  expect(fetchNextPage).not.toHaveBeenCalled();
});
