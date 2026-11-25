"use client";

import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { compareSubwavesForDisplay } from "@/helpers/waves/subwave-activity.helpers";
import { useCallback, useMemo, useState } from "react";

type SidebarWaveDepth = 0 | 1;

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
  readonly wave: MinimalWave;
  readonly depth: SidebarWaveDepth;
  readonly parentWaveId: string | null;
  readonly isExpanded: boolean;
  readonly isLoadingSubwaves: boolean;
  readonly canExpand: boolean;
  readonly hasUnreadSubwaves: boolean;
  readonly unreadSubwaveDropsCount: number;
  readonly isFirstSubwave: boolean;
  readonly isLastSubwave: boolean;
}

const getUnreadDropsCount = (wave: MinimalWave) =>
  wave.isMuted ? 0 : Math.max(wave.unreadDropsCount, wave.newDropsCount.count);

// Matches the server's subwave_unread_drops rule: only subwaves the viewer
// follows and has not muted contribute to the parent's aggregate.
const getCountedSubwaveUnreadDrops = (subwave: MinimalWave) =>
  subwave.isFollowing ? getUnreadDropsCount(subwave) : 0;

const getUnreadSubwaveDropsCount = (
  wave: MinimalWave,
  subwaves: readonly MinimalWave[]
) => {
  if (wave.isMuted) {
    return 0;
  }

  const loadedSubwaveUnreadCount = subwaves.reduce(
    (total, subwave) => total + getCountedSubwaveUnreadDrops(subwave),
    0
  );

  return Math.max(wave.unreadSubwaveDrops, loadedSubwaveUnreadCount);
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

/**
 * Parents the user left expanded (and did not later collapse), as persisted
 * across a same-tab reload. Used to eagerly re-fetch their subwaves after a
 * reload so the remembered expansion is visible again — expansion rendering
 * requires the subwaves to be loaded, and they are otherwise only fetched on
 * click.
 */
export const readPersistedExpandedParentIds = (): readonly string[] => {
  const state = readExpansionState();
  const collapsedParentIds = new Set(state.collapsedParentIds);
  return state.expandedParentIds.filter(
    (waveId) => !collapsedParentIds.has(waveId)
  );
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
    subwaves.sort(compareSubwavesForDisplay);
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

const canExpandSidebarParent = (wave: MinimalWave, subwavesCount: number) =>
  wave.parentWaveId === null &&
  (wave.hasSubwaves || wave.followedSubwavesCount > 0 || subwavesCount > 0);

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
    const canExpand = canExpandSidebarParent(wave, subwaves.length);
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
    const unreadSubwaveDropsCount = canExpand
      ? getUnreadSubwaveDropsCount(wave, subwaves)
      : 0;

    rows.push({
      key: wave.id,
      wave,
      depth: 0,
      parentWaveId: null,
      isExpanded,
      isLoadingSubwaves,
      canExpand,
      hasUnreadSubwaves,
      unreadSubwaveDropsCount,
      isFirstSubwave: false,
      isLastSubwave: false,
    });

    if (!isExpanded) {
      continue;
    }

    subwaves.forEach((subwave, index) => {
      rows.push({
        key: `${wave.id}:${subwave.id}`,
        wave: subwave,
        depth: 1,
        parentWaveId: wave.id,
        isExpanded: false,
        isLoadingSubwaves: false,
        canExpand: false,
        hasUnreadSubwaves: false,
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
  const [activeSubwaveCollapse, setActiveSubwaveCollapse] = useState({
    activeWaveId,
    parentId: null as string | null,
  });
  // Each navigation reveals its active subwave before manual collapse applies.
  if (activeSubwaveCollapse.activeWaveId !== activeWaveId) {
    setActiveSubwaveCollapse({ activeWaveId, parentId: null });
  }

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
      if (
        resolvedActiveParentWaveId === waveId &&
        activeSubwaveCollapse.parentId !== waveId
      ) {
        return true;
      }

      if (collapsedParentIds.has(waveId)) {
        return false;
      }

      return expandedParentIds.has(waveId);
    },
    [
      activeSubwaveCollapse.parentId,
      collapsedParentIds,
      resolvedActiveParentWaveId,
      expandedParentIds,
    ]
  );

  const getHasUnreadSubwaves = useCallback(
    (wave: MinimalWave) =>
      !wave.isMuted &&
      (wave.unreadSubwaveDrops > 0 ||
        (subwavesByParentId.get(wave.id) ?? []).some(
          (subwave) => getCountedSubwaveUnreadDrops(subwave) > 0
        )),
    [subwavesByParentId]
  );

  const getIsVisiblyExpanded = useCallback(
    (waveId: string) =>
      showExpandedSubwaves &&
      (subwavesByParentId.get(waveId)?.length ?? 0) > 0 &&
      getIsExpanded(waveId),
    [getIsExpanded, showExpandedSubwaves, subwavesByParentId]
  );

  const setParentExpanded = useCallback((waveId: string, expanded: boolean) => {
    setExpansionState((previousState) => {
      const nextCollapsedParentIds = new Set(previousState.collapsedParentIds);
      const nextExpandedParentIds = new Set(previousState.expandedParentIds);

      if (expanded) {
        nextCollapsedParentIds.delete(waveId);
        nextExpandedParentIds.add(waveId);
      } else {
        nextExpandedParentIds.delete(waveId);
        nextCollapsedParentIds.add(waveId);
      }

      const nextState = {
        expandedParentIds: Array.from(nextExpandedParentIds),
        collapsedParentIds: Array.from(nextCollapsedParentIds),
      };

      writeExpansionState(nextState);

      return nextState;
    });
  }, []);

  const expandParent = useCallback(
    (waveId: string) => {
      const wave = topLevelWaves.find((candidate) => candidate.id === waveId);
      if (
        !wave ||
        !canExpandSidebarParent(
          wave,
          subwavesByParentId.get(waveId)?.length ?? 0
        )
      ) {
        return;
      }

      if (!getIsVisiblyExpanded(waveId)) {
        onParentExpand?.(waveId);
      }
      setParentExpanded(waveId, true);
    },
    [
      getIsVisiblyExpanded,
      onParentExpand,
      setParentExpanded,
      subwavesByParentId,
      topLevelWaves,
    ]
  );

  const toggleParent = useCallback(
    (waveId: string) => {
      if (!getIsVisiblyExpanded(waveId)) {
        expandParent(waveId);
        return;
      }

      if (waveId === resolvedActiveParentWaveId) {
        setActiveSubwaveCollapse({ activeWaveId, parentId: waveId });
      }
      setParentExpanded(waveId, false);
    },
    [
      activeWaveId,
      expandParent,
      getIsVisiblyExpanded,
      resolvedActiveParentWaveId,
      setParentExpanded,
    ]
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
      expandParent,
      toggleParent,
    }),
    [expandParent, getRows, toggleParent, topLevelWaves]
  );
}
