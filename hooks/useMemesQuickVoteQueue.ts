"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { getDisplayQuickVoteAmounts } from "@/hooks/memesQuickVote.helpers";
import {
  fetchMemesQuickVoteUndiscoveredDrop,
  MEMES_QUICK_VOTE_LOOKAHEAD_COUNT,
  MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { useMemesQuickVoteSubmit } from "@/hooks/useMemesQuickVoteSubmit";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type KeyedOptimisticRemainingPowerState = {
  readonly key: string;
  readonly value: number | null;
};

type MemesQuickVoteSessionState = {
  readonly currentDrop: ApiDrop | null;
  readonly hasDiscoveryError: boolean;
  readonly isExhausted: boolean;
  readonly isLoading: boolean;
  readonly lookaheadDrops: readonly ApiDrop[];
  readonly recentlyHandledDropIds: readonly string[];
  readonly totalCount: number;
};

type KeyedSessionState = {
  readonly key: string;
  readonly value: MemesQuickVoteSessionState;
};

type UseMemesQuickVoteSessionStateOptions = {
  readonly contextProfile: string | null | undefined;
  readonly enabled: boolean;
  readonly isQuickVoteEnabled: boolean;
  readonly isSettingsLoaded: boolean;
  readonly pendingDropIdsRef: { current: readonly string[] };
  readonly stateKey: string;
  readonly waveId: string | null;
};

type UseMemesQuickVoteSessionStateResult = {
  readonly advanceVisibleDrop: (drop: ExtendedDrop) => void;
  readonly restoreFailedDrop: (drop: ExtendedDrop) => void;
  readonly sessionState: MemesQuickVoteSessionState;
  readonly syncUndiscoveredWindow: () => Promise<void>;
};

type UseKeyedMemesQuickVoteSessionStoreResult = {
  readonly currentSessionState: MemesQuickVoteSessionState;
  readonly setCurrentSessionState: (
    nextState:
      | MemesQuickVoteSessionState
      | ((current: MemesQuickVoteSessionState) => MemesQuickVoteSessionState)
  ) => void;
};

type UseMemesQuickVoteWindowSyncOptions = Omit<
  UseMemesQuickVoteSessionStateOptions,
  "stateKey"
> & {
  readonly setCurrentSessionState: UseKeyedMemesQuickVoteSessionStoreResult["setCurrentSessionState"];
};

const createInitialOptimisticRemainingPowerState = (
  key: string
): KeyedOptimisticRemainingPowerState => ({
  key,
  value: null,
});

const getCurrentOptimisticRemainingPowerState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedOptimisticRemainingPowerState;
}): KeyedOptimisticRemainingPowerState =>
  state.key === key ? state : createInitialOptimisticRemainingPowerState(key);

const createInitialSessionState = (): MemesQuickVoteSessionState => ({
  currentDrop: null,
  hasDiscoveryError: false,
  isExhausted: false,
  isLoading: false,
  lookaheadDrops: [],
  recentlyHandledDropIds: [],
  totalCount: 0,
});

const getCurrentSessionState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedSessionState;
}): MemesQuickVoteSessionState =>
  state.key === key ? state.value : createInitialSessionState();

