"use client";

import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { compareSubwavesByLatestActivity } from "@/helpers/waves/subwave-activity.helpers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  readonly canExpand: boolean;
  readonly hasUnreadSubwaves: boolean;
  readonly isFirstSubwave: boolean;
  readonly isLastSubwave: boolean;
}

const hasUnreadDrops = (wave: MinimalWave) =>
  !wave.isMuted && (wave.unreadDropsCount > 0 || wave.newDropsCount.count > 0);

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
  parentWaves,
  showExpandedSubwaves,
  subwavesByParentId,
}: {
  readonly getHasUnreadSubwaves: (waveId: string) => boolean;
  readonly getIsExpanded: (waveId: string) => boolean;
  readonly parentWaves: readonly MinimalWave[];
  readonly showExpandedSubwaves: boolean;
  readonly subwavesByParentId: ReadonlyMap<string, readonly MinimalWave[]>;
}): SidebarWaveTreeRow[] => {
  const rows: SidebarWaveTreeRow[] = [];

  for (const wave of parentWaves) {
    const subwaves = subwavesByParentId.get(wave.id) ?? [];
    const canExpand =
      wave.parentWaveId === null && (wave.hasSubwaves || subwaves.length > 0);
    const isExpanded =
      showExpandedSubwaves &&
      canExpand &&
      subwaves.length > 0 &&
      getIsExpanded(wave.id);
    const hasUnreadSubwaves = canExpand && getHasUnreadSubwaves(wave.id);

    rows.push({
      key: wave.id,
      wave,
      depth: 0,
      parentWaveId: null,
      isExpanded,
      canExpand,
      hasUnreadSubwaves,
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
        canExpand: false,
        hasUnreadSubwaves: false,
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
  const [initialExpansionState] =
    useState<SidebarWaveTreeExpansionState>(readExpansionState);
  const [expansionState, setExpansionState] = useState(initialExpansionState);
  const requestedParentIdsRef = useRef<Set<string>>(new Set());

  const requestParentExpand = useCallback(
    (
      parentWaveId: string,
      options: { readonly force?: boolean | undefined } = {}
    ) => {
      if (
        onParentExpand === undefined ||
        (!options.force && requestedParentIdsRef.current.has(parentWaveId))
      ) {
        return;
      }

      requestedParentIdsRef.current.add(parentWaveId);
      onParentExpand(parentWaveId);
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

  const activeParentWaveIdFromWaves = useMemo(
    () => getActiveParentWaveIdFromWaves(waves, activeWaveId),
    [activeWaveId, waves]
  );

  const resolvedActiveParentWaveId =
    activeParentWaveId ?? activeParentWaveIdFromWaves;

  useEffect(() => {
    if (resolvedActiveParentWaveId === null) {
      return;
    }

    requestParentExpand(resolvedActiveParentWaveId);
  }, [requestParentExpand, resolvedActiveParentWaveId]);

  useEffect(() => {
    initialExpansionState.expandedParentIds.forEach((parentWaveId) => {
      requestParentExpand(parentWaveId);
    });
  }, [initialExpansionState.expandedParentIds, requestParentExpand]);

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
    (waveId: string) =>
      (subwavesByParentId.get(waveId) ?? []).some(hasUnreadDrops),
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
        requestParentExpand(waveId, { force: true });
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
        parentWaves,
        showExpandedSubwaves,
        subwavesByParentId,
      }),
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
