import type { ApiDrop } from "@/generated/models/ApiDrop";

export type MemesQuickVoteDiscoveryState = {
  readonly deferredIds: string[];
  readonly removedIds: string[];
};

export type MemesQuickVoteDiscoveryPage = {
  readonly drops: readonly ApiDrop[];
  readonly nextPage: number | null;
  readonly pageCount: number;
};

type MemesQuickVoteDiscoverySnapshot = {
  readonly activeIds: string[];
  readonly deferredIds: string[];
  readonly discoveredDropsById: Record<string, ApiDrop>;
  readonly nextPage: number | null;
  readonly serverCount: number | null;
};

export const createInitialMemesQuickVoteDiscoveryState = ({
  enabled: _enabled,
}: {
  readonly enabled?: boolean | undefined;
} = {}): MemesQuickVoteDiscoveryState => ({
  deferredIds: [],
  removedIds: [],
});

const hasId = (ids: readonly string[], targetId: string): boolean =>
  ids.includes(targetId);

const getActiveDeferredIds = ({
  discoveredDropsById,
  removedIds,
  skippedDropIds,
  state,
}: {
  readonly discoveredDropsById: Record<string, ApiDrop>;
  readonly removedIds: ReadonlySet<string>;
  readonly skippedDropIds: readonly string[];
  readonly state: MemesQuickVoteDiscoveryState;
}): string[] => {
  const localDeferredIds = state.deferredIds.filter(
    (dropId) => !removedIds.has(dropId) && !!discoveredDropsById[dropId]
  );
  const localDeferredIdSet = new Set(localDeferredIds);
  const persistedDeferredIds = skippedDropIds.filter(
    (dropId) =>
      !removedIds.has(dropId) &&
      !!discoveredDropsById[dropId] &&
      !localDeferredIdSet.has(dropId)
  );

  return [...persistedDeferredIds, ...localDeferredIds];
};

export const deriveMemesQuickVoteDiscoverySnapshot = ({
  enabled,
  pages,
  skippedDropIds,
  state,
}: {
  readonly enabled: boolean;
  readonly pages: readonly MemesQuickVoteDiscoveryPage[];
  readonly skippedDropIds: readonly string[];
  readonly state: MemesQuickVoteDiscoveryState;
}): MemesQuickVoteDiscoverySnapshot => {
  if (pages.length === 0) {
    return {
      activeIds: [],
      deferredIds: [],
      discoveredDropsById: {},
      nextPage: enabled ? 1 : null,
      serverCount: null,
    };
  }

  const discoveredDropsById: Record<string, ApiDrop> = {};
  const discoveredIds: string[] = [];

  for (const page of pages) {
    for (const drop of page.drops) {
      if (!discoveredDropsById[drop.id]) {
        discoveredIds.push(drop.id);
      }

      discoveredDropsById[drop.id] = drop;
    }
  }

  const removedIds = new Set(state.removedIds);
  const deferredIds = getActiveDeferredIds({
    discoveredDropsById,
    removedIds,
    skippedDropIds,
    state,
  });
  const deferredIdSet = new Set(deferredIds);
  const activeIds = discoveredIds.filter(
    (dropId) => !removedIds.has(dropId) && !deferredIdSet.has(dropId)
  );
  const lastPage = pages[pages.length - 1];

  return {
    activeIds,
    deferredIds,
    discoveredDropsById,
    nextPage: lastPage?.nextPage ?? null,
    serverCount: lastPage?.pageCount ?? null,
  };
};

export const removeMemesQuickVoteDropId = ({
  dropId,
  state,
}: {
  readonly dropId: string;
  readonly state: MemesQuickVoteDiscoveryState;
}): MemesQuickVoteDiscoveryState => {
  if (hasId(state.removedIds, dropId) && !hasId(state.deferredIds, dropId)) {
    return state;
  }

  return {
    deferredIds: state.deferredIds.filter((value) => value !== dropId),
    removedIds: hasId(state.removedIds, dropId)
      ? state.removedIds
      : [...state.removedIds, dropId],
  };
};

export const deferMemesQuickVoteDropId = ({
  dropId,
  state,
}: {
  readonly dropId: string;
  readonly state: MemesQuickVoteDiscoveryState;
}): MemesQuickVoteDiscoveryState => {
  const nextDeferredIds = [
    ...state.deferredIds.filter((value) => value !== dropId),
    dropId,
  ];

  if (
    nextDeferredIds.length === state.deferredIds.length &&
    nextDeferredIds.every((value, index) => value === state.deferredIds[index])
  ) {
    return state;
  }

  return {
    deferredIds: nextDeferredIds,
    removedIds: state.removedIds.filter((value) => value !== dropId),
  };
};

export const getMemesQuickVoteActiveCandidateId = (
  state: MemesQuickVoteDiscoverySnapshot
): string | null => {
  const activeCandidateId = state.activeIds[0];

  if (activeCandidateId) {
    return activeCandidateId;
  }

  if (state.nextPage !== null) {
    return null;
  }

  return state.deferredIds[0] ?? null;
};

export const getMemesQuickVoteNextCandidateId = (
  state: MemesQuickVoteDiscoverySnapshot
): string | null => {
  if (state.activeIds.length > 1) {
    return state.activeIds[1] ?? null;
  }

  if (state.activeIds.length === 1) {
    return state.nextPage === null ? (state.deferredIds[0] ?? null) : null;
  }

  if (state.nextPage !== null) {
    return null;
  }

  return state.deferredIds[1] ?? null;
};

export const getMemesQuickVoteDiscoveredQueue = (
  state: MemesQuickVoteDiscoverySnapshot
): ApiDrop[] =>
  [...state.activeIds, ...state.deferredIds].flatMap((dropId) => {
    const drop = state.discoveredDropsById[dropId];
    return drop ? [drop] : [];
  });

export const shouldFetchMemesQuickVotePage = ({
  replenishThreshold,
  state,
}: {
  readonly replenishThreshold: number;
  readonly state: MemesQuickVoteDiscoverySnapshot;
}): boolean =>
  state.nextPage !== null && state.activeIds.length <= replenishThreshold;

export const isMemesQuickVoteExhausted = (
  state: MemesQuickVoteDiscoverySnapshot
): boolean =>
  state.nextPage === null &&
  state.activeIds.length === 0 &&
  state.deferredIds.length === 0;
