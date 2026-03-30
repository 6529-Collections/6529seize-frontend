"use client";

import { AuthContext } from "@/components/auth/Auth";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { getDisplayQuickVoteAmounts } from "@/hooks/memesQuickVote.helpers";
import {
  fetchMemesQuickVoteUndiscoveredDrop,
  getMemesQuickVoteUndiscoveredDropQueryKey,
  MEMES_QUICK_VOTE_LOOKAHEAD_COUNT,
  MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { useMemesQuickVoteSubmit } from "@/hooks/useMemesQuickVoteSubmit";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import type { ContextType, Dispatch, SetStateAction } from "react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

type UseMemesQuickVoteQueueOptions = {
  readonly enabled?: boolean | undefined;
  readonly sessionId: number;
};

export type UseMemesQuickVoteQueueResult = {
  readonly activeDrop: ExtendedDrop | null;
  readonly hasDiscoveryError: boolean;
  readonly isExhausted: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly latestUsedAmount: number | null;
  readonly recentAmounts: number[];
  readonly remainingCount: number;
  readonly retryDiscovery: () => void;
  readonly submitVote: (
    drop: ExtendedDrop,
    amount: number | string
  ) => Promise<boolean>;
  readonly skipDrop: (drop: ExtendedDrop) => Promise<boolean>;
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
};

type KeyedOptimisticAdvanceState = {
  readonly blockedDropIds: readonly string[];
  readonly fallbackDrop: ApiDrop | null;
  readonly key: string;
  readonly nextDropId: string | null;
};

type KeyedOptimisticRemainingPowerState = {
  readonly key: string;
  readonly value: number | null;
};

type UseBufferedUndiscoveredDropsOptions = {
  readonly contextProfile: string | null | undefined;
  readonly enabled: boolean;
  readonly isQuickVoteEnabled: boolean;
  readonly isSettingsLoaded: boolean;
  readonly proxyId: string | null | undefined;
  readonly sessionId: number;
  readonly waveId: string | null;
};

type UseMemesQuickVoteQueueActionsOptions = {
  readonly bufferedDrops: readonly ApiDrop[];
  readonly contextProfile: string | null | undefined;
  readonly proxyId: string | null | undefined;
  readonly queryClient: ReturnType<typeof useQueryClient>;
  readonly requestAuth: ContextType<typeof AuthContext>["requestAuth"];
  readonly sessionId: number;
  readonly setAndPersistRecentAmounts: (
    updater: (current: number[]) => number[]
  ) => void;
  readonly setOptimisticAdvanceState: Dispatch<
    SetStateAction<KeyedOptimisticAdvanceState>
  >;
  readonly setOptimisticRemainingPowerState: Dispatch<
    SetStateAction<KeyedOptimisticRemainingPowerState>
  >;
  readonly setToast: ContextType<typeof AuthContext>["setToast"];
  readonly stateKey: string;
  readonly waveId: string | null;
};

const createInitialOptimisticAdvanceState = (
  key: string
): KeyedOptimisticAdvanceState => ({
  blockedDropIds: [],
  fallbackDrop: null,
  key,
  nextDropId: null,
});

const buildOptimisticAdvanceState = ({
  blockedDropIds,
  bufferedDrops,
  key,
}: {
  readonly blockedDropIds: readonly string[];
  readonly bufferedDrops: readonly ApiDrop[];
  readonly key: string;
}): KeyedOptimisticAdvanceState => {
  const uniqueBlockedDropIds = Array.from(new Set(blockedDropIds));

  if (uniqueBlockedDropIds.length === 0) {
    return createInitialOptimisticAdvanceState(key);
  }

  const blockedDropIdSet = new Set(uniqueBlockedDropIds);
  const nextDrop =
    bufferedDrops.find((drop) => !blockedDropIdSet.has(drop.id)) ?? null;

  return {
    blockedDropIds: uniqueBlockedDropIds,
    fallbackDrop: nextDrop,
    key,
    nextDropId: nextDrop?.id ?? null,
  };
};

const createInitialOptimisticRemainingPowerState = (
  key: string
): KeyedOptimisticRemainingPowerState => ({
  key,
  value: null,
});

const getCurrentOptimisticAdvanceState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedOptimisticAdvanceState;
}): KeyedOptimisticAdvanceState =>
  state.key === key ? state : createInitialOptimisticAdvanceState(key);

