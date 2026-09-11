import { renderHook } from "@testing-library/react";
import { useUnreadDmDrops } from "@/hooks/useUnreadDmDrops";

const useDmUnreadSummaryMock = jest.fn();

jest.mock("@/services/dm-unread/DmUnreadStateProvider", () => ({
  useDmUnreadSummary: () => useDmUnreadSummaryMock(),
}));

describe("useUnreadDmDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDmUnreadSummaryMock.mockReturnValue({
      totalUnreadMessages: 3,
      unreadConversationCount: 2,
      hasUnread: true,
    });
  });

  it("exposes the canonical unread message total without starting a query", () => {
    const { result } = renderHook(() => useUnreadDmDrops("alice"));

    expect(result.current).toEqual({
      unreadDmDrops: { count: 3 },
      unreadDmDropsCount: 3,
      haveUnreadDmDrops: true,
    });
    expect(useDmUnreadSummaryMock).toHaveBeenCalledTimes(1);
  });

  it("reports the canonical empty state", () => {
    useDmUnreadSummaryMock.mockReturnValue({
      totalUnreadMessages: 0,
      unreadConversationCount: 0,
      hasUnread: false,
    });

    const { result } = renderHook(() => useUnreadDmDrops(null));

    expect(result.current).toEqual({
      unreadDmDrops: undefined,
      unreadDmDropsCount: 0,
      haveUnreadDmDrops: false,
    });
  });
});
