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

  const { haveUnreadDmDrops } = useUnreadDmDrops(
    type === "messages" ? handle : null
  );

  // Only show indicators if user is authenticated
  if (!handle) {
    return { hasUnread: false };
  }

  if (type === "notifications") {
    return { hasUnread: haveUnreadNotifications };
  }

  const hasLocalUnreadMessages = (localDirectMessages ?? []).some((dm) => {
    return (dm.unreadDropsCount ?? 0) > 0 || (dm.newDropsCount?.count ?? 0) > 0;
  });

  const hasUnreadMessages = haveUnreadDmDrops || hasLocalUnreadMessages;

  return { hasUnread: hasUnreadMessages };
}
