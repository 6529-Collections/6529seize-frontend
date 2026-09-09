"use client";

import { useDmUnreadSummary } from "@/services/dm-unread/DmUnreadStateProvider";

interface UseUnreadDmDropsOptions {
  readonly enabled?: boolean | undefined;
}

export function useUnreadDmDrops(
  handle: string | null,
  options: UseUnreadDmDropsOptions = {}
) {
  const { totalUnreadMessages } = useDmUnreadSummary();
  const isEnabled = Boolean(handle && options.enabled !== false);
  const unreadDmDropsCount = isEnabled ? totalUnreadMessages : 0;

  return {
    unreadDmDrops: isEnabled ? { count: unreadDmDropsCount } : undefined,
    unreadDmDropsCount,
    haveUnreadDmDrops: unreadDmDropsCount > 0,
  };
}