const getUniqueDrops = (drops: readonly ApiDrop[]): ApiDrop[] => {
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

const getDisplayRemainingCount = ({
  hiddenDropIds,
  rawTotalCount,
}: {
  readonly hiddenDropIds: ReadonlySet<string>;
  readonly rawTotalCount: number;
}): number => Math.max(0, rawTotalCount - hiddenDropIds.size);

const applyFetchedWindowState = ({
  current,
  fetchedDrops,
  pendingDropIds,
  primaryDrop,
  rawTotalCount,
}: {
  readonly current: MemesQuickVoteSessionState;
  readonly fetchedDrops: readonly ApiDrop[];
  readonly pendingDropIds: readonly string[];
  readonly primaryDrop: ApiDrop | null;
  readonly rawTotalCount: number;
}): MemesQuickVoteSessionState => {
  const returnedDropIds = new Set(fetchedDrops.map((drop) => drop.id));
  const recentlyHandledDropIds = current.recentlyHandledDropIds.filter(
    (dropId) => returnedDropIds.has(dropId)
  );
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
  const totalCount = getDisplayRemainingCount({
    hiddenDropIds,
    rawTotalCount,
  });
  const isExhausted =
    currentDrop === null &&
    lookaheadDrops.length === 0 &&
    hiddenDropIds.size === 0 &&
    primaryDrop === null &&
    rawTotalCount === 0;

  return {
    currentDrop,
    hasDiscoveryError: false,
    isExhausted,
    isLoading: currentDrop === null && !isExhausted,
    lookaheadDrops,
    recentlyHandledDropIds,
    totalCount,
  };
};

const applyOptimisticAdvanceState = ({
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
    lookaheadDrops: nextLookaheadDrops.slice(1),
    recentlyHandledDropIds,
    totalCount: Math.max(0, current.totalCount - 1),
  };
};

const applyFailedDropRestoreState = ({
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
    recentlyHandledDropIds,
    totalCount: wasHandled ? current.totalCount + 1 : current.totalCount,
  };
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

const useKeyedMemesQuickVoteSessionStore = (
  stateKey: string
): UseKeyedMemesQuickVoteSessionStoreResult => {
  const [sessionState, setSessionState] = useState<KeyedSessionState>(() => ({
    key: stateKey,
    value: createInitialSessionState(),
  }));

  const setCurrentSessionState = useCallback(
    (
      nextState:
        | MemesQuickVoteSessionState
        | ((current: MemesQuickVoteSessionState) => MemesQuickVoteSessionState)
    ) => {
      setSessionState((current) => {
        const baseState = getCurrentSessionState({
          key: stateKey,
          state: current,
        });
        const value =
          typeof nextState === "function" ? nextState(baseState) : nextState;

        return {
          key: stateKey,
          value,
        };
      });
    },
    [stateKey]
  );

  return {
    currentSessionState: getCurrentSessionState({
      key: stateKey,
      state: sessionState,
    }),
    setCurrentSessionState,
  };
};

const useMemesQuickVoteWindowSync = ({
  contextProfile,
  enabled,
  isQuickVoteEnabled,
  isSettingsLoaded,
  pendingDropIdsRef,
  setCurrentSessionState,
  waveId,
}: UseMemesQuickVoteWindowSyncOptions) => {
  const syncAbortControllerRef = useRef<AbortController | null>(null);
  const syncRequestIdRef = useRef(0);
  const syncRetryTimeoutRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);

  const clearSyncRetryTimeout = useCallback(() => {
    if (syncRetryTimeoutRef.current === null) {
      return;
    }

    globalThis.clearTimeout(syncRetryTimeoutRef.current);
    syncRetryTimeoutRef.current = null;
  }, []);

  const stopActiveSync = useCallback(() => {
    syncRequestIdRef.current += 1;
    syncAbortControllerRef.current?.abort();
    syncAbortControllerRef.current = null;
    clearSyncRetryTimeout();
  }, [clearSyncRetryTimeout]);

  const syncUndiscoveredWindow = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (isSettingsLoaded && !isQuickVoteEnabled) {
      setCurrentSessionState({
        ...createInitialSessionState(),
        isExhausted: true,
      });
      return;
    }

    if (!isQuickVoteEnabled || !contextProfile || waveId === null) {
      return;
    }

    const requestId = syncRequestIdRef.current + 1;
    syncRequestIdRef.current = requestId;
    syncAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    syncAbortControllerRef.current = abortController;

    setCurrentSessionState((current) => ({
      ...current,
      hasDiscoveryError: false,
      isExhausted: false,
      isLoading: current.currentDrop === null,
    }));

    try {
      const responses = await Promise.all(
        Array.from({ length: MEMES_QUICK_VOTE_LOOKAHEAD_COUNT }, (_, skip) =>
          fetchMemesQuickVoteUndiscoveredDrop({
            signal: abortController.signal,
            skip,
            waveId,
          })
        )
      );

      if (
        abortController.signal.aborted ||
        syncRequestIdRef.current !== requestId
      ) {
        return;
      }

      const primaryDrop = responses[0]?.drop ?? null;
      const rawTotalCount =
        responses.find((response) => typeof response.total_count === "number")
          ?.total_count ?? 0;
      const fetchedDrops = getUniqueDrops(
        responses.flatMap((response) => (response.drop ? [response.drop] : []))
      );

      setCurrentSessionState((current) =>
        applyFetchedWindowState({
          current,
          fetchedDrops,
          pendingDropIds: pendingDropIdsRef.current,
          primaryDrop,
          rawTotalCount,
        })
      );
    } catch {
      if (
        abortController.signal.aborted ||
        syncRequestIdRef.current !== requestId
      ) {
        return;
      }

      setCurrentSessionState((current) =>
        current.currentDrop
          ? {
              ...current,
              isLoading: false,
            }
          : {
              ...current,
              hasDiscoveryError: true,
              isExhausted: false,
              isLoading: false,
            }
      );
    }
  }, [
    contextProfile,
    enabled,
    isQuickVoteEnabled,
    isSettingsLoaded,
    pendingDropIdsRef,
    setCurrentSessionState,
    waveId,
  ]);

  return {
    clearSyncRetryTimeout,
    stopActiveSync,
    syncUndiscoveredWindow,
  };
};

