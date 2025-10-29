import { ApiDrop } from '@/generated/models/ApiDrop';
import { ApiUpdateDropRequest } from '@/generated/models/ApiUpdateDropRequest';
import { ApiDropType } from '@/generated/models/ApiDropType';

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

// Error creation utilities
export const createErrorWithStatus = (message: string, status: number) => {
  const error = new Error(message);
  (error as any).status = status;
  return error;
};
