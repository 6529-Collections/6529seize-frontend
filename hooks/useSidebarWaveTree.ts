"use client";

import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { compareSubwavesByLatestActivity } from "@/helpers/waves/subwave-activity.helpers";
import { useCallback, useMemo, useState } from "react";

type SidebarWaveDepth = 0 | 1;
export type SidebarWaveTreeRowType = "wave" | "subwaves-toggle";

const SIDEBAR_WAVE_TREE_EXPANSION_STORAGE_KEY =
  "sidebar-wave-tree-expansion-v1";

interface SidebarWaveTreeExpansionState {
  readonly expandedParentIds: readonly string[];
  readonly collapsedParentIds: readonly string[];
}

const EMPTY_EXPANSION_STATE: SidebarWaveTreeExpansionState = {
  expandedParentIds: [],
  collapsedParentIds: [],
};

export interface SidebarWaveTreeRow {
  readonly key: string;
  readonly rowType: SidebarWaveTreeRowType;
  readonly wave: MinimalWave;
  readonly depth: SidebarWaveDepth;
  readonly parentWaveId: string | null;
  readonly isExpanded: boolean;
  readonly isLoadingSubwaves: boolean;
  readonly canExpand: boolean;
  readonly hasUnreadSubwaves: boolean;
  readonly knownSubwavesCount: number | null;
  readonly unreadSubwaveDropsCount: number;
  readonly isFirstSubwave: boolean;
  readonly isLastSubwave: boolean;
}

const hasUnreadDrops = (wave: MinimalWave) =>
  !wave.isMuted && (wave.unreadDropsCount > 0 || wave.newDropsCount.count > 0);

const getUnreadDropsCount = (wave: MinimalWave) =>
  wave.isMuted ? 0 : Math.max(wave.unreadDropsCount, wave.newDropsCount.count);

const getUnreadSubwaveDropsCount = (
  wave: MinimalWave,
  subwaves: readonly MinimalWave[]
) => {
  if (wave.isMuted) {
    return 0;
  }

  const loadedSubwaveUnreadCount = subwaves.reduce(
    (total, subwave) => total + getUnreadDropsCount(subwave),
    0
  );

  if (wave.unreadFollowedSubwaveDrops > 0) {
    return wave.unreadFollowedSubwaveDrops;
  }

  return loadedSubwaveUnreadCount;
};

