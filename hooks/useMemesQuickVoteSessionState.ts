"use client";

import type { ApiUndiscoveredDrop } from "@/generated/models/ApiUndiscoveredDrop";
import { type QueryState, useQueryClient } from "@tanstack/react-query";
import { isMemesQuickVoteVoteableDrop } from "@/hooks/memesQuickVote.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  applyFailedDropRestoreState,
  applyKnownRatedDrop,
  applyFetchedWindowState,
  applyOptimisticAdvanceState,
  createInitialSessionState,
  getUniqueDrops,
  type MemesQuickVoteSessionState,
} from "@/hooks/memesQuickVote.queue.state";
import {
  fetchMemesQuickVoteUndiscoveredDrop,
  fetchMemesQuickVoteUndiscoveredDrops,
  getMemesQuickVoteUndiscoveredDropQueryKey,
  MEMES_QUICK_VOTE_CACHE_TIME_MS,
  MEMES_QUICK_VOTE_LOOKAHEAD_COUNT,
  MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
} from "@/hooks/memesQuickVote.query";
import { useCallback, useEffect, useRef, useState } from "react";

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
  readonly proxyId: string | null | undefined;
  readonly stateKey: string;
  readonly waveId: string | null;
};

export type UseMemesQuickVoteSessionStateResult = {
  readonly advanceVisibleDrop: (drop: ExtendedDrop, isVote?: boolean) => void;
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
  readonly sessionStateRef: { current: MemesQuickVoteSessionState };
};

export const runBestEffortSync = (sync: () => Promise<void>): void => {
  sync().catch(() => {
    // Session state already models sync failures; callers should not block on this.
  });
};

// Allow a slow discovery request to complete before treating a restart as failed.
const QUICK_VOTE_RESTART_TIMEOUT_MS = 30_000;

const shouldRerunQuickVoteSync = ({
  abortController,
  rerunRequestedRef,
}: {
  readonly abortController: AbortController;
  readonly rerunRequestedRef: { current: boolean };
}): boolean => !abortController.signal.aborted && rerunRequestedRef.current;

const getQuickVoteSyncPendingState = (
  current: MemesQuickVoteSessionState
): MemesQuickVoteSessionState => ({
  ...current,
  hasDiscoveryError: false,
  isExhausted: false,
  isRestartingRound: current.isRestartingRound,
  isLoading: current.currentDrop === null,
});

const getQuickVoteSyncFailureState = (
  current: MemesQuickVoteSessionState
): MemesQuickVoteSessionState =>
  current.currentDrop
    ? {
        ...current,
        isRestartingRound: false,
        isLoading: false,
      }
    : {
        ...current,
        hasDiscoveryError: true,
        isExhausted: false,
        isRestartingRound: false,
        isLoading: false,
      };

const getCurrentSessionState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedSessionState;
}): MemesQuickVoteSessionState =>
  state.key === key ? state.value : createInitialSessionState();

