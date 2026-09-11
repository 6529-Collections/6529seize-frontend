import { useEffect, useState } from "react";
import {
  readActiveSubwaveParentHint,
  resolveActiveSubwaveParent,
  writeActiveSubwaveParentHint,
} from "@/helpers/waves/active-subwave-hint.helpers";

/**
 * Bridges the sidebar's active-subwave parent across a full reload.
 *
 * - Persists {activeWaveId, parentWaveId} whenever the live parent is known,
 *   keeping the hint fresh for the next reload.
 * - Returns the parent to treat as active: the live value once resolved, or
 *   the reload-time hint while it is still loading (only if the hint is for
 *   the currently-active wave). This lets the tree expand and highlight the
 *   subwave immediately after a cold load instead of waiting for the
 *   active-wave -> parent -> subwaves fetch waterfall.
 */
export function useActiveSubwaveParentHint(
  activeWaveId: string | null,
  liveParentWaveId: string | null
): string | null {
  // Read once at mount — that is the value carried across the reload.
  const [hint] = useState(readActiveSubwaveParentHint);

  useEffect(() => {
    if (activeWaveId && liveParentWaveId) {
      writeActiveSubwaveParentHint({
        waveId: activeWaveId,
        parentWaveId: liveParentWaveId,
      });
    }
  }, [activeWaveId, liveParentWaveId]);

  return resolveActiveSubwaveParent(activeWaveId, liveParentWaveId, hint);
}
