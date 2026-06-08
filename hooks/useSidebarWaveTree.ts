"use client";

import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import useLocalPreference from "@/hooks/useLocalPreference";
import { useCallback, useMemo } from "react";

const EXPANDED_SUBWAVE_PARENT_IDS_STORAGE_KEY =
  "sidebar_expanded_subwave_parent_ids";

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

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const hasUnreadDrops = (wave: MinimalWave) =>
  !wave.isMuted && (wave.unreadDropsCount > 0 || wave.newDropsCount.count > 0);

export function useSidebarWaveTree({
  waves,
  activeWaveId,
  storageScope,
}: {
  readonly waves: readonly MinimalWave[];
  readonly activeWaveId: string | null;
  readonly storageScope?: string | null | undefined;
}) {
  const storageKey = `${EXPANDED_SUBWAVE_PARENT_IDS_STORAGE_KEY}:${
    storageScope?.trim() || "anonymous"
  }`;
  const [storedExpandedParentIds, setStoredExpandedParentIds] =
    useLocalPreference<string[]>(
      storageKey,
      [],
      isStringArray
    );

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

  const activeParentWaveId = useMemo(() => {
    if (activeWaveId === null) {
      return null;
    }

    return waves.find((wave) => wave.id === activeWaveId)?.parentWaveId ?? null;
  }, [activeWaveId, waves]);

  const expandedParentIds = useMemo(
    () => new Set(storedExpandedParentIds),
    [storedExpandedParentIds]
  );

  const getIsExpanded = useCallback(
    (waveId: string) =>
      expandedParentIds.has(waveId) || activeParentWaveId === waveId,
    [activeParentWaveId, expandedParentIds]
  );

  const getHasUnreadSubwaves = useCallback(
    (waveId: string) =>
      (subwavesByParentId.get(waveId) ?? []).some(hasUnreadDrops),
    [subwavesByParentId]
  );

  const toggleParent = useCallback(
    (waveId: string) => {
      const nextExpandedParentIds = new Set(storedExpandedParentIds);
      if (nextExpandedParentIds.has(waveId)) {
        nextExpandedParentIds.delete(waveId);
      } else {
        nextExpandedParentIds.add(waveId);
      }
      setStoredExpandedParentIds(Array.from(nextExpandedParentIds));
    },
    [setStoredExpandedParentIds, storedExpandedParentIds]
  );

  const getRows = useCallback(
    (parentWaves: readonly MinimalWave[]): SidebarWaveTreeRow[] => {
      const rows: SidebarWaveTreeRow[] = [];

      for (const wave of parentWaves) {
        const subwaves = subwavesByParentId.get(wave.id) ?? [];
        const canExpand =
          wave.parentWaveId === null &&
          (wave.hasSubwaves || subwaves.length > 0);
        const isExpanded = canExpand && getIsExpanded(wave.id);
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
    [getHasUnreadSubwaves, getIsExpanded, subwavesByParentId]
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
