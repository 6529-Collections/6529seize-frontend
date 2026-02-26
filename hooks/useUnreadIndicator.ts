"use client";

import { useEffect, useState } from "react";

import { useMyStream } from "@/contexts/wave/MyStreamContext";

import { useUnreadNotifications } from "./useUnreadNotifications";

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
  const [hasUnread, setHasUnread] = useState(false);

  // Use existing notifications hook for notifications
  const { haveUnreadNotifications } = useUnreadNotifications(
    type === "notifications" ? handle : null
  );

  // Use direct messages context for messages
  const { directMessages } = useMyStream();

  useEffect(() => {
    // Only show indicators if user is authenticated
    if (!handle) {
      setHasUnread(false);
      return;
    }

    if (type === "notifications") {
      setHasUnread(haveUnreadNotifications);
    } else if (type === "messages") {
      const hasUnreadMessages = directMessages.list.some((dm) => {
        return (dm?.unreadDropsCount ?? 0) > 0 || (dm?.newDropsCount?.count ?? 0) > 0;
      });

      setHasUnread(hasUnreadMessages);
    }
  }, [type, handle, haveUnreadNotifications, directMessages.list]);

  return { hasUnread };
}