const useKeyedMemesQuickVoteSessionStore = (
  stateKey: string,
  cached: QueryState<ApiUndiscoveredDrop> | undefined
): UseKeyedMemesQuickVoteSessionStoreResult => {
  const [sessionState, setSessionState] = useState<KeyedSessionState>(() => {
    const initialResponse =
      cached &&
      !cached.isInvalidated &&
      Date.now() - cached.dataUpdatedAt < MEMES_QUICK_VOTE_CACHE_TIME_MS
        ? cached.data
        : undefined;
    return {
      key: stateKey,
      value:
        initialResponse?.drop &&
        isMemesQuickVoteVoteableDrop(initialResponse.drop)
          ? applyFetchedWindowState({
              current: createInitialSessionState(),
              fetchedDrops: [initialResponse.drop],
              pendingDropIds: [],
              primaryDrop: initialResponse.drop,
              rawLeftThisRoundCount:
                initialResponse.left_to_vote_in_current_round,
              rawUnratedCount: initialResponse.total_count,
            })
          : createInitialSessionState(),
    };
  });

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
  proxyId,
  setCurrentSessionState,
  sessionStateRef,
  waveId,
}: UseMemesQuickVoteWindowSyncOptions) => {
  const queryClient = useQueryClient();
  const syncAbortControllerRef = useRef<AbortController | null>(null);
  const syncInFlightRef = useRef<boolean>(false);
  const syncRequestIdRef = useRef(0);
  const syncRerunRequestedRef = useRef<boolean>(false);
  const hasSyncedRef = useRef(false);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
    return () => {
      enabledRef.current = false;
    };
  }, [enabled]);
  const stopActiveSync = useCallback(() => {
    hasSyncedRef.current = false;
    syncRequestIdRef.current += 1;
    syncInFlightRef.current = false;
    syncRerunRequestedRef.current = false;
    syncAbortControllerRef.current?.abort();
    syncAbortControllerRef.current = null;
  }, []);

  const syncUndiscoveredWindow = useCallback(
    async function syncWindow() {
      if (syncInFlightRef.current) {
        syncRerunRequestedRef.current = true;
        return;
      }

      if (!enabledRef.current) {
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

      syncInFlightRef.current = true;
      syncRerunRequestedRef.current = false;
      const requestId = syncRequestIdRef.current + 1;
      syncRequestIdRef.current = requestId;
      const abortController = new AbortController();
      syncAbortControllerRef.current = abortController;

      const reusePrimary = !hasSyncedRef.current;
      hasSyncedRef.current = true;
      setCurrentSessionState(getQuickVoteSyncPendingState);

      try {
        // Reuse the footer's first drop and in-flight request. Each successful
        // response is usable immediately; a failed lookahead is not a queue error.
        const responses: (ApiUndiscoveredDrop | undefined)[] = [];
        const buffered = sessionStateRef.current;
        const nextSkip = Math.max(
          1,
          buffered.lookaheadDrops.length + (buffered.currentDrop ? 1 : 0)
        );
        const requestCount = Math.max(
          1,
          MEMES_QUICK_VOTE_LOOKAHEAD_COUNT - nextSkip + 1
        );
        const publishResponses = () => {
          if (
            abortController.signal.aborted ||
            syncRequestIdRef.current !== requestId
          )
            return;
          const primary = responses[0] ?? responses.find(Boolean);
          if (!primary) return;
          setCurrentSessionState((current) =>
            applyFetchedWindowState({
              current,
              handledDropIdsAtRequest: buffered.recentlyHandledDropIds,
              fetchedDrops: getUniqueDrops(
                responses.flatMap((item) => (item?.drop ? [item.drop] : []))
              ),
              pendingDropIds: pendingDropIdsRef.current,
              primaryDrop: primary.drop,
              rawLeftThisRoundCount: primary.left_to_vote_in_current_round,
              rawUnratedCount: primary.total_count,
              isPartial: responses.filter(Boolean).length < requestCount,
            })
          );
        };
        const primaryRequest = async () => {
          try {
            responses[0] = await queryClient.fetchQuery({
              queryKey: getMemesQuickVoteUndiscoveredDropQueryKey({
                contextProfile,
                proxyId,
                sessionId: 0,
                skip: 0,
                waveId,
              }),
              queryFn: ({ signal }) =>
                fetchMemesQuickVoteUndiscoveredDrop({
                  signal,
                  skip: 0,
                  waveId,
                }),
              staleTime: reusePrimary ? MEMES_QUICK_VOTE_CACHE_TIME_MS : 0,
              retry: false,
            });
            publishResponses();
          } catch {
            // A usable background window can still recover a failed primary.
          }
        };
        const lookaheadRequest = async () => {
          if (requestCount <= 1) return;
          try {
            const window = await fetchMemesQuickVoteUndiscoveredDrops({
              signal: abortController.signal,
              skip: nextSkip,
              limit: requestCount - 1,
              waveId,
            });
            if (
              abortController.signal.aborted ||
              syncRequestIdRef.current !== requestId
            )
              return;
            for (let index = 1; index < requestCount; index++) {
              const response: ApiUndiscoveredDrop = {
                drop: window.drops[index - 1] ?? null,
                total_count: window.total_count,
                left_to_vote_in_current_round:
                  window.left_to_vote_in_current_round,
              };
              responses[index] = response;
              // Preserve the individual candidate cache used by other voting
              // surfaces to retire already-rated buffered drops immediately.
              queryClient.setQueryData(
                getMemesQuickVoteUndiscoveredDropQueryKey({
                  contextProfile,
                  proxyId,
                  sessionId: 0,
                  skip: nextSkip + index - 1,
                  waveId,
                }),
                response
              );
            }
            publishResponses();
          } catch {
            // A failed background batch must not hide a ready primary candidate.
          }
        };
        await Promise.all([primaryRequest(), lookaheadRequest()]);
        if (
          abortController.signal.aborted ||
          syncRequestIdRef.current !== requestId
        )
          return;
        if (responses.filter(Boolean).length < requestCount) {
          setCurrentSessionState(getQuickVoteSyncFailureState);
        }
      } catch {
        if (
          abortController.signal.aborted ||
          syncRequestIdRef.current !== requestId
        ) {
          return;
        }

        setCurrentSessionState(getQuickVoteSyncFailureState);
      } finally {
        if (syncRequestIdRef.current === requestId) {
          if (syncAbortControllerRef.current === abortController) {
            syncAbortControllerRef.current = null;
          }

          syncInFlightRef.current = false;

          if (
            shouldRerunQuickVoteSync({
              abortController,
              rerunRequestedRef: syncRerunRequestedRef,
            })
          ) {
            syncRerunRequestedRef.current = false;
            runBestEffortSync(syncWindow);
          }
        }
      }
    },
    [
      contextProfile,
      enabled,
      isQuickVoteEnabled,
      isSettingsLoaded,
      pendingDropIdsRef,
      proxyId,
      queryClient,
      sessionStateRef,
      setCurrentSessionState,
      waveId,
    ]
  );

  return {
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
  setCurrentSessionState,
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
  readonly setCurrentSessionState: UseKeyedMemesQuickVoteSessionStoreResult["setCurrentSessionState"];
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
      runBestEffortSync(syncUndiscoveredWindow);
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
      currentSessionState.hasDiscoveryError ||
      currentSessionState.isExhausted
    ) {
      return;
    }

    const shouldContinueSync =
      currentSessionState.isRestartingRound ||
      (currentSessionState.currentDrop === null &&
        currentSessionState.recentlyHandledDropIds.length > 0 &&
        pendingDropIdsRef.current.length === 0);

    if (!shouldContinueSync) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      runBestEffortSync(syncUndiscoveredWindow);
    }, 300);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [
    currentSessionState.currentDrop,
    currentSessionState.hasDiscoveryError,
    currentSessionState.isExhausted,
    currentSessionState.isRestartingRound,
    currentSessionState.recentlyHandledDropIds.length,
    enabled,
    pendingDropIdsRef,
    syncUndiscoveredWindow,
  ]);

  useEffect(() => {
    if (!enabled || !currentSessionState.isRestartingRound) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      stopActiveSync();
      setCurrentSessionState((current) => {
        if (!current.isRestartingRound) {
          return current;
        }

        return {
          ...current,
          hasDiscoveryError: true,
          isLoading: false,
          isRestartingRound: false,
        };
      });
    }, QUICK_VOTE_RESTART_TIMEOUT_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [
    currentSessionState.isRestartingRound,
    enabled,
    setCurrentSessionState,
    stopActiveSync,
  ]);

  useEffect(
    () => () => {
      stopActiveSync();
    },
    [stopActiveSync]
  );
};

