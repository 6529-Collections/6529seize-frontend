import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDropUpdateMutation } from '@/hooks/drops/useDropUpdateMutation';
import type { ApiUpdateDropRequest } from '@/generated/models/ApiUpdateDropRequest';
import type { ApiDrop } from '@/generated/models/ApiDrop';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { ProcessIncomingDropType } from '@/contexts/wave/hooks/useWaveRealtimeUpdater';
import { commonApiPost } from '@/services/api/common-api';
import { useMyStream } from '@/contexts/wave/MyStreamContext';

// Mock the API module
jest.mock('@/services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

// Mock the MyStreamContext
jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStream: jest.fn(),
}));

const mockedCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;
const mockedUseMyStream = useMyStream as jest.MockedFunction<typeof useMyStream>;

type DropUpdateMutationParams = {
  dropId: string;
  request: ApiUpdateDropRequest;
  currentDrop: ApiDrop;
};

// Test utilities
const createMockDrop = (overrides = {}): ApiDrop => ({
  id: 'drop-123',
  serial_no: 1,
  author: { handle: 'testuser' },
  wave: { id: 'wave-123' },
  created_at: Date.now(),
  updated_at: Date.now(),
  title: null,
  parts: [{ 
    part_id: 1, 
    content: 'Updated content', 
    media: [], 
    quoted_drop: null, 
    replies_count: 0, 
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
  reply_to: null,
  rank: null,
  drop_type: 'Chat' as any,
  type: 'FULL' as any,
  stableKey: 'drop-123',
  stableHash: 'hash-123',
  ...overrides
});

const createMockRequest = (overrides = {}): ApiUpdateDropRequest => ({
  content: 'Updated content',
  mentioned_users: [],
  ...overrides
});

interface TestHookResult {
  result: ReturnType<typeof renderHook<ReturnType<typeof useDropUpdateMutation>, any>>['result'];
  mockSetToast: jest.Mock;
  mockInvalidateDrops: jest.Mock;
  mockProcessIncomingDrop: jest.Mock;
}

const setupTestHook = (): TestHookResult => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const mockSetToast = jest.fn();
  const mockInvalidateDrops = jest.fn();
  const mockProcessIncomingDrop = jest.fn();

  mockedUseMyStream.mockReturnValue({
    processIncomingDrop: mockProcessIncomingDrop,
  } as any);

  const createWrapper = () => {
    const authContextValue = { setToast: mockSetToast } as any;
    const reactQueryContextValue = { invalidateDrops: mockInvalidateDrops } as any;

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

  const { result } = renderHook(() => useDropUpdateMutation(), {
    wrapper: createWrapper(),
  });

  return { result, mockSetToast, mockInvalidateDrops, mockProcessIncomingDrop };
};

const executeMutation = async (result: any, params?: Partial<DropUpdateMutationParams>) => {
  const mockDrop = createMockDrop();
  const mockRequest = createMockRequest();
  const mockParams: DropUpdateMutationParams = {
    dropId: 'drop-123',
    request: mockRequest,
    currentDrop: mockDrop,
    ...params
  };

  result.current.mutate(mockParams);
  return { mockDrop, mockRequest, mockParams };
};

describe('useDropUpdateMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful mutation', () => {
    it('should successfully update a drop', async () => {
      const { result } = setupTestHook();
      const { mockDrop, mockRequest } = await executeMutation(result);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedCommonApiPost).toHaveBeenCalledWith({
        endpoint: 'drops/drop-123',
        body: mockRequest,
      });
    });

    it('should show success toast on successful update', async () => {
      const { result, mockSetToast } = setupTestHook();
      const { mockDrop } = await executeMutation(result);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Drop updated successfully',
          type: 'success',
        });
      });
    });

    it('should update the stream with the updated drop', async () => {
      const { result, mockProcessIncomingDrop } = setupTestHook();
      const { mockDrop } = await executeMutation(result);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      await waitFor(() => {
        expect(mockProcessIncomingDrop).toHaveBeenCalledWith(
          mockDrop,
          ProcessIncomingDropType.DROP_INSERT
        );
      });
    });

    it('should invalidate drops queries after successful update', async () => {
      const { result, mockInvalidateDrops } = setupTestHook();
      const { mockDrop } = await executeMutation(result);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      await waitFor(() => {
        expect(mockInvalidateDrops).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling', () => {
    const testErrorScenario = async (error: any, expectedMessage = 'Failed to update drop. Please try again.') => {
      const { result, mockSetToast } = setupTestHook();
      mockedCommonApiPost.mockRejectedValue(error);
      await executeMutation(result);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockSetToast).toHaveBeenCalledWith({
        message: expectedMessage,
        type: 'error',
      });
    };

    it('should handle generic API errors', async () => {
      await testErrorScenario(new Error('API Error'));
    });

    it('should handle time limit violation errors', async () => {
      await testErrorScenario(
        new Error('This drop can\'t be edited after 5 minutes'),
        'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.'
      );
    });

    it('should handle non-Error objects', async () => {
      await testErrorScenario('String error message');
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const apiError = new Error('API Error');
      
      await testErrorScenario(apiError);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update drop:', apiError);
      consoleSpy.mockRestore();
    });
  });

  describe('Context dependencies', () => {
    it('should handle missing MyStream context gracefully', async () => {
      mockedUseMyStream.mockReturnValue(null);
      const { result, mockSetToast, mockInvalidateDrops } = setupTestHook();
      const { mockDrop } = await executeMutation(result);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Drop updated successfully',
        type: 'success',
      });
      expect(mockInvalidateDrops).toHaveBeenCalled();
    });

    it('should handle missing processIncomingDrop method', async () => {
      mockedUseMyStream.mockReturnValue({} as any);
      const { result, mockSetToast } = setupTestHook();
      const { mockDrop } = await executeMutation(result);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Drop updated successfully',
        type: 'success',
      });
    });
  });

  describe('Loading states', () => {
    it('should track loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockedCommonApiPost.mockReturnValue(pendingPromise);
      const { result } = setupTestHook();
      const { mockDrop } = await executeMutation(result);

      expect(result.current.isPending).toBe(false);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePromise!(mockDrop);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('Mutation data', () => {
    it('should return updated drop data on success', async () => {
      const { result } = setupTestHook();
      const { mockDrop } = await executeMutation(result);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDrop);
      });
    });

    it('should provide error data on failure', async () => {
      const apiError = new Error('API Error');
      const { result } = setupTestHook();
      mockedCommonApiPost.mockRejectedValue(apiError);
      await executeMutation(result);

      await waitFor(() => {
        expect(result.current.error).toEqual(apiError);
      });
    });
  });
});
