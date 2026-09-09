import { renderHook } from "@testing-library/react";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";

const mockUseUnreadNotifications = jest.fn();
jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: (handle: string | null) =>
    mockUseUnreadNotifications(handle),
}));

const mockUseDmUnreadSummary = jest.fn();
jest.mock("@/services/dm-unread/DmUnreadStateProvider", () => ({
  useDmUnreadSummary: () => mockUseDmUnreadSummary(),
}));

const mockUseMyStream = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => mockUseMyStream(),
}));

describe("useUnreadIndicator", () => {
  beforeEach(() => {
    mockUseUnreadNotifications.mockReset();
    mockUseDmUnreadSummary.mockReset();
    mockUseMyStream.mockReset();
    mockUseMyStream.mockImplementation(() => {
      throw new Error("useUnreadIndicator should not subscribe to MyStream");
    });
    mockUseDmUnreadSummary.mockReturnValue({
      hasUnread: false,
      totalUnreadMessages: 0,
      unreadConversationCount: 0,
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
    mockUseDmUnreadSummary.mockReturnValue({
      hasUnread: true,
      totalUnreadMessages: 2,
      unreadConversationCount: 1,
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

  it("does not subscribe to or merge an independent MyStream count", () => {
    mockUseDmUnreadSummary.mockReturnValue({
      hasUnread: false,
      totalUnreadMessages: 0,
      unreadConversationCount: 0,
    });
    mockUseUnreadNotifications.mockReturnValue({
      haveUnreadNotifications: false,
    });

    const { result } = renderHook(() =>
      useUnreadIndicator({ type: "messages", handle: "me" })
    );

    expect(result.current.hasUnread).toBe(false);
    expect(mockUseMyStream).not.toHaveBeenCalled();
  });
});
