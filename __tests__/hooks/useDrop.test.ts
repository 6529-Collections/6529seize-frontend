import { renderHook, act } from '@testing-library/react';
import { useDrop } from '@/hooks/useDrop';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { commonApiFetch } from '@/services/api/common-api';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query');
jest.mock('@/services/api/common-api');

const useQueryMock = useQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;

describe('useDrop hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prefetches drop', async () => {
    const prefetchQuery = jest.fn();
    useQueryClientMock.mockReturnValue({ prefetchQuery });
    useQueryMock.mockReturnValue({ data: { id: 'd' }, isFetching: false, refetch: jest.fn() });
    const { result } = renderHook(() => useDrop({ dropId: 'd1' }));
    await act(async () => {
      result.current.prefetchDrop();
    });
    expect(prefetchQuery).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROP, { drop_id: 'd1' }],
      queryFn: expect.any(Function),
      staleTime: 300000,
    });
    commonApiFetchMock.mockResolvedValue({ id: 'd1' });
    await prefetchQuery.mock.calls[0][0].queryFn();
    expect(commonApiFetchMock).toHaveBeenCalledWith({ endpoint: 'drops/d1' });
  });

  it('uses initial data when provided', () => {
    useQueryClientMock.mockReturnValue({ prefetchQuery: jest.fn() });
    const refetch = jest.fn();
    useQueryMock.mockReturnValue({ data: { id: 'init' }, isFetching: false, refetch });
    const { result } = renderHook(() => useDrop({ dropId: 'd1', initialDrop: { id: 'init' } as any }));
    expect(result.current.drop).toEqual({ id: 'init' });
    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROP, { drop_id: 'd1' }],
      queryFn: expect.any(Function),
      initialData: { id: 'init' },
      placeholderData: keepPreviousData,
      enabled: true,
    });
    expect(result.current.isFetching).toBe(false);
    expect(result.current.refetch).toBe(refetch);
  });
});
