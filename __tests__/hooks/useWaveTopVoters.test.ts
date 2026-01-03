import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWaveTopVoters } from '@/hooks/useWaveTopVoters';
import React from 'react';

// Mock the API fetch
jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock('@/components/react-query-wrapper/utils/query-utils', () => ({
  getDefaultQueryRetry: jest.fn(() => ({ retry: 3 })),
}));

import { commonApiFetch } from '@/services/api/common-api';

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

describe('useWaveTopVoters', () => {
  let queryClient: QueryClient;

  const mockVotersPage = {
    data: [
      { id: '1', handle: 'voter1', rating: 10 },
      { id: '2', handle: 'voter2', rating: 8 },
    ],
    next: null,
    count: 2,
  };

  const defaultProps = {
    waveId: 'wave-123',
    connectedProfileHandle: 'test-user',
    reverse: false,
    dropId: null,
  };

  const createWrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
    });
    jest.clearAllMocks();
    mockCommonApiFetch.mockResolvedValue(mockVotersPage);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('fetches wave voters successfully', async () => {
    const { result } = renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(result.current.voters).toEqual(mockVotersPage.data);
    });
    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: 'waves/wave-123/voters',
      params: {
        page_size: '20',
        sort_direction: 'ASC',
        sort: 'ABSOLUTE',
      },
    });
  });

  it('includes dropId in params when provided', async () => {
    const propsWithDropId = { ...defaultProps, dropId: 'drop-456' };

    renderHook(() => useWaveTopVoters(propsWithDropId), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'waves/wave-123/voters',
        params: {
          page_size: '20',
          sort_direction: 'ASC',
          sort: 'ABSOLUTE',
          drop_id: 'drop-456',
        },
      });
    });
  });

  it('uses custom sort direction and sort type', async () => {
    const propsWithCustomSort = {
      ...defaultProps,
      sortDirection: 'DESC' as const,
      sort: 'POSITIVE' as const,
    };

    renderHook(() => useWaveTopVoters(propsWithCustomSort), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'waves/wave-123/voters',
        params: {
          page_size: '20',
          sort_direction: 'DESC',
          sort: 'POSITIVE',
        },
      });
    });
  });

  it('reverses voters when reverse option is true', async () => {
    const propsWithReverse = { ...defaultProps, reverse: true };

    const { result } = renderHook(() => useWaveTopVoters(propsWithReverse), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(result.current.voters).toEqual([...mockVotersPage.data].reverse());
    });
  });

  it('returns empty voters when connectedProfileHandle is undefined', async () => {
    const propsWithoutHandle = { ...defaultProps, connectedProfileHandle: undefined };

    const { result } = renderHook(() => useWaveTopVoters(propsWithoutHandle), {
      wrapper: createWrapper,
    });

    // Initial state should be empty array
    expect(result.current.voters).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('provides pagination functionality', async () => {
    const { result } = renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(result.current.voters).toEqual(mockVotersPage.data);
    });

    // Should provide fetchNextPage function
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.hasNextPage).toBe('boolean');
  });

  it('includes page parameter for subsequent pages', async () => {
    const mockPageOne = {
      data: [{ id: '1', handle: 'voter1', rating: 10 }],
      next: true,
      count: 2,
    };

    // Create fresh query client for this test
    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
    });

    const freshWrapper = ({ children }: { children: React.ReactNode }) => 
      React.createElement(QueryClientProvider, { client: freshQueryClient }, children);

    mockCommonApiFetch.mockReset().mockResolvedValue(mockPageOne);

    const { result } = renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: freshWrapper,
    });

    await waitFor(() => {
      expect(result.current.voters.length).toBeGreaterThan(0);
      expect(result.current.voters).toContainEqual(mockPageOne.data[0]);
    });

    // Fetch next page
    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: 'waves/wave-123/voters',
        params: {
          page_size: '20',
          sort_direction: 'ASC',
          sort: 'ABSOLUTE',
          page: '2',
        },
      });
    });
  });

  it('uses custom refetch interval', () => {
    const propsWithRefetchInterval = { ...defaultProps, refetchInterval: 5000 };

    renderHook(() => useWaveTopVoters(propsWithRefetchInterval), {
      wrapper: createWrapper,
    });

    // The refetch interval is passed to useInfiniteQuery
    // We can't easily test this directly, but we can verify the hook doesn't error
    expect(mockCommonApiFetch).toHaveBeenCalled();
  });

  it('handles empty response', async () => {
    const emptyResponse = {
      data: [],
      next: null,
      count: 0,
    };

    mockCommonApiFetch.mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(result.current.voters).toEqual([]);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('provides refetch functionality', async () => {
    const { result } = renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: createWrapper,
    });

    await waitFor(() => {
      expect(result.current.voters).toEqual(mockVotersPage.data);
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('provides error handling capability', async () => {
    const { result } = renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: createWrapper,
    });

    // Should have voters array even if empty
    expect(Array.isArray(result.current.voters)).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('updates voters when data changes', async () => {
    const { result, rerender } = renderHook(
      (props) => useWaveTopVoters(props),
      {
        wrapper: createWrapper,
        initialProps: defaultProps,
      }
    );

    await waitFor(() => {
      expect(result.current.voters).toEqual(mockVotersPage.data);
    });

    // Update data and rerender
    const newMockData = {
      data: [{ id: '3', handle: 'voter3', rating: 15 }],
      next: null,
      count: 1,
    };

    mockCommonApiFetch.mockResolvedValue(newMockData);

    rerender({ ...defaultProps, sortDirection: 'DESC' as const });

    await waitFor(() => {
      expect(result.current.voters).toEqual(newMockData.data);
    });
  });

  it('prefetches data on mount', () => {
    renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: createWrapper,
    });

    // Should call prefetchInfiniteQuery which triggers commonApiFetch
    expect(mockCommonApiFetch).toHaveBeenCalled();
  });

  it('handles complex pagination scenario with multiple pages', async () => {
    const pages = [
      { data: [{ id: '1', handle: 'voter1', rating: 10 }], next: true, count: 3 },
      { data: [{ id: '2', handle: 'voter2', rating: 8 }], next: true, count: 3 },
      { data: [{ id: '3', handle: 'voter3', rating: 6 }], next: null, count: 3 },
    ];

    // Create fresh query client for this test
    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
    });

    const freshWrapper = ({ children }: { children: React.ReactNode }) => 
      React.createElement(QueryClientProvider, { client: freshQueryClient }, children);

    mockCommonApiFetch
      .mockReset()
      .mockResolvedValueOnce(pages[0])
      .mockResolvedValueOnce(pages[1])
      .mockResolvedValueOnce(pages[2]);

    const { result } = renderHook(() => useWaveTopVoters(defaultProps), {
      wrapper: freshWrapper,
    });

    await waitFor(() => {
      expect(result.current.voters.length).toBeGreaterThan(0);
      expect(result.current.voters).toContainEqual(pages[0]?.data[0]);
    });

    // Fetch all pages
    await result.current.fetchNextPage();
    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.voters).toEqual([
        ...pages[0]?.data,
        ...pages[1]?.data,
        ...pages[2]?.data,
      ]);
    });
  });
});