const useMemesQuickVoteSessionEffects = ({
  contextProfile,
  currentSessionState,
  enabled,
  isQuickVoteEnabled,
  pendingDropIdsRef,
  stateKey,
  stopActiveSync,
  syncUndiscoveredWindow,
  waveId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly currentSessionState: MemesQuickVoteSessionState;
  readonly enabled: boolean;
  readonly isQuickVoteEnabled: boolean;
  readonly pendingDropIdsRef: { current: readonly string[] };
  readonly stateKey: string;
  readonly stopActiveSync: () => void;
  readonly syncUndiscoveredWindow: () => Promise<void>;
  readonly waveId: string | null;
}) => {
  useEffect(() => {
    stopActiveSync();

    if (!enabled || !isQuickVoteEnabled || !contextProfile || waveId === null) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      void syncUndiscoveredWindow();
    }, 0);

    return () => {
      globalThis.clearTimeout(timeoutId);
      stopActiveSync();
    };
  }, [
    contextProfile,
    enabled,
    isQuickVoteEnabled,
    stateKey,
    stopActiveSync,
    syncUndiscoveredWindow,
    waveId,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      currentSessionState.isLoading ||
      currentSessionState.hasDiscoveryError ||
      currentSessionState.isExhausted
    ) {
      return;
    }

    const shouldContinueSync =
      currentSessionState.recentlyHandledDropIds.length > 0 ||
      (pendingDropIdsRef.current.length > 0 &&
        currentSessionState.currentDrop === null);

    if (!shouldContinueSync) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      void syncUndiscoveredWindow();
    }, 300);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [
    currentSessionState.currentDrop,
    currentSessionState.hasDiscoveryError,
    currentSessionState.isExhausted,
    currentSessionState.isLoading,
    currentSessionState.recentlyHandledDropIds.length,
    enabled,
    pendingDropIdsRef,
    syncUndiscoveredWindow,
  ]);

  useEffect(
    () => () => {
      stopActiveSync();
    },
    [stopActiveSync]
  );
};

