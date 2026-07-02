import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useEffect, useEffectEvent, useMemo, useRef } from "react";

interface UseLoadActiveSidebarParentSubwavesOptions {
  readonly activeParentWaveId: string | null;
  readonly waves: readonly MinimalWave[];
}

export function useLoadActiveSidebarParentSubwaves({
  activeParentWaveId,
  waves,
}: UseLoadActiveSidebarParentSubwavesOptions) {
  const { waves: streamWaves } = useMyStream();
  const requestedParentIdsRef = useRef(new Set<string>());
  const hasLoadedActiveParentSubwaves = useMemo(
    () =>
      activeParentWaveId !== null &&
      waves.some((wave) => wave.parentWaveId === activeParentWaveId),
    [activeParentWaveId, waves]
  );
  const loadActiveParentSubwaves = useEffectEvent((parentWaveId: string) => {
    streamWaves.loadSubwavesForParent(parentWaveId);
  });

  useEffect(() => {
    if (activeParentWaveId === null) {
      return;
    }

    if (hasLoadedActiveParentSubwaves) {
      requestedParentIdsRef.current.delete(activeParentWaveId);
      return;
    }

    if (requestedParentIdsRef.current.has(activeParentWaveId)) {
      return;
    }

    const requestedParentIds = requestedParentIdsRef.current;
    requestedParentIds.add(activeParentWaveId);
    loadActiveParentSubwaves(activeParentWaveId);

    return () => {
      requestedParentIds.delete(activeParentWaveId);
    };
  }, [activeParentWaveId, hasLoadedActiveParentSubwaves]);
}
