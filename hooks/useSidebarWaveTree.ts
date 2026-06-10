"use client";

import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SidebarWaveDepth = 0 | 1;

export interface SidebarWaveTreeRow {
  readonly key: string;
  readonly wave: MinimalWave;
  readonly depth: SidebarWaveDepth;
  readonly parentWaveId: string | null;
  readonly isExpanded: boolean;
  readonly canExpand: boolean;
  readonly hasUnreadSubwaves: boolean;
}

const hasUnreadDrops = (wave: MinimalWave) =>
  !wave.isMuted && (wave.unreadDropsCount > 0 || wave.newDropsCount.count > 0);

interface UseSidebarWaveTreeOptions {
  readonly waves: readonly MinimalWave[];
  readonly activeWaveId: string | null;
  readonly activeParentWaveId?: string | null | undefined;
  readonly onParentExpand?: ((parentWaveId: string) => void) | undefined;
  readonly showExpandedSubwaves?: boolean | undefined;
}

export function useSidebarWaveTree({
  waves,
  activeWaveId,
  activeParentWaveId,
  onParentExpand,
  showExpandedSubwaves = true,
}: UseSidebarWaveTreeOptions) {
  const [manualExpandedParentIds, setManualExpandedParentIds] = useState<
    readonly string[]
  >([]);
  const [manualCollapsedParentIds, setManualCollapsedParentIds] = useState<
    readonly string[]
  >([]);
  const onParentExpandRef = useRef(onParentExpand);

  useEffect(() => {
    onParentExpandRef.current = onParentExpand;
  }, [onParentExpand]);

  const requestParentExpand = useCallback((parentWaveId: string) => {
    onParentExpandRef.current?.(parentWaveId);
  }, []);

  const topLevelWaves = useMemo(
    () => waves.filter((wave) => wave.parentWaveId === null),
    [waves]
  );

  const subwavesByParentId = useMemo(() => {
    const map = new Map<string, MinimalWave[]>();

    for (const wave of waves) {
      if (wave.parentWaveId === null) {
        continue;
      }

      const parentSubwaves = map.get(wave.parentWaveId) ?? [];
      parentSubwaves.push(wave);
      map.set(wave.parentWaveId, parentSubwaves);
    }

    for (const subwaves of map.values()) {
      subwaves.sort((a, b) => a.createdAt - b.createdAt);
    }

    return map;
  }, [waves]);

  const activeParentWaveIdFromWaves = useMemo(() => {
    if (activeWaveId === null) {
      return null;
    }

    return waves.find((wave) => wave.id === activeWaveId)?.parentWaveId ?? null;
  }, [activeWaveId, waves]);

  const resolvedActiveParentWaveId =
    activeParentWaveId ?? activeParentWaveIdFromWaves;

  useEffect(() => {
    if (resolvedActiveParentWaveId === null) {
      return;
    }

    requestParentExpand(resolvedActiveParentWaveId);
  }, [requestParentExpand, resolvedActiveParentWaveId]);

  const expandedParentIds = useMemo(
    () => new Set(manualExpandedParentIds),
    [manualExpandedParentIds]
  );
  const collapsedParentIds = useMemo(
    () => new Set(manualCollapsedParentIds),
    [manualCollapsedParentIds]
  );

  const getIsExpanded = useCallback(
    (waveId: string) => {
      if (collapsedParentIds.has(waveId)) {
        return false;
      }

      return (
        expandedParentIds.has(waveId) || resolvedActiveParentWaveId === waveId
      );
    },
    [collapsedParentIds, resolvedActiveParentWaveId, expandedParentIds]
  );

  const getHasUnreadSubwaves = useCallback(
    (waveId: string) =>
      (subwavesByParentId.get(waveId) ?? []).some(hasUnreadDrops),
    [subwavesByParentId]
  );

  const toggleParent = useCallback(
    (waveId: string) => {
      const isExpanded = getIsExpanded(waveId);
      if (!isExpanded) {
        requestParentExpand(waveId);
      }

      setManualCollapsedParentIds((previousParentIds) => {
        const nextCollapsedParentIds = new Set(previousParentIds);
        if (isExpanded) {
          nextCollapsedParentIds.add(waveId);
        } else {
          nextCollapsedParentIds.delete(waveId);
        }
        return Array.from(nextCollapsedParentIds);
      });

      setManualExpandedParentIds((previousParentIds) => {
        const nextExpandedParentIds = new Set(previousParentIds);
        if (isExpanded) {
          nextExpandedParentIds.delete(waveId);
        } else {
          nextExpandedParentIds.add(waveId);
        }
        return Array.from(nextExpandedParentIds);
      });
    },
    [getIsExpanded, requestParentExpand]
  );

  const getRows = useCallback(
    (parentWaves: readonly MinimalWave[]): SidebarWaveTreeRow[] => {
      const rows: SidebarWaveTreeRow[] = [];

      for (const wave of parentWaves) {
        const subwaves = subwavesByParentId.get(wave.id) ?? [];
        const canExpand =
          wave.parentWaveId === null &&
          (wave.hasSubwaves || subwaves.length > 0);
        const isExpanded =
          showExpandedSubwaves && canExpand && getIsExpanded(wave.id);
        const hasUnreadSubwaves = canExpand && getHasUnreadSubwaves(wave.id);

        rows.push({
          key: wave.id,
          wave,
          depth: 0,
          parentWaveId: null,
          isExpanded,
          canExpand,
          hasUnreadSubwaves,
        });

        if (!isExpanded) {
          continue;
        }

        for (const subwave of subwaves) {
          rows.push({
            key: `${wave.id}:${subwave.id}`,
            wave: subwave,
            depth: 1,
            parentWaveId: wave.id,
            isExpanded: false,
            canExpand: false,
            hasUnreadSubwaves: false,
          });
        }
      }

      return rows;
    },
    [
      getHasUnreadSubwaves,
      getIsExpanded,
      showExpandedSubwaves,
      subwavesByParentId,
    ]
  );

  return useMemo(
    () => ({
      topLevelWaves,
      getRows,
      toggleParent,
    }),
    [getRows, toggleParent, topLevelWaves]
  );
}
