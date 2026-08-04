"use client";

import { useDmUnreadCountOptional } from "@/contexts/wave/DmUnreadCountContext";
import { useUnreadNotifications } from "./useUnreadNotifications";
import { useUnreadDmDrops } from "./useUnreadDmDrops";

type UnreadIndicatorType = "notifications" | "messages";

interface UseUnreadIndicatorProps {
  readonly type: UnreadIndicatorType;
  readonly handle: string | null;
}

interface UseUnreadIndicatorReturn {
  readonly hasUnread: boolean;
  /**
   * Best-effort count used by the quick-DM badge. The aggregate summary and
   * paged realtime list can overlap without per-wave summary attribution, so
   * their totals must not be added together.
   */
  readonly unreadCount: number;
}

const normalizeUnreadCount = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
};

export function useUnreadIndicator({
  type,
  handle,
}: UseUnreadIndicatorProps): UseUnreadIndicatorReturn {
  const localDmUnreadCount = useDmUnreadCountOptional();
  // Use existing notifications hook for notifications
  const { haveUnreadNotifications } = useUnreadNotifications(
    type === "notifications" ? handle : null
  );

  const { unreadDmDropsCount } = useUnreadDmDrops(
    type === "messages" ? handle : null
  );
  const normalizedUnreadDmDropsCount = normalizeUnreadCount(unreadDmDropsCount);

  // Only show indicators if user is authenticated
  if (!handle) {
    return { hasUnread: false, unreadCount: 0 };
  }

  if (type === "notifications") {
    return {
      hasUnread: haveUnreadNotifications,
      unreadCount: haveUnreadNotifications ? 1 : 0,
    };
  }

  const hasLocalDmState = localDmUnreadCount !== null;
  const localUnreadMessagesCount = normalizeUnreadCount(localDmUnreadCount);
  const unreadMessagesCount = hasLocalDmState
    ? localUnreadMessagesCount
    : normalizedUnreadDmDropsCount;

  return {
    hasUnread: unreadMessagesCount > 0,
    unreadCount: unreadMessagesCount,
  };
}
