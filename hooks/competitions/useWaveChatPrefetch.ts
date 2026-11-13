"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { isCompetitionPathname } from "@/helpers/competition.helpers";
import { getSharedWaveTabRoute } from "@/helpers/default-competition.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";

/** Warm Chat only on visitor intent, after foreground queries have finished. */
export function useWaveChatPrefetch() {
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  return useCallback(() => {
    if (
      !isCompetitionPathname(pathname) ||
      client.isFetching({
        predicate: (query) => query.state.data === undefined,
      }) > 0
    )
      return;
    const href = getSharedWaveTabRoute(pathname, MyStreamWaveTab.CHAT);
    if (!href) return;
    router.prefetch(href);
  }, [pathname, router, client]);
}
