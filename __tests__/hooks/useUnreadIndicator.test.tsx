import { renderHook } from "@testing-library/react";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";

const mockUseUnreadNotifications = jest.fn();
jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: (handle: string | null) =>
    mockUseUnreadNotifications(handle),
}));

const mockUseUnreadDmDrops = jest.fn();
jest.mock("@/hooks/useUnreadDmDrops", () => ({
  useUnreadDmDrops: (handle: string | null) => mockUseUnreadDmDrops(handle),
}));

const mockUseDmUnreadCountOptional = jest.fn();
jest.mock("@/contexts/wave/DmUnreadCountContext", () => ({
  useDmUnreadCountOptional: () => mockUseDmUnreadCountOptional(),
}));

describe("useUnreadIndicator", () => {
  beforeEach(() => {
    mockUseUnreadNotifications.mockReset();
    mockUseUnreadDmDrops.mockReset();
    mockUseDmUnreadCountOptional.mockReset();
    mockUseDmUnreadCountOptional.mockReturnValue(null);
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: false,
      unreadDmDrops: undefined,
      unreadDmDropsCount: 0,
    });
  });

  it("returns false when no handle", () => {
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: true,
    });
    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "notifications", handle: null })
    );
    expect(result.current).toEqual({ hasUnread: false, unreadCount: 0 });
  });

  it("handles notifications type", () => {
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: true,
    });
    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "notifications", handle: "me" })
    );
    expect(result.current).toEqual({ hasUnread: true, unreadCount: 1 });
    expect(mockUseDmUnreadCountOptional).toHaveBeenCalledTimes(1);
  });

  it("handles messages type from the unread summary without a stream provider", () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: true,
      unreadDmDrops: { count: 2 },
      unreadDmDropsCount: 2,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });
    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "messages", handle: "me" })
    );
    expect(result.current).toEqual({ hasUnread: true, unreadCount: 2 });
    expect(mockUseDmUnreadCountOptional).toHaveBeenCalledTimes(1);
  });

  it("merges the continuously mounted realtime DM unread state", () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: false,
      unreadDmDrops: { count: 0 },
      unreadDmDropsCount: 0,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });

    mockUseDmUnreadCountOptional.mockReturnValue(1);

    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "messages", handle: "me" })
    );

    expect(result.current).toEqual({ hasUnread: true, unreadCount: 1 });
  });

  it("uses a best-effort count without double-counting overlapping sources", () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: true,
      unreadDmDrops: { count: 2 },
      unreadDmDropsCount: 2,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });

    mockUseDmUnreadCountOptional.mockReturnValue(4);

    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "messages", handle: "me" })
    );

    expect(result.current).toEqual({ hasUnread: true, unreadCount: 4 });
  });

  it("uses the coordinated realtime count when a mounted summary diverges", () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: true,
      unreadDmDrops: { count: 5 },
      unreadDmDropsCount: 5,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });

    mockUseDmUnreadCountOptional.mockReturnValue(3);

    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "messages", handle: "me" })
    );

    expect(result.current).toEqual({ hasUnread: true, unreadCount: 3 });
  });

  it("does not let a stale aggregate reopen a locally cleared indicator", () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: true,
      unreadDmDrops: { count: 1 },
      unreadDmDropsCount: 1,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });
    mockUseDmUnreadCountOptional.mockReturnValue(0);

    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "messages", handle: "me" })
    );

    expect(result.current).toEqual({ hasUnread: false, unreadCount: 0 });
  });

  it("normalizes a missing summary count before rendering the badge", () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: false,
      unreadDmDrops: undefined,
      unreadDmDropsCount: undefined,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });

    mockUseDmUnreadCountOptional.mockReturnValue(1);

    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "messages", handle: "me" })
    );

    expect(result.current).toEqual({ hasUnread: true, unreadCount: 1 });
  });
});
