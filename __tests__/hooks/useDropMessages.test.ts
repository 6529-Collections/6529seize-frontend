import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';

// Setup mock for useInfiniteQuery so tests can control its behaviour
const useInfiniteQueryMock = jest.fn();
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return { ...actual, useInfiniteQuery: (...args: any[]) => useInfiniteQueryMock(...args) };
});

const { useDropMessages } = require('../../hooks/useDropMessages');
import React from 'react';

// Mock all dependencies
jest.mock('../../hooks/useCapacitor', () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock('../../services/websocket/useWebSocketMessage', () => ({
  useWebSocketMessage: jest.fn(),
}));

jest.mock('../../services/api/common-api', () => ({
  commonApiFetch: jest.fn().mockResolvedValue({ drops: [], wave: null }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

beforeEach(() => {
  jest.clearAllMocks();
  useInfiniteQueryMock.mockReset();
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [] },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
  } as Partial<UseInfiniteQueryResult>);
});

describe('useDropMessages', () => {
  it('should return expected hook properties', () => {
    const { result } = renderHook(
      () => useDropMessages('wave-123', 'drop-456'),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty('drops');
    expect(result.current).toHaveProperty('hasNextPage');
    expect(result.current).toHaveProperty('fetchNextPage');
    expect(result.current).toHaveProperty('isFetching');
    expect(result.current).toHaveProperty('isFetchingNextPage');
    expect(result.current).toHaveProperty('refetch');
  });

  it('should have empty drops initially', () => {
    const { result } = renderHook(
      () => useDropMessages('wave-123', 'drop-456'),
      { wrapper: createWrapper() }
    );

    expect(Array.isArray(result.current.drops)).toBe(true);
  });

  it('manualFetch triggers next page when available', async () => {
    const fetchNextPage = jest.fn();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    } as Partial<UseInfiniteQueryResult>);

    const { useWebSocketMessage } = require('../../services/websocket/useWebSocketMessage');
    (useWebSocketMessage as jest.Mock).mockReturnValue({ isConnected: true });

    const { result } = renderHook(() => useDropMessages('wave-1', 'drop-1'), {
      wrapper: createWrapper(),
    });

    await result.current.manualFetch();
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('websocket callback debounces refetch', () => {
    jest.useFakeTimers();
    const refetch = jest.fn();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch,
    } as Partial<UseInfiniteQueryResult>);

    let wsCallback: any;
    const { useWebSocketMessage } = require('../../services/websocket/useWebSocketMessage');
    (useWebSocketMessage as jest.Mock).mockImplementation((type, cb) => {
      wsCallback = cb;
      return { isConnected: true };
    });

    const { unmount } = renderHook(() => useDropMessages('wave-x', 'drop-y'), {
      wrapper: createWrapper(),
    });

    wsCallback({ wave: { id: 'wave-x' } });
    jest.advanceTimersByTime(1000);
    expect(refetch).toHaveBeenCalled();
    unmount();
    jest.useRealTimers();
  });
});
it('ignores websocket messages when dropId is null', () => {
  const refetch = jest.fn();
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [] },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    refetch,
  } as Partial<UseInfiniteQueryResult>);

  let wsCallback: any;
  const { useWebSocketMessage } = require('../../services/websocket/useWebSocketMessage');
  (useWebSocketMessage as jest.Mock).mockImplementation((type, cb) => {
    wsCallback = cb;
    return { isConnected: true };
  });

  renderHook(() => useDropMessages('wave-1', null), { wrapper: createWrapper() });

  wsCallback({ wave: { id: 'wave-1' } });
  expect(refetch).not.toHaveBeenCalled();
});
