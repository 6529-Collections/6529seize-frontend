import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { useDropContent } from '../../../../components/waves/drops/useDropContent';
import { ApiDrop } from '../../../../generated/models/ApiDrop';
import { commonApiFetch } from '../../../../services/api/common-api';

// Mock dependencies
jest.mock('../../../../services/api/common-api');
jest.mock('../../../../components/waves/drops/media-utils', () => ({
  isVideoMimeType: (mimeType: string) => mimeType?.startsWith('video/'),
  processContent: (content: string, apiMedia: any[]) => ({
    segments: [{ type: 'text', content }],
    apiMedia,
  }),
}));

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDropContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDrop = {
    id: 'drop-123',
    serial_no: 1,
    author: {
      id: 'author-1',
      handle: 'testuser',
      normalised_handle: 'testuser',
      primary_wallet: '0x123',
      pfp: null,
      cic: { rating: 100, contributor_count: 5 },
      rep: { rating: 200, contributor_count: 10 },
      tdh: 1000,
      level: 5,
      classification: 'HUMAN',
      sub_classification: null,
      created_at: Date.now(),
    },
    parts: [
      {
        part_id: 1,
        content: 'Test content',
        quoted_drop: null,
        media: [
          {
            url: 'https://example.com/image.jpg',
            mime_type: 'image/jpeg',
          },
        ],
      },
      {
        part_id: 2,
        content: 'Another part',
        quoted_drop: null,
        media: [
          {
            url: 'https://example.com/video.mp4',
            mime_type: 'video/mp4',
          },
        ],
      },
    ],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
    created_at: Date.now(),
    updated_at: Date.now(),
    context_profile_context: null,
  } as unknown as ApiDrop;

  describe('Basic functionality', () => {
    it('returns loading state initially when no maybeDrop provided', () => {
      mockCommonApiFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, null),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.drop).toBe(null);
      expect(result.current.content.segments).toEqual([
        { type: 'text', content: 'Loading...' },
      ]);
    });

    it('uses initial data when maybeDrop is provided', () => {
      const { result } = renderHook(
        () => useDropContent('drop-123', 1, mockDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.drop).toEqual(mockDrop);
      expect(result.current.content.segments).toEqual([
        { type: 'text', content: 'Test content' },
      ]);
    });
  });

  describe('Content processing', () => {
    it('processes text content correctly', () => {
      const { result } = renderHook(
        () => useDropContent('drop-123', 1, mockDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.segments).toEqual([
        { type: 'text', content: 'Test content' },
      ]);
      expect(result.current.content.apiMedia).toEqual([
        {
          alt: 'Media',
          url: 'https://example.com/image.jpg',
          type: 'image',
        },
      ]);
    });

    it('processes video media correctly', () => {
      const { result } = renderHook(
        () => useDropContent('drop-123', 2, mockDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.apiMedia).toEqual([
        {
          alt: 'Media',
          url: 'https://example.com/video.mp4',
          type: 'video',
        },
      ]);
    });

    it('handles media-only content (no text)', () => {
      const mediaOnlyDrop = {
        ...mockDrop,
        parts: [
          {
            part_id: 1,
            content: '',
            quoted_drop: null,
            media: [
              {
                url: 'https://example.com/image.jpg',
                mime_type: 'image/jpeg',
              },
            ],
          },
        ],
      };

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, mediaOnlyDrop as unknown as ApiDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.segments).toEqual([]);
      expect(result.current.content.apiMedia).toEqual([
        {
          alt: 'Media',
          url: 'https://example.com/image.jpg',
          type: 'image',
        },
      ]);
    });

    it('handles empty media with no content', () => {
      const emptyDrop = {
        ...mockDrop,
        parts: [
          {
            part_id: 1,
            content: '',
            quoted_drop: null,
            media: [],
          },
        ],
      };

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, emptyDrop as unknown as ApiDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.segments).toEqual([
        { type: 'text', content: 'Media' },
      ]);
      expect(result.current.content.apiMedia).toEqual([]);
    });

    it('returns empty content when part is not found', () => {
      const { result } = renderHook(
        () => useDropContent('drop-123', 999, mockDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.segments).toEqual([]);
      expect(result.current.content.apiMedia).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('handles drop not found error', async () => {
      const error = new Error('Drop 12345678-1234-1234-1234-123456789012 not found');
      mockCommonApiFetch.mockRejectedValue(error);

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, null),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.content.segments).toEqual([
          { type: 'text', content: 'Error loading drop' },
        ]);
      });
    });

    it('handles generic error', async () => {
      const error = new Error('Network error');
      mockCommonApiFetch.mockRejectedValue(error);

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, null),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.content.segments).toEqual([
          { type: 'text', content: 'Error loading drop' },
        ]);
      });
    });

    it('handles null drop gracefully', () => {
      mockCommonApiFetch.mockResolvedValue(null);

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, null),
        { wrapper: createWrapper() }
      );

      expect(result.current.drop).toBe(null);
    });
  });

  describe('Query behavior', () => {
    it('disables query when maybeDrop is provided', () => {
      renderHook(
        () => useDropContent('drop-123', 1, mockDrop),
        { wrapper: createWrapper() }
      );

      expect(mockCommonApiFetch).not.toHaveBeenCalled();
    });

    it('enables query when maybeDrop is null', async () => {
      mockCommonApiFetch.mockResolvedValue(mockDrop);

      renderHook(
        () => useDropContent('drop-123', 1, null),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'drops/drop-123',
        });
      });
    });

    it('uses correct query key', async () => {
      mockCommonApiFetch.mockResolvedValue(mockDrop);

      renderHook(
        () => useDropContent('drop-123', 1, null),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Content updates', () => {
    it('updates content when dropPartId changes', () => {
      const { result, rerender } = renderHook(
        ({ dropPartId }) => useDropContent('drop-123', dropPartId, mockDrop),
        {
          wrapper: createWrapper(),
          initialProps: { dropPartId: 1 },
        }
      );

      expect(result.current.content.segments).toEqual([
        { type: 'text', content: 'Test content' },
      ]);

      rerender({ dropPartId: 2 });

      expect(result.current.content.segments).toEqual([
        { type: 'text', content: 'Another part' },
      ]);
    });

    it('provides consistent content when maybeDrop is static', () => {
      const { result } = renderHook(
        () => useDropContent('drop-123', 1, mockDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.segments).toEqual([
        { type: 'text', content: 'Test content' },
      ]);

      // Verify that when maybeDrop is provided, content is immediately available
      expect(result.current.isLoading).toBe(false);
      expect(result.current.drop).toEqual(mockDrop);
    });
  });

  describe('Media handling', () => {
    it('handles missing media array', () => {
      const dropWithoutMedia = {
        ...mockDrop,
        parts: [
          {
            part_id: 1,
            content: 'Content without media',
            quoted_drop: null,
            media: undefined,
          },
        ],
      };

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, dropWithoutMedia as any),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.apiMedia).toEqual([]);
    });

    it('processes multiple media items', () => {
      const multiMediaDrop = {
        ...mockDrop,
        parts: [
          {
            part_id: 1,
            content: 'Multi media content',
            quoted_drop: null,
            media: [
              {
                url: 'https://example.com/image1.jpg',
                mime_type: 'image/jpeg',
              },
              {
                url: 'https://example.com/video1.mp4',
                mime_type: 'video/mp4',
              },
            ],
          },
        ],
      };

      const { result } = renderHook(
        () => useDropContent('drop-123', 1, multiMediaDrop as unknown as ApiDrop),
        { wrapper: createWrapper() }
      );

      expect(result.current.content.apiMedia).toEqual([
        {
          alt: 'Media',
          url: 'https://example.com/image1.jpg',
          type: 'image',
        },
        {
          alt: 'Media',
          url: 'https://example.com/video1.mp4',
          type: 'video',
        },
      ]);
    });
  });
});