const getCurrentOptimisticRemainingPowerState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedOptimisticRemainingPowerState;
}): KeyedOptimisticRemainingPowerState =>
  state.key === key ? state : createInitialOptimisticRemainingPowerState(key);

const getResolvedOptimisticAdvanceState = ({
  bufferedDrops,
  isFetching,
  state,
}: {
  readonly bufferedDrops: readonly ApiDrop[];
  readonly isFetching: boolean;
  readonly state: KeyedOptimisticAdvanceState;
}): KeyedOptimisticAdvanceState => {
  if (state.blockedDropIds.length === 0 || isFetching) {
    return state;
  }

  const blockedDropIdSet = new Set(state.blockedDropIds);

  if (bufferedDrops.some((drop) => blockedDropIdSet.has(drop.id))) {
    return state;
  }

  return createInitialOptimisticAdvanceState(state.key);
};

const getEffectiveOptimisticRemainingPower = ({
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

const clampDropMaxRating = (
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

const isVoteableQuickVoteDrop = (drop: ExtendedDrop | null): boolean => {
  const profileContext = drop?.context_profile_context;

  return (
    profileContext?.rating === 0 &&
    typeof profileContext.max_rating === "number" &&
    profileContext.max_rating > 0
  );
};

const getMemesQuickVoteQueueViewState = ({
  activeDrop,
  queueActions,
  recentAmountsByRecency,
}: {
  readonly activeDrop: ExtendedDrop | null;
  readonly queueActions: Pick<
    ReturnType<typeof useMemesQuickVoteQueueActions>,
    "invalidateUndiscoveredDrops"
  >;
  readonly recentAmountsByRecency: readonly number[];
}) => ({
  latestUsedAmount: recentAmountsByRecency.at(-1) ?? null,
  recentAmounts: getDisplayQuickVoteAmounts(recentAmountsByRecency),
  retryDiscovery: () => {
    queueActions.invalidateUndiscoveredDrops();
  },
  uncastPower: activeDrop?.context_profile_context?.max_rating ?? null,
  votingLabel: activeDrop
    ? WAVE_VOTING_LABELS[activeDrop.wave.voting_credit_type]
    : null,
});

const useBufferedUndiscoveredDrops = ({
  contextProfile,
  enabled,
  isQuickVoteEnabled,
  isSettingsLoaded,
  proxyId,
  sessionId,
  waveId,
}: UseBufferedUndiscoveredDropsOptions) => {
  const isQueryEnabled =
    enabled && isQuickVoteEnabled && waveId !== null && !!contextProfile;
  const queries = useQueries({
    queries: Array.from(
      { length: MEMES_QUICK_VOTE_LOOKAHEAD_COUNT },
      (_, skip) => ({
        enabled: isQueryEnabled,
        queryFn: ({ signal }) =>
          fetchMemesQuickVoteUndiscoveredDrop({
            signal,
            skip,
            waveId,
          }),
        queryKey: getMemesQuickVoteUndiscoveredDropQueryKey({
          contextProfile,
          proxyId,
          sessionId,
          skip,
          waveId,
        }),
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        ...getDefaultQueryRetry(),
        retry: false,
        staleTime: 0,
      })
    ),
  });
  const primaryQuery = queries[0];
  const primaryDrop = primaryQuery?.data?.drop ?? null;
  const lookaheadDrops = queries.slice(1).flatMap((query) => {
    const drop = query.data?.drop;
    return drop ? [drop] : [];
  });
  // Never treat lookahead as the current item before skip=0 has resolved.
  const bufferedDrops = primaryDrop
    ? [primaryDrop, ...lookaheadDrops]
    : lookaheadDrops;
  const isFetching = queries.some(
    (query) => query.isPending || query.isFetching
  );
  const hasDiscoveryError =
    enabled && primaryQuery?.isError === true && primaryDrop === null;
  const isQuickVoteUnavailable =
    enabled && isSettingsLoaded && !isQuickVoteEnabled;
  const isExhausted =
    enabled &&
    !hasDiscoveryError &&
    (isQuickVoteUnavailable ||
      (!isFetching &&
        primaryQuery?.isSuccess === true &&
        primaryDrop === null));
  const isLoading =
    enabled &&
    !hasDiscoveryError &&
    !isExhausted &&
    primaryDrop === null &&
    (primaryQuery?.isPending === true || primaryQuery?.isFetching === true);
  const totalCount =
    queries.find((query) => typeof query.data?.total_count === "number")?.data
      ?.total_count ?? 0;

  return {
    bufferedDrops,
    hasDiscoveryError,
    isExhausted,
    isFetching,
    isLoading,
    primaryDrop,
    totalCount,
  };
};

const useResolvedMemesQuickVoteDrops = ({
  optimisticAdvanceState,
  optimisticRemainingPowerState,
  pendingDropIds,
  stateKey,
  undiscoveredBuffer,
}: {
  readonly optimisticAdvanceState: KeyedOptimisticAdvanceState;
  readonly optimisticRemainingPowerState: KeyedOptimisticRemainingPowerState;
  readonly pendingDropIds: readonly string[];
  readonly stateKey: string;
  readonly undiscoveredBuffer: ReturnType<typeof useBufferedUndiscoveredDrops>;
}) => {
  const optimisticAdvance = getResolvedOptimisticAdvanceState({
    bufferedDrops: undiscoveredBuffer.bufferedDrops,
    isFetching: undiscoveredBuffer.isFetching,
    state: getCurrentOptimisticAdvanceState({
      key: stateKey,
      state: optimisticAdvanceState,
    }),
  });
  const pendingDropIdSet = useMemo(
    () => new Set(pendingDropIds),
    [pendingDropIds]
  );
  const hiddenDropIdSet = useMemo(
    () => new Set([...optimisticAdvance.blockedDropIds, ...pendingDropIds]),
    [optimisticAdvance.blockedDropIds, pendingDropIds]
  );
  const nextBufferedDrop = useMemo(() => {
    if (optimisticAdvance.blockedDropIds.length === 0) {
      return null;
    }

    if (optimisticAdvance.nextDropId) {
      const matchingBufferedDrop = undiscoveredBuffer.bufferedDrops.find(
        (drop) => drop.id === optimisticAdvance.nextDropId
      );

      if (matchingBufferedDrop) {
        return matchingBufferedDrop;
      }
    }

    if (
      optimisticAdvance.fallbackDrop &&
      !hiddenDropIdSet.has(optimisticAdvance.fallbackDrop.id)
    ) {
      return optimisticAdvance.fallbackDrop;
    }

    return (
      undiscoveredBuffer.bufferedDrops.find(
        (drop) => !hiddenDropIdSet.has(drop.id)
      ) ?? null
    );
  }, [
    hiddenDropIdSet,
    optimisticAdvance.blockedDropIds.length,
    optimisticAdvance.fallbackDrop,
    optimisticAdvance.nextDropId,
    undiscoveredBuffer.bufferedDrops,
  ]);
  const activeApiDrop = useMemo(() => {
    if (optimisticAdvance.blockedDropIds.length > 0) {
      return nextBufferedDrop;
    }

    const primaryDrop = undiscoveredBuffer.primaryDrop;

    if (!primaryDrop) {
      return null;
    }

    if (!pendingDropIdSet.has(primaryDrop.id)) {
      return primaryDrop;
    }

    return (
      undiscoveredBuffer.bufferedDrops.find(
        (drop) => !hiddenDropIdSet.has(drop.id)
      ) ?? null
    );
  }, [
    hiddenDropIdSet,
    nextBufferedDrop,
    optimisticAdvance.blockedDropIds.length,
    pendingDropIdSet,
    undiscoveredBuffer.bufferedDrops,
    undiscoveredBuffer.primaryDrop,
  ]);
  const effectiveOptimisticRemainingPower =
    getEffectiveOptimisticRemainingPower({
      activeApiDrop,
      state: getCurrentOptimisticRemainingPowerState({
        key: stateKey,
        state: optimisticRemainingPowerState,
      }),
    });
  const activeDropCandidate = useMemo(() => {
    if (!activeApiDrop) {
      return null;
    }

    return clampDropMaxRating(
      convertApiDropToExtendedDrop(activeApiDrop),
      effectiveOptimisticRemainingPower
    );
  }, [activeApiDrop, effectiveOptimisticRemainingPower]);
  const activeDrop = isVoteableQuickVoteDrop(activeDropCandidate)
    ? activeDropCandidate
    : null;

  return {
    activeDrop,
  };
};

const useMemesQuickVoteQueueActions = ({
  bufferedDrops,
  contextProfile,
  proxyId,
  queryClient,
  requestAuth,
  sessionId,
  setAndPersistRecentAmounts,
  setOptimisticAdvanceState,
  setOptimisticRemainingPowerState,
  setToast,
  stateKey,
  waveId,
}: UseMemesQuickVoteQueueActionsOptions) => {
  const invalidateUndiscoveredDrops = useCallback(() => {
    queryClient
      .invalidateQueries({
        predicate: (query) => {
          if (
            !Array.isArray(query.queryKey) ||
            query.queryKey[0] !==
              MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY ||
            typeof query.queryKey[1] !== "object" ||
            query.queryKey[1] === null
          ) {
            return false;
          }

          const undiscoveredQuery = query.queryKey[1] as {
            readonly context_profile?: string | null;
            readonly proxyId?: string | null;
            readonly sessionId?: number;
            readonly waveId?: string | null;
          };

          return (
            undiscoveredQuery.context_profile === (contextProfile ?? null) &&
            undiscoveredQuery.proxyId === (proxyId ?? null) &&
            undiscoveredQuery.waveId === waveId &&
            (undiscoveredQuery.sessionId === 0 ||
              undiscoveredQuery.sessionId === sessionId)
          );
        },
      })
      .catch(() => {
        // Invalidation is best-effort; the next session/query refresh will recover.
      });
  }, [contextProfile, proxyId, queryClient, sessionId, waveId]);
  const setNextOptimisticAdvance = useCallback(
    (drop: ExtendedDrop) => {
      setOptimisticAdvanceState((current) => {
        const baseState = getCurrentOptimisticAdvanceState({
          key: stateKey,
          state: current,
        });

        return buildOptimisticAdvanceState({
          blockedDropIds: [...baseState.blockedDropIds, drop.id],
          bufferedDrops,
          key: stateKey,
        });
      });
    },
    [bufferedDrops, setOptimisticAdvanceState, stateKey]
  );

  const { pendingDropIds, submitSkip, submitVote } = useMemesQuickVoteSubmit({
    onRatingFailure: (drop, _amount, type) => {
      setOptimisticAdvanceState((current) => {
        const baseState = getCurrentOptimisticAdvanceState({
          key: stateKey,
          state: current,
        });

        if (!baseState.blockedDropIds.includes(drop.id)) {
          return baseState;
        }

        const remainingBlockedDropIds = baseState.blockedDropIds.filter(
          (blockedDropId) => blockedDropId !== drop.id
        );

        if (remainingBlockedDropIds.length === 0) {
          return createInitialOptimisticAdvanceState(stateKey);
        }

        return buildOptimisticAdvanceState({
          blockedDropIds: remainingBlockedDropIds,
          bufferedDrops,
          key: stateKey,
        });
      });

      if (type === "vote") {
        setOptimisticRemainingPowerState(
          createInitialOptimisticRemainingPowerState(stateKey)
        );
      }

      invalidateUndiscoveredDrops();
    },
    onRatingQueued: (drop) => {
      setNextOptimisticAdvance(drop);
    },
    onRatingSuccess: (_drop, _amount, nextRemainingPower, type) => {
      if (type === "vote") {
        setOptimisticRemainingPowerState({
          key: stateKey,
          value: nextRemainingPower,
        });
      }

      invalidateUndiscoveredDrops();
    },
    requestAuth,
    setAndPersistRecentAmounts,
    setToast,
  });

  return {
    invalidateUndiscoveredDrops,
    pendingDropIds,
    skipDrop: submitSkip,
    submitVote,
  };
};

export const useMemesQuickVoteQueue = ({
  enabled = true,
  sessionId,
}: UseMemesQuickVoteQueueOptions): UseMemesQuickVoteQueueResult => {
  const { requestAuth, setToast } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const {
    contextProfile,
    isEnabled: isQuickVoteEnabled,
    isLoaded: isSettingsLoaded,
    memesWaveId,
    proxyId,
  } = useMemesQuickVoteContext();
  const waveId =
    typeof memesWaveId === "string" && memesWaveId.length > 0
      ? memesWaveId
      : null;
  const stateKey = `${sessionId}:${waveId ?? ""}:${contextProfile ?? ""}`;
  const [optimisticAdvanceState, setOptimisticAdvanceState] =
    useState<KeyedOptimisticAdvanceState>(() =>
      createInitialOptimisticAdvanceState(stateKey)
    );
  const [optimisticRemainingPowerState, setOptimisticRemainingPowerState] =
    useState<KeyedOptimisticRemainingPowerState>(() =>
      createInitialOptimisticRemainingPowerState(stateKey)
    );
  const { recentAmountsByRecency, setAndPersistRecentAmounts } =
    useMemesQuickVoteStorage({
      contextProfile,
      memesWaveId,
    });
  const undiscoveredBuffer = useBufferedUndiscoveredDrops({
    contextProfile,
    enabled,
    isQuickVoteEnabled,
    isSettingsLoaded,
    proxyId,
    sessionId,
    waveId,
  });
  const queueActions = useMemesQuickVoteQueueActions({
    bufferedDrops: undiscoveredBuffer.bufferedDrops,
    contextProfile,
    proxyId,
    queryClient,
    requestAuth,
    sessionId,
    setAndPersistRecentAmounts,
    setOptimisticAdvanceState,
    setOptimisticRemainingPowerState,
    setToast,
    stateKey,
    waveId,
  });
  const currentOptimisticAdvanceState = getCurrentOptimisticAdvanceState({
    key: stateKey,
    state: optimisticAdvanceState,
  });
  const { activeDrop } = useResolvedMemesQuickVoteDrops({
    optimisticAdvanceState,
    optimisticRemainingPowerState,
    pendingDropIds: queueActions.pendingDropIds,
    stateKey,
    undiscoveredBuffer,
  });
  const {
    latestUsedAmount,
    recentAmounts,
    retryDiscovery,
    uncastPower,
    votingLabel,
  } = getMemesQuickVoteQueueViewState({
    activeDrop,
    queueActions,
    recentAmountsByRecency,
  });
  const pendingQuickVoteCount = queueActions.pendingDropIds.length;
  const invalidateUndiscoveredDrops = queueActions.invalidateUndiscoveredDrops;

  useEffect(() => {
    if (
      !enabled ||
      undiscoveredBuffer.isFetching ||
      undiscoveredBuffer.hasDiscoveryError ||
      undiscoveredBuffer.isExhausted
    ) {
      return;
    }

    const shouldContinueSync =
      currentOptimisticAdvanceState.blockedDropIds.length > 0 ||
      (pendingQuickVoteCount > 0 && activeDrop === null);

    if (!shouldContinueSync) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      invalidateUndiscoveredDrops();
    }, 300);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [
    activeDrop,
    currentOptimisticAdvanceState.blockedDropIds.length,
    enabled,
    invalidateUndiscoveredDrops,
    pendingQuickVoteCount,
    undiscoveredBuffer.hasDiscoveryError,
    undiscoveredBuffer.isExhausted,
    undiscoveredBuffer.isFetching,
  ]);

  return {
    activeDrop,
    hasDiscoveryError: undiscoveredBuffer.hasDiscoveryError,
    isExhausted: undiscoveredBuffer.isExhausted,
    isLoading: undiscoveredBuffer.isLoading && activeDrop === null,
    isReady: activeDrop !== null,
    latestUsedAmount,
    recentAmounts,
    remainingCount: undiscoveredBuffer.totalCount,
    retryDiscovery,
    skipDrop: queueActions.skipDrop,
    submitVote: queueActions.submitVote,
    uncastPower,
    votingLabel,
  };
};
