"use client";

import { useUnreadNotifications } from "./useUnreadNotifications";
import { useDmUnreadSummary } from "@/services/dm-unread/DmUnreadStateProvider";

type UnreadIndicatorType = "notifications" | "messages";

interface UseUnreadIndicatorProps {
  readonly type: UnreadIndicatorType;
  readonly handle: string | null;
}

interface UseUnreadIndicatorReturn {
  readonly hasUnread: boolean;
}

export function useUnreadIndicator({
  type,
  handle,
}: UseUnreadIndicatorProps): UseUnreadIndicatorReturn {
  // Use existing notifications hook for notifications
  const { haveUnreadNotifications } = useUnreadNotifications(
    type === "notifications" ? handle : null
  );

  const { hasUnread: haveUnreadDmDrops } = useDmUnreadSummary();

  // Only show indicators if user is authenticated
  if (!handle) {
    return { hasUnread: false };
  }

  if (type === "notifications") {
    return { hasUnread: haveUnreadNotifications };
  }

  return { hasUnread: haveUnreadDmDrops };
}