const useMemesQuickVoteSessionState = ({
  contextProfile,
  enabled,
  isQuickVoteEnabled,
  isSettingsLoaded,
  pendingDropIdsRef,
  stateKey,
  waveId,
}: UseMemesQuickVoteSessionStateOptions): UseMemesQuickVoteSessionStateResult => {
  const { currentSessionState, setCurrentSessionState } =
    useKeyedMemesQuickVoteSessionStore(stateKey);
  const { stopActiveSync, syncUndiscoveredWindow } =
    useMemesQuickVoteWindowSync({
      contextProfile,
      enabled,
      isQuickVoteEnabled,
      isSettingsLoaded,
      pendingDropIdsRef,
      setCurrentSessionState,
      waveId,
    });

  useMemesQuickVoteSessionEffects({
    contextProfile,
    currentSessionState,
    enabled,
    isQuickVoteEnabled,
    pendingDropIdsRef,
    stateKey,
    stopActiveSync,
    syncUndiscoveredWindow,
    waveId,
  });

  const advanceVisibleDrop = useCallback(
    (drop: ExtendedDrop) => {
      setCurrentSessionState((current) =>
        applyOptimisticAdvanceState({
          current,
          dropId: drop.id,
          pendingDropIds: pendingDropIdsRef.current,
        })
      );
      void syncUndiscoveredWindow();
    },
    [pendingDropIdsRef, setCurrentSessionState, syncUndiscoveredWindow]
  );

  const restoreFailedDrop = useCallback(
    (drop: ExtendedDrop) => {
      setCurrentSessionState((current) =>
        applyFailedDropRestoreState({
          current,
          failedDrop: drop,
        })
      );
      void syncUndiscoveredWindow();
    },
    [setCurrentSessionState, syncUndiscoveredWindow]
  );

  return {
    advanceVisibleDrop,
    restoreFailedDrop,
    sessionState: currentSessionState,
    syncUndiscoveredWindow,
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
  const [optimisticRemainingPowerState, setOptimisticRemainingPowerState] =
    useState<KeyedOptimisticRemainingPowerState>(() =>
      createInitialOptimisticRemainingPowerState(stateKey)
    );
  const { recentAmountsByRecency, setAndPersistRecentAmounts } =
    useMemesQuickVoteStorage({
      contextProfile,
      memesWaveId,
    });
  const pendingDropIdsRef = useRef<readonly string[]>([]);
  const session = useMemesQuickVoteSessionState({
    contextProfile,
    enabled,
    isQuickVoteEnabled,
    isSettingsLoaded,
    pendingDropIdsRef,
    stateKey,
    waveId,
  });

  const invalidateQuickVoteUndiscoveredDrop = useCallback(() => {
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
            readonly waveId?: string | null;
          };

          return (
            undiscoveredQuery.context_profile === (contextProfile ?? null) &&
            undiscoveredQuery.proxyId === (proxyId ?? null) &&
            undiscoveredQuery.waveId === waveId
          );
        },
      })
      .catch(() => {
        // Query invalidation is best-effort. The next footer read will recover.
      });
  }, [contextProfile, proxyId, queryClient, waveId]);

  const { pendingDropIds, submitSkip, submitVote } = useMemesQuickVoteSubmit({
    onRatingFailure: (drop, _amount, type) => {
      session.restoreFailedDrop(drop);

      if (type === "vote") {
        setOptimisticRemainingPowerState(
          createInitialOptimisticRemainingPowerState(stateKey)
        );
      }

      invalidateQuickVoteUndiscoveredDrop();
    },
    onRatingQueued: (drop) => {
      session.advanceVisibleDrop(drop);
    },
    onRatingSuccess: (_drop, _amount, nextRemainingPower, type) => {
      if (type === "vote") {
        setOptimisticRemainingPowerState({
          key: stateKey,
          value: nextRemainingPower,
        });
      }

      invalidateQuickVoteUndiscoveredDrop();
      void session.syncUndiscoveredWindow();
    },
    requestAuth,
    setAndPersistRecentAmounts,
    setToast,
  });

  useEffect(() => {
    pendingDropIdsRef.current = pendingDropIds;
  }, [pendingDropIds]);

  const activeApiDrop = session.sessionState.currentDrop;
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
  const latestUsedAmount = recentAmountsByRecency.at(-1) ?? null;
  const recentAmounts = getDisplayQuickVoteAmounts(recentAmountsByRecency);

  return {
    activeDrop,
    hasDiscoveryError: session.sessionState.hasDiscoveryError,
    isExhausted: session.sessionState.isExhausted,
    isLoading: session.sessionState.isLoading && activeDrop === null,
    isReady: activeDrop !== null,
    latestUsedAmount,
    recentAmounts,
    remainingCount: session.sessionState.totalCount,
    retryDiscovery: () => {
      void session.syncUndiscoveredWindow();
    },
    skipDrop: submitSkip,
    submitVote,
    uncastPower: activeDrop?.context_profile_context?.max_rating ?? null,
    votingLabel: activeDrop
      ? WAVE_VOTING_LABELS[activeDrop.wave.voting_credit_type]
      : null,
  };
};
