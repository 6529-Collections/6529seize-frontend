import { renderHook } from '@testing-library/react';
import { useUnreadIndicator } from '@/hooks/useUnreadIndicator';

const mockUseUnreadNotifications = jest.fn();
jest.mock('@/hooks/useUnreadNotifications', () => ({
  useUnreadNotifications: (handle: string | null) => mockUseUnreadNotifications(handle)
}));

const mockUseUnreadDmDrops = jest.fn();
jest.mock('@/hooks/useUnreadDmDrops', () => ({
  useUnreadDmDrops: (handle: string | null) => mockUseUnreadDmDrops(handle)
}));

const mockUseMyStream = jest.fn();
jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStream: () => mockUseMyStream()
}));

describe('useUnreadIndicator', () => {
  beforeEach(() => {
    mockUseUnreadNotifications.mockReset();
    mockUseUnreadDmDrops.mockReset();
    mockUseMyStream.mockReset();
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: false,
      unreadDmDrops: undefined,
      unreadDmDropsCount: 0
    });
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

  it('keeps local message unread state when the endpoint count is zero', () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: false,
      unreadDmDrops: { count: 0 },
      unreadDmDropsCount: 0
    });
    mockUseUnreadNotifications.mockReturnValue({ haveUnreadNotifications: false });
    mockUseMyStream.mockReturnValue({ directMessages: { list: [{ unreadDropsCount: 1 }] } });

    const { result } = renderHook(() => useUnreadIndicator({ type: 'messages', handle: 'me' }));

    expect(result.current.hasUnread).toBe(true);
  });
});
