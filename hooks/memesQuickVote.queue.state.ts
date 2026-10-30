import { MEMES_QUICK_VOTE_LOOKAHEAD_COUNT } from "@/hooks/memesQuickVote.query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  getQuickVoteAbsoluteRemainingPower,
  getQuickVoteRatingRange,
  isMemesQuickVoteVoteableDrop,
} from "@/hooks/memesQuickVote.helpers";

export type KeyedOptimisticRemainingVotePowerState = {
  readonly key: string;
  readonly value: number | null;
};

export type MemesQuickVoteSessionState = {
  readonly currentDrop: ApiDrop | null;
  readonly hasDiscoveryError: boolean;
  readonly isExhausted: boolean;
  readonly isLoading: boolean;
  readonly isRestartingRound: boolean;
  readonly leftThisRoundCount: number;
  readonly lookaheadDrops: readonly ApiDrop[];
  readonly recentlyHandledDropIds: readonly string[];
  readonly recentlyVotedDropIds: readonly string[];
  readonly unratedCount: number;
};

export const createInitialOptimisticRemainingVotePowerState = (
  key: string
): KeyedOptimisticRemainingVotePowerState => ({
  key,
  value: null,
});

export const getCurrentOptimisticRemainingVotePowerState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedOptimisticRemainingVotePowerState;
}): KeyedOptimisticRemainingVotePowerState =>
  state.key === key
    ? state
    : createInitialOptimisticRemainingVotePowerState(key);

