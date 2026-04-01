import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

export type KeyedOptimisticRemainingPowerState = {
  readonly key: string;
  readonly value: number | null;
};

export type MemesQuickVoteSessionState = {
  readonly currentDrop: ApiDrop | null;
  readonly hasDiscoveryError: boolean;
  readonly isExhausted: boolean;
  readonly isLoading: boolean;
  readonly leftThisRoundCount: number;
  readonly lookaheadDrops: readonly ApiDrop[];
  readonly recentlyHandledDropIds: readonly string[];
  readonly unratedCount: number;
};

export const createInitialOptimisticRemainingPowerState = (
  key: string
): KeyedOptimisticRemainingPowerState => ({
  key,
  value: null,
});

export const getCurrentOptimisticRemainingPowerState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedOptimisticRemainingPowerState;
}): KeyedOptimisticRemainingPowerState =>
  state.key === key ? state : createInitialOptimisticRemainingPowerState(key);

export const createInitialSessionState = (): MemesQuickVoteSessionState => ({
  currentDrop: null,
  hasDiscoveryError: false,
  isExhausted: false,
  isLoading: false,
  leftThisRoundCount: 0,
  lookaheadDrops: [],
  recentlyHandledDropIds: [],
  unratedCount: 0,
});

export const getUniqueDrops = (drops: readonly ApiDrop[]): ApiDrop[] => {
  const seen = new Set<string>();
  const uniqueDrops: ApiDrop[] = [];

  for (const drop of drops) {
    if (seen.has(drop.id)) {
      continue;
    }

    seen.add(drop.id);
    uniqueDrops.push(drop);
  }

  return uniqueDrops;
};

const getDisplayLeftThisRoundCount = ({
  hiddenDropIds,
  rawLeftThisRoundCount,
}: {
  readonly hiddenDropIds: ReadonlySet<string>;
  readonly rawLeftThisRoundCount: number;
}): number => Math.max(0, rawLeftThisRoundCount - hiddenDropIds.size);

export const applyFetchedWindowState = ({
  current,
  fetchedDrops,
  pendingDropIds,
  primaryDrop,
  rawLeftThisRoundCount,
  rawUnratedCount,
}: {
  readonly current: MemesQuickVoteSessionState;
  readonly fetchedDrops: readonly ApiDrop[];
  readonly pendingDropIds: readonly string[];
  readonly primaryDrop: ApiDrop | null;
  readonly rawLeftThisRoundCount: number;
  readonly rawUnratedCount: number;
}): MemesQuickVoteSessionState => {
  const returnedDropIds = new Set(fetchedDrops.map((drop) => drop.id));
  const resurfacedHandledDropIds = current.recentlyHandledDropIds.filter(
    (dropId) => returnedDropIds.has(dropId)
  );
  const safeFetchedDropsWithoutHandled = fetchedDrops.filter(
    (drop) =>
      !pendingDropIds.includes(drop.id) &&
      !resurfacedHandledDropIds.includes(drop.id)
  );
  const recentlyHandledDropIds =
    rawUnratedCount > 0 && safeFetchedDropsWithoutHandled.length === 0
      ? []
      : resurfacedHandledDropIds;
  const hiddenDropIds = new Set([...recentlyHandledDropIds, ...pendingDropIds]);
  let currentDrop = current.currentDrop;

  if (currentDrop) {
    const refreshedCurrentDrop = fetchedDrops.find(
      (drop) => drop.id === currentDrop?.id
    );

    if (refreshedCurrentDrop) {
      currentDrop = refreshedCurrentDrop;
    }
  }

  if (currentDrop && hiddenDropIds.has(currentDrop.id)) {
    currentDrop = null;
  }

  const safeFetchedDrops = fetchedDrops.filter(
    (drop) => !hiddenDropIds.has(drop.id)
  );
  currentDrop ??= safeFetchedDrops[0] ?? null;

  const lookaheadDrops = safeFetchedDrops.filter(
    (drop) => drop.id !== currentDrop?.id
  );
  const leftThisRoundCount = getDisplayLeftThisRoundCount({
    hiddenDropIds,
    rawLeftThisRoundCount,
  });
  const isExhausted =
    currentDrop === null &&
    lookaheadDrops.length === 0 &&
    hiddenDropIds.size === 0 &&
    primaryDrop === null &&
    rawUnratedCount === 0;

  return {
    currentDrop,
    hasDiscoveryError: false,
    isExhausted,
    isLoading: currentDrop === null && !isExhausted,
    leftThisRoundCount,
    lookaheadDrops,
    recentlyHandledDropIds,
    unratedCount: rawUnratedCount,
  };
};

