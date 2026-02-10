import { renderHook } from '@testing-library/react';
import { useWaves } from '@/hooks/useWaves';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/components/auth/Auth';
import React from 'react';

// Mock dependencies
jest.mock('react-use', () => ({
  useDebounce: jest.fn(),
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn().mockResolvedValue({ waves: [], count: 0 }),
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
  
  const defaultAuthContext = {
    connectedProfile: null,
    activeProfileProxy: null,
    setTitle: jest.fn(),
    requestAuth: jest.fn(),
    setToast: jest.fn(),
    setActiveProfileProxy: jest.fn(),
    fetchingProfile: false,
    connectionStatus: 'DISCONNECTED' as any,
    receivedProfileProxies: [],
    showWaves: false,
    title: '',
  };
  
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        AuthContext.Provider,
        { value: defaultAuthContext },
        children
      )
    );
};

describe('useWaves', () => {
  it('should return expected hook properties', () => {
    const { result } = renderHook(
      () => useWaves({
        identity: null,
        waveName: null,
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty('waves');
    expect(result.current).toHaveProperty('hasNextPage');
    expect(result.current).toHaveProperty('fetchNextPage');
    expect(result.current).toHaveProperty('isFetching');
    expect(result.current).toHaveProperty('isFetchingNextPage');
  });
});