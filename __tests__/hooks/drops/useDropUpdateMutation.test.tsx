import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDropUpdateMutation, DropUpdateMutationParams } from '../../../hooks/drops/useDropUpdateMutation';
import { ApiUpdateDropRequest } from '../../../generated/models/ApiUpdateDropRequest';
import { ApiDrop } from '../../../generated/models/ApiDrop';
import { AuthContext } from '../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../components/react-query-wrapper/ReactQueryWrapper';
import { ProcessIncomingDropType } from '../../../contexts/wave/hooks/useWaveRealtimeUpdater';

// Mock the API module
jest.mock('../../../services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

// Mock the MyStreamContext
jest.mock('../../../contexts/wave/MyStreamContext', () => ({
  useMyStream: jest.fn(),
}));

import { commonApiPost } from '../../../services/api/common-api';
import { useMyStream } from '../../../contexts/wave/MyStreamContext';

const mockedCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;
const mockedUseMyStream = useMyStream as jest.MockedFunction<typeof useMyStream>;

describe('useDropUpdateMutation', () => {
  let queryClient: QueryClient;
  let mockSetToast: jest.Mock;
  let mockInvalidateDrops: jest.Mock;
  let mockProcessIncomingDrop: jest.Mock;

  const mockDrop: ApiDrop = {
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
    stableHash: 'hash-123'
  };

  const mockRequest: ApiUpdateDropRequest = {
    content: 'Updated content',
    mentioned_users: []
  };

  const mockParams: DropUpdateMutationParams = {
    dropId: 'drop-123',
    request: mockRequest,
    currentDrop: mockDrop
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    mockSetToast = jest.fn();
    mockInvalidateDrops = jest.fn();
    mockProcessIncomingDrop = jest.fn();

    mockedUseMyStream.mockReturnValue({
      processIncomingDrop: mockProcessIncomingDrop,
    } as any);

    jest.clearAllMocks();
  });

  const createWrapper = () => {
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

  describe('Successful mutation', () => {
    it('should successfully update a drop', async () => {
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedCommonApiPost).toHaveBeenCalledWith({
        endpoint: 'drops/drop-123',
        body: mockRequest,
      });
    });

    it('should show success toast on successful update', async () => {
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Drop updated successfully',
          type: 'success',
        });
      });
    });

    it('should update the stream with the updated drop', async () => {
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(mockProcessIncomingDrop).toHaveBeenCalledWith(
          mockDrop,
          ProcessIncomingDropType.DROP_INSERT
        );
      });
    });

    it('should invalidate drops queries after successful update', async () => {
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(mockInvalidateDrops).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle generic API errors', async () => {
      const genericError = new Error('API Error');
      mockedCommonApiPost.mockRejectedValue(genericError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Failed to update drop. Please try again.',
        type: 'error',
      });
    });

    it('should handle time limit violation errors', async () => {
      const timeLimitError = new Error('This drop can\'t be edited after 5 minutes');
      mockedCommonApiPost.mockRejectedValue(timeLimitError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.',
        type: 'error',
      });
    });

    it('should handle non-Error objects', async () => {
      const stringError = 'String error message';
      mockedCommonApiPost.mockRejectedValue(stringError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Failed to update drop. Please try again.',
        type: 'error',
      });
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const apiError = new Error('API Error');
      mockedCommonApiPost.mockRejectedValue(apiError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update drop:', apiError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Context dependencies', () => {
    it('should handle missing MyStream context gracefully', async () => {
      mockedUseMyStream.mockReturnValue(null);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should not call processIncomingDrop when context is null
      expect(mockProcessIncomingDrop).not.toHaveBeenCalled();
      
      // Should still show success toast and invalidate queries
      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Drop updated successfully',
        type: 'success',
      });
      expect(mockInvalidateDrops).toHaveBeenCalled();
    });

    it('should handle missing processIncomingDrop method', async () => {
      mockedUseMyStream.mockReturnValue({} as any);
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should not throw when processIncomingDrop is undefined
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

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(mockParams);

      // Need to wait for the mutation to start
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
      mockedCommonApiPost.mockResolvedValue(mockDrop);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDrop);
      });
    });

    it('should provide error data on failure', async () => {
      const apiError = new Error('API Error');
      mockedCommonApiPost.mockRejectedValue(apiError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockParams);

      await waitFor(() => {
        expect(result.current.error).toEqual(apiError);
      });
    });
  });
});