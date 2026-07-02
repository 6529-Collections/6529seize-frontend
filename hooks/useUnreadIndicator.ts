"use client";

import { useUnreadNotifications } from "./useUnreadNotifications";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useUnreadDmDrops } from "./useUnreadDmDrops";

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

  const { haveUnreadDmDrops, unreadDmDrops } = useUnreadDmDrops(
    type === "messages" ? handle : null
  );

  // Use direct messages context for messages
  const { directMessages } = useMyStream();

  // Only show indicators if user is authenticated
  if (!handle) {
    return { hasUnread: false };
  }

  if (type === "notifications") {
    return { hasUnread: haveUnreadNotifications };
  }

  const hasLocalUnreadMessages = directMessages.list.some((dm) => {
    return (
      (dm?.unreadDropsCount ?? 0) > 0 || (dm?.newDropsCount?.count ?? 0) > 0
    );
  });

  const hasUnreadMessages =
    haveUnreadDmDrops || (!unreadDmDrops && hasLocalUnreadMessages);

  return { hasUnread: hasUnreadMessages };
}
