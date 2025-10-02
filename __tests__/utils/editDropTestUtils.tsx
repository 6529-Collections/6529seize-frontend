import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useDropUpdateMutation } from '@/hooks/drops/useDropUpdateMutation';
import { ApiDrop } from '@/generated/models/ApiDrop';
import { ApiUpdateDropRequest } from '@/generated/models/ApiUpdateDropRequest';
import { ApiDropType } from '@/generated/models/ApiDropType';

// Common mocks
export const commonMocks = {
  // Mock the API
  setupApiMock: () => {
    jest.mock('@/services/api/common-api', () => ({
      commonApiPost: jest.fn(),
    }));
  },

  // Mock the MyStreamContext
  setupMyStreamMock: () => {
    jest.mock('@/contexts/wave/MyStreamContext', () => ({
      useMyStream: jest.fn(() => ({
        processIncomingDrop: jest.fn(),
      })),
    }));
  },

  // Mock all common contexts
  setupAllCommonMocks: () => {
    commonMocks.setupApiMock();
    commonMocks.setupMyStreamMock();
  }
};

// Common test data factories
export const createMockDrop = (overrides: Partial<ApiDrop> = {}): ApiDrop => ({
  id: 'drop-123',
  serial_no: 1,
  author: { handle: 'testuser' } as any,
  wave: { id: 'wave-123' } as any,
  created_at: Date.now() - 60000, // 1 minute ago (within edit window)
  updated_at: null,
  title: null,
  parts: [{ 
    part_id: 1, 
    content: 'Original content', 
    media: [],
    quoted_drop: null,
    quotes_count: 0
  }],
  parts_count: 1,
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  rating: 0,
  realtime_rating: 0,
  rating_prediction: 0,
  top_raters: [],
  raters_count: 0,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  reply_to: undefined,
  rank: null,
  drop_type: ApiDropType.Chat,
  type: 'FULL' as any,
  stableKey: 'drop-123',
  stableHash: 'hash-123',
  ...overrides
});

export const createMockRequest = (overrides: Partial<ApiUpdateDropRequest> = {}): ApiUpdateDropRequest => ({
  content: 'Updated content',
  mentioned_users: [],
  ...overrides
} as any);

// Common test setup utilities
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const createTestWrapper = (mockSetToast: jest.Mock, mockInvalidateDrops: jest.Mock, queryClient: QueryClient) => {
  const authContextValue = {
    setToast: mockSetToast,
  } as any;

  const reactQueryContextValue = {
    invalidateDrops: mockInvalidateDrops,
  } as any;

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContextValue}>
        <ReactQueryWrapperContext.Provider value={reactQueryContextValue}>
          {children}
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

// Common expectation utilities
export const expectGenericErrorToast = async (mockSetToast: jest.Mock) => {
  await waitFor(() => {
    expect(mockSetToast).toHaveBeenCalledWith({
      message: 'Failed to update drop. Please try again.',
      type: 'error',
    });
  });
};

export const expectTimeLimitErrorToast = async (mockSetToast: jest.Mock) => {
  await waitFor(() => {
    expect(mockSetToast).toHaveBeenCalledWith({
      message: 'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.',
      type: 'error',
    });
  });
};

export const expectSuccessToast = async (mockSetToast: jest.Mock) => {
  await waitFor(() => {
    expect(mockSetToast).toHaveBeenCalledWith({
      message: 'Drop updated successfully',
      type: 'success',
    });
  });
};

// Hook testing utilities
export const setupDropUpdateMutationTest = (
  mockedCommonApiPost: jest.MockedFunction<any>,
  mockSetToast: jest.Mock,
  mockInvalidateDrops: jest.Mock,
  queryClient: QueryClient
) => {
  const setupErrorTest = (error: any, customRequest?: Partial<ApiUpdateDropRequest>) => {
    mockedCommonApiPost.mockRejectedValue(error);
    const wrapper = createTestWrapper(mockSetToast, mockInvalidateDrops, queryClient);
    const { result } = renderHook(() => useDropUpdateMutation(), { wrapper });
    
    return {
      result,
      triggerMutation: () => {
        const request = customRequest ? { ...createMockRequest(), ...customRequest } : createMockRequest();
        result.current.mutate({
          dropId: 'drop-123',
          request,
          currentDrop: createMockDrop(),
        });
      },
    };
  };

  return { setupErrorTest };
};

// Error creation utilities
export const createErrorWithStatus = (message: string, status: number) => {
  const error = new Error(message);
  (error as any).status = status;
  return error;
};

// Simplified test utilities - just extract the common data and functions
export const createSimpleErrorTest = (
  mockedCommonApiPost: jest.MockedFunction<any>,
  mockSetToast: jest.Mock,
  mockInvalidateDrops: jest.Mock,
  queryClient: QueryClient
) => {
  const wrapper = createTestWrapper(mockSetToast, mockInvalidateDrops, queryClient);
  
  return (error: any, customRequest?: Partial<ApiUpdateDropRequest>) => {
    mockedCommonApiPost.mockRejectedValue(error);
    const { result } = renderHook(() => useDropUpdateMutation(), { wrapper });
    
    const triggerMutation = () => {
      const request = customRequest ? { ...createMockRequest(), ...customRequest } : createMockRequest();
      result.current.mutate({
        dropId: 'drop-123',
        request,
        currentDrop: createMockDrop(),
      });
    };
    
    return { result, triggerMutation };
  };
};