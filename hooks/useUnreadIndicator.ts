"use client";

import { useUnreadNotifications } from "./useUnreadNotifications";
import { useUnreadDmDrops } from "./useUnreadDmDrops";

type UnreadIndicatorType = "notifications" | "messages";

interface LocalUnreadDirectMessage {
  readonly unreadDropsCount?: number | null | undefined;
  readonly newDropsCount?:
    | {
        readonly count?: number | null | undefined;
      }
    | null
    | undefined;
}

interface UseUnreadIndicatorProps {
  readonly type: UnreadIndicatorType;
  readonly handle: string | null;
  readonly localDirectMessages?:
    | readonly LocalUnreadDirectMessage[]
    | null
    | undefined;
}

interface UseUnreadIndicatorReturn {
  readonly hasUnread: boolean;
  readonly unreadCount: number;
}

export function useUnreadIndicator({
  type,
  handle,
  localDirectMessages,
}: UseUnreadIndicatorProps): UseUnreadIndicatorReturn {
  // Use existing notifications hook for notifications
  const { haveUnreadNotifications } = useUnreadNotifications(
    type === "notifications" ? handle : null
  );

  const { unreadDmDropsCount } = useUnreadDmDrops(
    type === "messages" ? handle : null
  );

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

  const localUnreadMessagesCount = (localDirectMessages ?? []).reduce(
    (count, dm) =>
      count + Math.max(dm.unreadDropsCount ?? 0, dm.newDropsCount?.count ?? 0),
    0
  );
  const unreadMessagesCount = Math.max(
    unreadDmDropsCount ?? 0,
    localUnreadMessagesCount
  );

  return {
    hasUnread: unreadMessagesCount > 0,
    unreadCount: unreadMessagesCount,
  };
}