export const reduceOptimisticRemainingPower = ({
  amount,
  current,
  maxRating,
}: {
  readonly amount: number;
  readonly current: KeyedOptimisticRemainingPowerState;
  readonly maxRating: number;
}): KeyedOptimisticRemainingPowerState => ({
  ...current,
  value: Math.max(0, (current.value ?? maxRating) - amount),
});

export const reconcileOptimisticRemainingPower = ({
  current,
  nextRemainingPower,
}: {
  readonly current: KeyedOptimisticRemainingPowerState;
  readonly nextRemainingPower: number;
}): KeyedOptimisticRemainingPowerState => ({
  ...current,
  value:
    current.value === null
      ? nextRemainingPower
      : Math.min(current.value, nextRemainingPower),
});

export const restoreOptimisticRemainingPower = ({
  amount,
  current,
  maxRating,
}: {
  readonly amount: number;
  readonly current: KeyedOptimisticRemainingPowerState;
  readonly maxRating: number;
}): KeyedOptimisticRemainingPowerState => ({
  ...current,
  value:
    current.value === null
      ? maxRating
      : Math.min(maxRating, current.value + amount),
});

export const applyOptimisticAdvanceState = ({
  current,
  dropId,
  pendingDropIds,
}: {
  readonly current: MemesQuickVoteSessionState;
  readonly dropId: string;
  readonly pendingDropIds: readonly string[];
}): MemesQuickVoteSessionState => {
  const recentlyHandledDropIds = current.recentlyHandledDropIds.includes(dropId)
    ? current.recentlyHandledDropIds
    : [...current.recentlyHandledDropIds, dropId];
  const hiddenDropIds = new Set([
    ...recentlyHandledDropIds,
    ...pendingDropIds,
    dropId,
  ]);
  const nextLookaheadDrops = current.lookaheadDrops.filter(
    (candidate) => !hiddenDropIds.has(candidate.id)
  );
  const currentDrop = nextLookaheadDrops[0] ?? null;

  return {
    currentDrop,
    hasDiscoveryError: false,
    isExhausted: false,
    isLoading: currentDrop === null,
    leftThisRoundCount: Math.max(0, current.leftThisRoundCount - 1),
    lookaheadDrops: nextLookaheadDrops.slice(1),
    recentlyHandledDropIds,
    unratedCount: current.unratedCount,
  };
};

export const applyFailedDropRestoreState = ({
  current,
  failedDrop,
}: {
  readonly current: MemesQuickVoteSessionState;
  readonly failedDrop: ApiDrop;
}): MemesQuickVoteSessionState => {
  const wasHandled = current.recentlyHandledDropIds.includes(failedDrop.id);
  const recentlyHandledDropIds = current.recentlyHandledDropIds.filter(
    (dropId) => dropId !== failedDrop.id
  );

  return {
    ...current,
    currentDrop: current.currentDrop ?? failedDrop,
    hasDiscoveryError: false,
    isExhausted: false,
    isLoading: false,
    leftThisRoundCount: wasHandled
      ? current.leftThisRoundCount + 1
      : current.leftThisRoundCount,
    recentlyHandledDropIds,
    unratedCount: current.unratedCount,
  };
};

export const getEffectiveOptimisticRemainingPower = ({
  activeApiDrop,
  state,
}: {
  readonly activeApiDrop: ApiDrop | null;
  readonly state: KeyedOptimisticRemainingPowerState;
}): number | null => {
  if (state.value === null) {
    return null;
  }

  const activeMaxRating = activeApiDrop?.context_profile_context?.max_rating;

  if (typeof activeMaxRating === "number" && activeMaxRating <= state.value) {
    return null;
  }

  return state.value;
};

export const clampDropMaxRating = (
  drop: ExtendedDrop,
  optimisticRemainingPower: number | null
): ExtendedDrop => {
  const profileContext = drop.context_profile_context;
  const maxRating = profileContext?.max_rating;

  if (
    optimisticRemainingPower === null ||
    profileContext?.rating !== 0 ||
    typeof maxRating !== "number"
  ) {
    return drop;
  }

  const nextMaxRating = Math.max(
    0,
    Math.min(maxRating, optimisticRemainingPower)
  );

  if (nextMaxRating === maxRating) {
    return drop;
  }

  return {
    ...drop,
    context_profile_context: {
      ...profileContext,
      max_rating: nextMaxRating,
    },
  };
};
