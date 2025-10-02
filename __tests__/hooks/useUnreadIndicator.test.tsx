import { renderHook } from '@testing-library/react';
import { useUnreadIndicator } from '@/hooks/useUnreadIndicator';

const mockUseUnreadNotifications = jest.fn();
jest.mock('@/hooks/useUnreadNotifications', () => ({
  useUnreadNotifications: (handle: string | null) => mockUseUnreadNotifications(handle)
}));

const mockUseMyStream = jest.fn();
jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStream: () => mockUseMyStream()
}));

describe('useUnreadIndicator', () => {
  beforeEach(() => {
    mockUseUnreadNotifications.mockReset();
    mockUseMyStream.mockReset();
  });

  it('returns false when no handle', () => {
    mockUseUnreadNotifications.mockReturnValue({ haveUnreadNotifications: true });
    mockUseMyStream.mockReturnValue({ directMessages: { list: [] } });
    const { result } = renderHook(() => useUnreadIndicator({ type: 'notifications', handle: null }));
    expect(result.current.hasUnread).toBe(false);
  });

  it('handles notifications type', () => {
    mockUseUnreadNotifications.mockReturnValue({ haveUnreadNotifications: true });
    mockUseMyStream.mockReturnValue({ directMessages: { list: [] } });
    const { result } = renderHook(() => useUnreadIndicator({ type: 'notifications', handle: 'me' }));
    expect(result.current.hasUnread).toBe(true);
  });

  it('handles messages type', () => {
    mockUseUnreadNotifications.mockReturnValue({ haveUnreadNotifications: false });
    mockUseMyStream.mockReturnValue({ directMessages: { list: [{ newDropsCount: { count: 2 } }] } });
    const { result } = renderHook(() => useUnreadIndicator({ type: 'messages', handle: 'me' }));
    expect(result.current.hasUnread).toBe(true);
  });
});
