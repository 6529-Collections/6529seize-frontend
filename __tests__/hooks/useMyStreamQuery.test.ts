import { renderHook } from '@testing-library/react';
import { useMyStreamQuery, usePollingQuery } from '@/hooks/useMyStreamQuery';

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: () => ({ prefetchInfiniteQuery: jest.fn() }),
}));

jest.mock('@/services/api/common-api', () => ({ commonApiFetch: jest.fn(() => Promise.resolve([])) }));

const { useInfiniteQuery, useQuery } = require('@tanstack/react-query');

describe('useMyStreamQuery', () => {
  it('reverses items when reverse true', () => {
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [[{ serial_no: 1 }, { serial_no: 2 }]] },
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      status: 'success',
    });
    const { result } = renderHook(() => useMyStreamQuery({ reverse: true }));
    expect(result.current.items.map((i) => i.serial_no)).toEqual([2, 1]);
  });
});

describe('usePollingQuery', () => {
  it('detects new items appearing', () => {
    (useQuery as jest.Mock).mockReturnValue({ data: [{ serial_no: 3 }], refetch: jest.fn() });
    const { result, rerender } = renderHook((props: any) => usePollingQuery(props.initial, props.items, false), {
      initialProps: { initial: true, items: [{ serial_no: 1 }], },
    });
    rerender({ initial: true, items: [{ serial_no: 1 }], });
    expect(result.current.haveNewItems).toBe(true);
  });
});
