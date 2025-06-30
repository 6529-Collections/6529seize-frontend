import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDropUpdateMutation } from '../../hooks/drops/useDropUpdateMutation';
import { AuthContext } from '../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../components/react-query-wrapper/ReactQueryWrapper';
import { commonApiPost } from '../../services/api/common-api';
import { ApiDrop } from '../../generated/models/ApiDrop';
import { ApiUpdateDropRequest } from '../../generated/models/ApiUpdateDropRequest';

// Mock the API
jest.mock('../../services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

// Mock the MyStreamContext
jest.mock('../../contexts/wave/MyStreamContext', () => ({
  useMyStream: jest.fn(() => ({
    processIncomingDrop: jest.fn(),
  })),
}));

const mockedCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;

describe('Edit Drop Error Scenarios', () => {
  let queryClient: QueryClient;
  let mockSetToast: jest.Mock;
  let mockInvalidateDrops: jest.Mock;

  const mockDrop: ApiDrop = {
    id: 'drop-123',
    serial_no: 1,
    author: { handle: 'testuser' },
    wave: { id: 'wave-123' },
    created_at: Date.now(),
    updated_at: null,
    title: null,
    parts: [{ 
      part_id: 1, 
      content: 'Original content', 
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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    mockSetToast = jest.fn();
    mockInvalidateDrops = jest.fn();

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

  describe('Time Limit Violations', () => {
    it('should handle exact time limit error message', async () => {
      const timeLimitError = new Error("This drop can't be edited after 5 minutes");
      mockedCommonApiPost.mockRejectedValue(timeLimitError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.',
          type: 'error',
        });
      });
    });

    it('should handle variation of time limit error message', async () => {
      const timeLimitError = new Error("Drop can't be edited after 5 minutes have passed");
      mockedCommonApiPost.mockRejectedValue(timeLimitError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.',
          type: 'error',
        });
      });
    });

    it('should handle server response with time limit in different format', async () => {
      const timeLimitError = new Error("Edit time limit exceeded - can't be edited after creation");
      mockedCommonApiPost.mockRejectedValue(timeLimitError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.',
          type: 'error',
        });
      });
    });
  });

  describe('Network Failures', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockedCommonApiPost.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle connection refused errors', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.name = 'NetworkError';
      mockedCommonApiPost.mockRejectedValue(connectionError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle fetch abort errors', async () => {
      const abortError = new DOMException('Request was aborted', 'AbortError');
      mockedCommonApiPost.mockRejectedValue(abortError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle offline scenarios', async () => {
      const offlineError = new Error('Failed to fetch');
      mockedCommonApiPost.mockRejectedValue(offlineError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });
  });

  describe('API Rate Limiting', () => {
    it('should handle 429 Too Many Requests error', async () => {
      const rateLimitError = new Error('Too Many Requests');
      (rateLimitError as any).status = 429;
      mockedCommonApiPost.mockRejectedValue(rateLimitError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle rate limit with retry-after header info', async () => {
      const rateLimitError = new Error('Rate limit exceeded. Try again in 60 seconds.');
      mockedCommonApiPost.mockRejectedValue(rateLimitError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });
  });

  describe('Permission and Authorization Errors', () => {
    it('should handle 401 Unauthorized error', async () => {
      const unauthorizedError = new Error('Unauthorized');
      (unauthorizedError as any).status = 401;
      mockedCommonApiPost.mockRejectedValue(unauthorizedError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle 403 Forbidden error', async () => {
      const forbiddenError = new Error('Forbidden - You do not have permission to edit this drop');
      (forbiddenError as any).status = 403;
      mockedCommonApiPost.mockRejectedValue(forbiddenError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle ownership validation error', async () => {
      const ownershipError = new Error('You can only edit your own drops');
      mockedCommonApiPost.mockRejectedValue(ownershipError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });
  });

  describe('Content Validation Errors', () => {
    it('should handle content too long error', async () => {
      const contentError = new Error('Content exceeds maximum allowed length');
      mockedCommonApiPost.mockRejectedValue(contentError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: { ...mockRequest, content: 'A'.repeat(10000) },
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle invalid mention error', async () => {
      const mentionError = new Error('Invalid mention format');
      mockedCommonApiPost.mockRejectedValue(mentionError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle empty content error', async () => {
      const emptyContentError = new Error('Content cannot be empty');
      mockedCommonApiPost.mockRejectedValue(emptyContentError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: { ...mockRequest, content: '' },
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });
  });

  describe('Concurrent Edit Conflicts', () => {
    it('should handle concurrent modification error', async () => {
      const conflictError = new Error('Drop has been modified by another user');
      (conflictError as any).status = 409;
      mockedCommonApiPost.mockRejectedValue(conflictError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle version mismatch error', async () => {
      const versionError = new Error('Drop version mismatch - please refresh and try again');
      mockedCommonApiPost.mockRejectedValue(versionError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });
  });

  describe('Server Errors', () => {
    it('should handle 500 Internal Server Error', async () => {
      const serverError = new Error('Internal Server Error');
      (serverError as any).status = 500;
      mockedCommonApiPost.mockRejectedValue(serverError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle 502 Bad Gateway error', async () => {
      const gatewayError = new Error('Bad Gateway');
      (gatewayError as any).status = 502;
      mockedCommonApiPost.mockRejectedValue(gatewayError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle 503 Service Unavailable error', async () => {
      const serviceError = new Error('Service Unavailable');
      (serviceError as any).status = 503;
      mockedCommonApiPost.mockRejectedValue(serviceError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });
  });

  describe('Unknown and Edge Case Errors', () => {
    it('should handle null error objects', async () => {
      mockedCommonApiPost.mockRejectedValue(null);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle undefined error objects', async () => {
      mockedCommonApiPost.mockRejectedValue(undefined);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle non-string, non-Error objects', async () => {
      const weirdError = { code: 'WEIRD_ERROR', details: 'Something unexpected' };
      mockedCommonApiPost.mockRejectedValue(weirdError);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });

    it('should handle promise rejection with number', async () => {
      mockedCommonApiPost.mockRejectedValue(404);

      const { result } = renderHook(() => useDropUpdateMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        dropId: 'drop-123',
        request: mockRequest,
        currentDrop: mockDrop,
      });

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith({
          message: 'Failed to update drop. Please try again.',
          type: 'error',
        });
      });
    });
  });
});