export const useMemesQuickVoteSessionState = ({
  contextProfile,
  enabled,
  isQuickVoteEnabled,
  isSettingsLoaded,
  pendingDropIdsRef,
  proxyId,
  stateKey,
  waveId,
}: UseMemesQuickVoteSessionStateOptions): UseMemesQuickVoteSessionStateResult => {
  const queryClient = useQueryClient();
  const cached = queryClient.getQueryState<ApiUndiscoveredDrop>(
    getMemesQuickVoteUndiscoveredDropQueryKey({
      contextProfile,
      proxyId,
      sessionId: 0,
      skip: 0,
      waveId,
    })
  );
  const { currentSessionState, setCurrentSessionState } =
    useKeyedMemesQuickVoteSessionStore(
      stateKey,
      isQuickVoteEnabled ? cached : undefined
    );
  // Retain a recently closed session, but do not keep old candidates indefinitely.
  // Pending submissions continue independently and known votes stay excluded.
  useEffect(() => {
    if (enabled) return;
    const timeoutId = globalThis.setTimeout(() => {
      setCurrentSessionState((current) => ({
        ...createInitialSessionState(),
        recentlyHandledDropIds: current.recentlyHandledDropIds,
        recentlyVotedDropIds: current.recentlyVotedDropIds,
      }));
    }, MEMES_QUICK_VOTE_CACHE_TIME_MS);
    return () => globalThis.clearTimeout(timeoutId);
  }, [enabled, setCurrentSessionState]);

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "success") return;
        const queryKey = event.query.queryKey as readonly unknown[];
        const key = queryKey[0];
        const scope = queryKey[1];
        if (
          key !== MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY ||
          typeof scope !== "object" ||
          scope === null ||
          !("context_profile" in scope) ||
          scope.context_profile !== contextProfile ||
          !("proxyId" in scope) ||
          scope.proxyId !== (proxyId ?? null) ||
          !("waveId" in scope) ||
          scope.waveId !== waveId
        )
          return;
        const response = event.query.state.data as
          | ApiUndiscoveredDrop
          | undefined;
        const rating = response?.drop?.context_profile_context?.rating;
        if (response?.drop && typeof rating === "number" && rating !== 0) {
          const ratedDrop = response.drop;
          setCurrentSessionState((current) =>
            applyKnownRatedDrop(current, ratedDrop)
          );
        }
      }),
    [contextProfile, proxyId, queryClient, setCurrentSessionState, waveId]
  );
  const sessionStateRef = useRef(currentSessionState);
  useEffect(() => {
    sessionStateRef.current = currentSessionState;
  }, [currentSessionState]);
  const { stopActiveSync, syncUndiscoveredWindow } =
    useMemesQuickVoteWindowSync({
      contextProfile,
      enabled,
      isQuickVoteEnabled,
      isSettingsLoaded,
      pendingDropIdsRef,
      proxyId,
      setCurrentSessionState,
      sessionStateRef,
      waveId,
    });

  useMemesQuickVoteSessionEffects({
    contextProfile,
    currentSessionState,
    enabled,
    isQuickVoteEnabled,
    pendingDropIdsRef,
    setCurrentSessionState,
    stateKey,
    stopActiveSync,
    syncUndiscoveredWindow,
    waveId,
  });

  const advanceVisibleDrop = useCallback(
    (drop: ExtendedDrop, isVote = false) => {
      setCurrentSessionState((current) =>
        applyOptimisticAdvanceState({
          isVote,
          current,
          dropId: drop.id,
          pendingDropIds: pendingDropIdsRef.current,
        })
      );
    },
    [pendingDropIdsRef, setCurrentSessionState]
  );

  const restoreFailedDrop = useCallback(
    (drop: ExtendedDrop) => {
      setCurrentSessionState((current) =>
        applyFailedDropRestoreState({
          current,
          failedDrop: drop,
        })
      );
      runBestEffortSync(syncUndiscoveredWindow);
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
