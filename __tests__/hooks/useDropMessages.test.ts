import { renderHook } from '@testing-library/react';
import { useDropMessages } from '../../hooks/useDropMessages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
});