const normalizeParentIds = (value: unknown): readonly string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const readExpansionState = (): SidebarWaveTreeExpansionState => {
  try {
    const storage = globalThis.sessionStorage;
    const storedValue = storage.getItem(
      SIDEBAR_WAVE_TREE_EXPANSION_STORAGE_KEY
    );

    if (storedValue === null) {
      return EMPTY_EXPANSION_STATE;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<{
      readonly expandedParentIds: unknown;
      readonly collapsedParentIds: unknown;
    }>;

    return {
      expandedParentIds: normalizeParentIds(parsedValue.expandedParentIds),
      collapsedParentIds: normalizeParentIds(parsedValue.collapsedParentIds),
    };
  } catch {
    return EMPTY_EXPANSION_STATE;
  }
};

const writeExpansionState = (state: SidebarWaveTreeExpansionState) => {
  try {
    globalThis.sessionStorage.setItem(
      SIDEBAR_WAVE_TREE_EXPANSION_STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch {
    // Losing this preference is non-critical; route state still works.
  }
};

const buildSubwavesByParentId = (waves: readonly MinimalWave[]) => {
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
    subwaves.sort(compareSubwavesByLatestActivity);
  }

  return map;
};

const getActiveParentWaveIdFromWaves = (
  waves: readonly MinimalWave[],
  activeWaveId: string | null
) => {
  if (activeWaveId === null) {
    return null;
  }

  return waves.find((wave) => wave.id === activeWaveId)?.parentWaveId ?? null;
};

const buildSidebarWaveRows = ({
  getHasUnreadSubwaves,
  getIsExpanded,
  loadingParentWaveIds,
  parentWaves,
  showExpandedSubwaves,
  subwavesByParentId,
}: {
  readonly getHasUnreadSubwaves: (wave: MinimalWave) => boolean;
  readonly getIsExpanded: (waveId: string) => boolean;
  readonly loadingParentWaveIds: ReadonlySet<string>;
  readonly parentWaves: readonly MinimalWave[];
  readonly showExpandedSubwaves: boolean;
  readonly subwavesByParentId: ReadonlyMap<string, readonly MinimalWave[]>;
}): SidebarWaveTreeRow[] => {
  const rows: SidebarWaveTreeRow[] = [];

  for (const wave of parentWaves) {
    const subwaves = subwavesByParentId.get(wave.id) ?? [];
    // Muted parents can still be expanded for inspection; unread indicators
    // stay suppressed by getHasUnreadSubwaves.
    const canExpand =
      wave.parentWaveId === null &&
      (wave.hasSubwaves ||
        wave.followedSubwavesCount > 0 ||
        subwaves.length > 0);
    const isExpanded =
      showExpandedSubwaves &&
      canExpand &&
      subwaves.length > 0 &&
      getIsExpanded(wave.id);
    const isLoadingSubwaves =
      showExpandedSubwaves &&
      canExpand &&
      subwaves.length === 0 &&
      loadingParentWaveIds.has(wave.id) &&
      getIsExpanded(wave.id);
    const hasUnreadSubwaves = canExpand && getHasUnreadSubwaves(wave);
    const knownSubwavesCount = subwaves.length > 0 ? subwaves.length : null;
    const unreadSubwaveDropsCount = canExpand
      ? getUnreadSubwaveDropsCount(wave, subwaves)
      : 0;

    rows.push({
      key: wave.id,
      rowType: "wave",
      wave,
      depth: 0,
      parentWaveId: null,
      isExpanded,
      isLoadingSubwaves,
      canExpand,
      hasUnreadSubwaves,
      knownSubwavesCount,
      unreadSubwaveDropsCount,
      isFirstSubwave: false,
      isLastSubwave: false,
    });

    if (showExpandedSubwaves && canExpand) {
      rows.push({
        key: `${wave.id}:subwaves-toggle`,
        rowType: "subwaves-toggle",
        wave,
        depth: 1,
        parentWaveId: wave.id,
        isExpanded,
        isLoadingSubwaves,
        canExpand: true,
        hasUnreadSubwaves,
        knownSubwavesCount,
        unreadSubwaveDropsCount,
        isFirstSubwave: false,
        isLastSubwave: false,
      });
    }

    if (!isExpanded) {
      continue;
    }

    subwaves.forEach((subwave, index) => {
      rows.push({
        key: `${wave.id}:${subwave.id}`,
        rowType: "wave",
        wave: subwave,
        depth: 1,
        parentWaveId: wave.id,
        isExpanded: false,
        isLoadingSubwaves: false,
        canExpand: false,
        hasUnreadSubwaves: false,
        knownSubwavesCount: null,
        unreadSubwaveDropsCount: 0,
        isFirstSubwave: index === 0,
        isLastSubwave: index === subwaves.length - 1,
      });
    });
  }

  return rows;
};

interface UseSidebarWaveTreeOptions {
  readonly waves: readonly MinimalWave[];
  readonly activeWaveId: string | null;
  readonly activeParentWaveId?: string | null | undefined;
  readonly loadingSubwaveParentIds?: readonly string[] | undefined;
  readonly onParentExpand?: ((parentWaveId: string) => void) | undefined;
  readonly showExpandedSubwaves?: boolean | undefined;
}

export function useSidebarWaveTree({
  waves,
  activeWaveId,
  activeParentWaveId,
  loadingSubwaveParentIds = [],
  onParentExpand,
  showExpandedSubwaves = true,
}: UseSidebarWaveTreeOptions) {
  const [initialExpansionState] =
    useState<SidebarWaveTreeExpansionState>(readExpansionState);
  const [expansionState, setExpansionState] = useState(initialExpansionState);
  const requestParentExpand = useCallback(
    (parentWaveId: string) => {
      onParentExpand?.(parentWaveId);
    },
    [onParentExpand]
  );

  const topLevelWaves = useMemo(
    () => waves.filter((wave) => wave.parentWaveId === null),
    [waves]
  );

  const subwavesByParentId = useMemo(
    () => buildSubwavesByParentId(waves),
    [waves]
  );
  const loadingParentWaveIds = useMemo(
    () => new Set(loadingSubwaveParentIds),
    [loadingSubwaveParentIds]
  );

  const activeParentWaveIdFromWaves = useMemo(
    () => getActiveParentWaveIdFromWaves(waves, activeWaveId),
    [activeWaveId, waves]
  );

  const resolvedActiveParentWaveId =
    activeParentWaveId ?? activeParentWaveIdFromWaves;

  const expandedParentIds = useMemo(
    () => new Set(expansionState.expandedParentIds),
    [expansionState.expandedParentIds]
  );
  const collapsedParentIds = useMemo(
    () => new Set(expansionState.collapsedParentIds),
    [expansionState.collapsedParentIds]
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
    (wave: MinimalWave) =>
      !wave.isMuted &&
      (wave.unreadFollowedSubwaveDrops > 0 ||
        (subwavesByParentId.get(wave.id) ?? []).some(hasUnreadDrops)),
    [subwavesByParentId]
  );

  const getIsVisiblyExpanded = useCallback(
    (waveId: string) =>
      showExpandedSubwaves &&
      (subwavesByParentId.get(waveId)?.length ?? 0) > 0 &&
      getIsExpanded(waveId),
    [getIsExpanded, showExpandedSubwaves, subwavesByParentId]
  );

  const toggleParent = useCallback(
    (waveId: string) => {
      const isExpanded = getIsVisiblyExpanded(waveId);
      if (!isExpanded) {
        requestParentExpand(waveId);
      }

      setExpansionState((previousState) => {
        const nextCollapsedParentIds = new Set(
          previousState.collapsedParentIds
        );
        const nextExpandedParentIds = new Set(previousState.expandedParentIds);

        if (isExpanded) {
          nextCollapsedParentIds.add(waveId);
          nextExpandedParentIds.delete(waveId);
        } else {
          nextCollapsedParentIds.delete(waveId);
          nextExpandedParentIds.add(waveId);
        }

        const nextState = {
          expandedParentIds: Array.from(nextExpandedParentIds),
          collapsedParentIds: Array.from(nextCollapsedParentIds),
        };

        writeExpansionState(nextState);

        return nextState;
      });
    },
    [getIsVisiblyExpanded, requestParentExpand]
  );

  const getRows = useCallback(
    (parentWaves: readonly MinimalWave[]): SidebarWaveTreeRow[] =>
      buildSidebarWaveRows({
        getHasUnreadSubwaves,
        getIsExpanded,
        loadingParentWaveIds,
        parentWaves,
        showExpandedSubwaves,
        subwavesByParentId,
      }),
    [
      getHasUnreadSubwaves,
      getIsExpanded,
      loadingParentWaveIds,
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
