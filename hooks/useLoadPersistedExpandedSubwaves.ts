import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { readPersistedExpandedParentIds } from "@/hooks/useSidebarWaveTree";
import { useEffect, useEffectEvent, useRef, useState } from "react";

interface UseLoadPersistedExpandedSubwavesOptions {
  readonly waves: readonly MinimalWave[];
}

/**
 * After a full reload (e.g. the new-version toast), re-fetch subwaves for
 * every parent the user had manually expanded. The expansion preference
 * itself survives in sessionStorage (see useSidebarWaveTree), but rendering
 * an expanded parent requires its subwaves to be loaded — and those are
 * otherwise only fetched when the toggle is clicked or the parent is the
 * active wave's parent. Each remembered parent is requested at most once.
 */
export function useLoadPersistedExpandedSubwaves({
  waves,
}: UseLoadPersistedExpandedSubwavesOptions) {
  const { waves: streamWaves } = useMyStream();
  // Read once at mount — that is the set carried across the reload.
  const [persistedExpandedParentIds] = useState(readPersistedExpandedParentIds);
  const requestedParentIdsRef = useRef(new Set<string>());
  const loadSubwaves = useEffectEvent((parentWaveId: string) => {
    streamWaves.loadSubwavesForParent(parentWaveId);
  });

  useEffect(() => {
    if (persistedExpandedParentIds.length === 0) {
      return;
    }

    for (const parentWaveId of persistedExpandedParentIds) {
      if (requestedParentIdsRef.current.has(parentWaveId)) {
        continue;
      }

      // Wait until the parent itself appears in the sidebar list; a stale
      // hint for a wave no longer listed is simply never requested.
      const parent = waves.find(
        (wave) => wave.id === parentWaveId && wave.parentWaveId === null
      );
      if (!parent) {
        continue;
      }

      requestedParentIdsRef.current.add(parentWaveId);
      const hasLoadedSubwaves = waves.some(
        (wave) => wave.parentWaveId === parentWaveId
      );
      if (!hasLoadedSubwaves) {
        loadSubwaves(parentWaveId);
      }
    }
  }, [persistedExpandedParentIds, waves]);
}