export const createInitialSessionState = (): MemesQuickVoteSessionState => ({
  currentDrop: null,
  hasDiscoveryError: false,
  isExhausted: false,
  isLoading: false,
  isRestartingRound: false,
  leftThisRoundCount: 0,
  lookaheadDrops: [],
  recentlyHandledDropIds: [],
  recentlyVotedDropIds: [],
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
  isPartial = false,
  handledDropIdsAtRequest = [],
}: {
  readonly current: MemesQuickVoteSessionState;
  readonly fetchedDrops: readonly ApiDrop[];
  readonly pendingDropIds: readonly string[];
  readonly primaryDrop: ApiDrop | null;
  readonly rawLeftThisRoundCount: number;
  readonly rawUnratedCount: number;
  readonly isPartial?: boolean;
  readonly handledDropIdsAtRequest?: readonly string[];
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
  const handledDuringRequest = current.recentlyHandledDropIds.filter(
    (id) => !handledDropIdsAtRequest.includes(id)
  );
  const recentlyHandledDropIds = isPartial
    ? current.recentlyHandledDropIds
    : [...new Set([...resurfacedHandledDropIds, ...handledDuringRequest])];
  const hiddenDropIds = new Set([
    ...recentlyHandledDropIds,
    ...current.recentlyVotedDropIds,
    ...pendingDropIds,
  ]);
  let currentDrop = current.currentDrop;

  if (currentDrop) {
    const refreshedCurrentDrop = fetchedDrops.find(
      (drop) => drop.id === currentDrop?.id
    );

    if (refreshedCurrentDrop) {
      currentDrop = refreshedCurrentDrop;
    }
  }

  if (
    currentDrop &&
    (rawUnratedCount === 0 ||
      hiddenDropIds.has(currentDrop.id) ||
      !isMemesQuickVoteVoteableDrop(currentDrop))
  ) {
    currentDrop = null;
  }

  const safeFetchedDrops = getUniqueDrops([
    ...current.lookaheadDrops.map(
      (drop) => fetchedDrops.find((fresh) => fresh.id === drop.id) ?? drop
    ),
    ...fetchedDrops,
  ]).filter(
    (drop) =>
      rawUnratedCount > 0 &&
      !hiddenDropIds.has(drop.id) &&
      isMemesQuickVoteVoteableDrop(drop)
  );
  currentDrop ??= safeFetchedDrops[0] ?? null;

  const lookaheadDrops = safeFetchedDrops
    .filter((drop) => drop.id !== currentDrop?.id)
    .slice(0, MEMES_QUICK_VOTE_LOOKAHEAD_COUNT - 1);
  const leftThisRoundCount = getDisplayLeftThisRoundCount({
    hiddenDropIds: new Set([...resurfacedHandledDropIds, ...pendingDropIds]),
    rawLeftThisRoundCount,
  });
  const isRestartingRound =
    !isPartial &&
    currentDrop === null &&
    lookaheadDrops.length === 0 &&
    rawLeftThisRoundCount === 0 &&
    rawUnratedCount > 0 &&
    safeFetchedDropsWithoutHandled.length === 0;
  const isExhausted =
    !isPartial &&
    currentDrop === null &&
    lookaheadDrops.length === 0 &&
    pendingDropIds.length === 0 &&
    (rawUnratedCount === 0 ||
      (primaryDrop?.context_profile_context?.rating === 0 &&
        getQuickVoteAbsoluteRemainingPower(
          getQuickVoteRatingRange(primaryDrop)
        ) === 0));

  return {
    currentDrop,
    hasDiscoveryError: false,
    isExhausted,
    isLoading: currentDrop === null && !isExhausted && !isRestartingRound,
    isRestartingRound,
    leftThisRoundCount:
      handledDuringRequest.length > 0
        ? Math.min(leftThisRoundCount, current.leftThisRoundCount)
        : leftThisRoundCount,
    lookaheadDrops,
    recentlyHandledDropIds: isRestartingRound ? [] : recentlyHandledDropIds,
    recentlyVotedDropIds: current.recentlyVotedDropIds,
    unratedCount: Math.min(
      handledDuringRequest.length > 0 ? current.unratedCount : rawUnratedCount,
      Math.max(
        0,
        rawUnratedCount -
          current.recentlyVotedDropIds.filter(
            (id) => returnedDropIds.has(id) || pendingDropIds.includes(id)
          ).length
      )
    ),
  };
};

export const reduceOptimisticRemainingVotePower = ({
  amount,
  current,
  remainingPower,
}: {
  readonly amount: number;
  readonly current: KeyedOptimisticRemainingVotePowerState;
  readonly remainingPower: number;
}): KeyedOptimisticRemainingVotePowerState => ({
  ...current,
  value: Math.max(0, (current.value ?? remainingPower) - Math.abs(amount)),
});

export const reconcileOptimisticRemainingVotePower = ({
  current,
  nextRemainingPower,
}: {
  readonly current: KeyedOptimisticRemainingVotePowerState;
  readonly nextRemainingPower: number;
}): KeyedOptimisticRemainingVotePowerState => ({
  ...current,
  value:
    current.value === null
      ? nextRemainingPower
      : Math.min(current.value, nextRemainingPower),
});

export const restoreOptimisticRemainingVotePower = ({
  amount,
  current,
  remainingPower,
}: {
  readonly amount: number;
  readonly current: KeyedOptimisticRemainingVotePowerState;
  readonly remainingPower: number;
}): KeyedOptimisticRemainingVotePowerState => ({
  ...current,
  value:
    current.value === null
      ? remainingPower
      : Math.min(remainingPower, current.value + Math.abs(amount)),
});

export const applyOptimisticAdvanceState = ({
  current,
  dropId,
  pendingDropIds,
  isVote = false,
}: {
  readonly current: MemesQuickVoteSessionState;
  readonly isVote?: boolean;
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
    isRestartingRound: false,
    isLoading: currentDrop === null,
    leftThisRoundCount: Math.max(0, current.leftThisRoundCount - 1),
    lookaheadDrops: nextLookaheadDrops.slice(1),
    recentlyHandledDropIds,
    recentlyVotedDropIds: isVote
      ? [...current.recentlyVotedDropIds, dropId]
      : current.recentlyVotedDropIds,
    unratedCount: Math.max(0, current.unratedCount - (isVote ? 1 : 0)),
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
    isRestartingRound: false,
    isLoading: false,
    leftThisRoundCount: wasHandled
      ? current.leftThisRoundCount + 1
      : current.leftThisRoundCount,
    recentlyHandledDropIds,
    recentlyVotedDropIds: current.recentlyVotedDropIds.filter(
      (id) => id !== failedDrop.id
    ),
    unratedCount:
      current.unratedCount +
      (current.recentlyVotedDropIds.includes(failedDrop.id) ? 1 : 0),
  };
};

// A successful vote from another surface must also retire a buffered candidate.
export const applyKnownRatedDrop = (
  current: MemesQuickVoteSessionState,
  drop: ApiDrop
): MemesQuickVoteSessionState => {
  const rating = drop.context_profile_context?.rating;
  if (typeof rating !== "number" || rating === 0) return current;
  if (current.currentDrop?.id === drop.id) {
    return applyOptimisticAdvanceState({
      current,
      dropId: drop.id,
      pendingDropIds: [],
      isVote: true,
    });
  }
  if (!current.lookaheadDrops.some((candidate) => candidate.id === drop.id)) {
    return current;
  }
  return {
    ...current,
    lookaheadDrops: current.lookaheadDrops.filter(
      (candidate) => candidate.id !== drop.id
    ),
    recentlyVotedDropIds: [...current.recentlyVotedDropIds, drop.id],
    leftThisRoundCount: Math.max(0, current.leftThisRoundCount - 1),
    unratedCount: Math.max(0, current.unratedCount - 1),
  };
};

export const getEffectiveOptimisticRemainingVotePower = ({
  activeApiDrop,
  state,
}: {
  readonly activeApiDrop: ApiDrop | null;
  readonly state: KeyedOptimisticRemainingVotePowerState;
}): number | null => {
  if (state.value === null) {
    return null;
  }

  const activeRemainingPower = getQuickVoteAbsoluteRemainingPower(
    getQuickVoteRatingRange(activeApiDrop)
  );

  if (activeRemainingPower <= state.value) {
    return null;
  }

  return state.value;
};

export const clampDropRatingRange = (
  drop: ExtendedDrop,
  optimisticRemainingPower: number | null
): ExtendedDrop => {
  const profileContext = drop.context_profile_context;
  const range = getQuickVoteRatingRange(drop);

  if (optimisticRemainingPower === null || profileContext?.rating !== 0) {
    return drop;
  }

  const nextMaxRating = Math.min(
    range.maxRating,
    Math.max(0, optimisticRemainingPower)
  );
  const nextMinRating =
    range.minRating < 0
      ? Math.max(range.minRating, -optimisticRemainingPower)
      : range.minRating;

  if (nextMaxRating === range.maxRating && nextMinRating === range.minRating) {
    return drop;
  }

  return {
    ...drop,
    context_profile_context: {
      ...profileContext,
      max_rating: nextMaxRating,
      min_rating: nextMinRating,
    },
  };
};
