"use client";

import { useEffect, useEffectEvent } from "react";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

interface RecentDirectMessagePrefetchProps {
  readonly enabled: boolean;
  readonly viewerIdentityKey: string | null;
  readonly waves: readonly { readonly id: string }[];
  readonly prefetchWave: (waveId: string) => Promise<void>;
}

export function useRecentDirectMessagePrefetch({
  enabled,
  viewerIdentityKey,
  waves,
  prefetchWave,
}: RecentDirectMessagePrefetchProps) {
  const prefetchWaveData = usePrefetchWaveData();
  const hasWaves = waves.length > 0;
  const prefetchRecent = useEffectEvent(async (isStopped: () => boolean) => {
    // Use one snapshot per list visit, so incoming activity cannot grow the queue.
    for (const { id } of waves.slice(0, 3)) {
      if (isStopped() || document.visibilityState !== "visible") return;
      await Promise.allSettled([prefetchWaveData(id), prefetchWave(id)]);
    }
  });

  useEffect(() => {
    if (!enabled || !hasWaves || !viewerIdentityKey) return;

    let stopped = false;
    const stop = () => {
      stopped = true;
    };
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, stop);

    void prefetchRecent(() => stopped);

    return () => {
      // Leave an in-flight request available to a chat opened during prefetch.
      stop();
      globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, stop);
    };
  }, [enabled, hasWaves, viewerIdentityKey]);
}
