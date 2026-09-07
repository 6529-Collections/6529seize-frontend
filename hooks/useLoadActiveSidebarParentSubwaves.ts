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
  const hasActiveParentInSidebar = useMemo(
    () =>
      activeParentWaveId !== null &&
      waves.some(
        (wave) => wave.id === activeParentWaveId && wave.parentWaveId === null
      ),
    [activeParentWaveId, waves]
  );
  const loadActiveParentSubwaves = useEffectEvent((parentWaveId: string) => {
    streamWaves.loadSubwavesForParent(parentWaveId);
  });

  useEffect(() => {
    if (activeParentWaveId === null || !hasActiveParentInSidebar) {
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
  }, [activeParentWaveId, hasActiveParentInSidebar]);
}
