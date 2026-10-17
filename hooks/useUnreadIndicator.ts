"use client";

import { useUnreadNotifications } from "./useUnreadNotifications";
import { useDmUnreadSummary } from "@/services/dm-unread/DmUnreadStateProvider";
import { useE2eeUnreadSummary } from "@/hooks/e2ee/useE2ee";

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
  // Encrypted chats count toward the Messages badge; always false when the
  // encrypted-messages flag is off or the engine is not loaded.
  const { hasUnread: haveUnreadEncrypted } = useE2eeUnreadSummary();

  // Only show indicators if user is authenticated
  if (!handle) {
    return { hasUnread: false };
  }

  if (type === "notifications") {
    return { hasUnread: haveUnreadNotifications };
  }

  return { hasUnread: haveUnreadDmDrops || haveUnreadEncrypted };
}
