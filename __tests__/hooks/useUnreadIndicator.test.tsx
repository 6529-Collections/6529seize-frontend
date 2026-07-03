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

const mockUseMyStream = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => mockUseMyStream(),
}));

describe("useUnreadIndicator", () => {
  beforeEach(() => {
    mockUseUnreadNotifications.mockReset();
    mockUseUnreadDmDrops.mockReset();
    mockUseMyStream.mockReset();
    mockUseMyStream.mockImplementation(() => {
      throw new Error("useUnreadIndicator should not subscribe to MyStream");
    });
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
    expect(result.current.hasUnread).toBe(false);
  });

  it("handles notifications type", () => {
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: true,
    });
    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "notifications", handle: "me" })
    );
    expect(result.current.hasUnread).toBe(true);
    expect(mockUseMyStream).not.toHaveBeenCalled();
  });

  it("handles messages type from the unread summary without MyStream", () => {
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
    expect(result.current.hasUnread).toBe(true);
    expect(mockUseMyStream).not.toHaveBeenCalled();
  });

  it("can merge already-mounted local message unread state when provided", () => {
    mockUseUnreadDmDrops.mockReturnValue({
      haveUnreadDmDrops: false,
      unreadDmDrops: { count: 0 },
      unreadDmDropsCount: 0,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });

    const { result } = renderHook(() =>
      useUnreadIndicator({
        type: "messages",
        handle: "me",
        localDirectMessages: [{ unreadDropsCount: 1 }],
      })
    );

    expect(result.current.hasUnread).toBe(true);
    expect(mockUseMyStream).not.toHaveBeenCalled();
  });
});
