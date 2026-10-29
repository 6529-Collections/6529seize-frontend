"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  applyFailedDropRestoreState,
  applyFetchedWindowState,
  applyOptimisticAdvanceState,
  createInitialSessionState,
  getUniqueDrops,
  type MemesQuickVoteSessionState,
} from "@/hooks/memesQuickVote.queue.state";
import {
  fetchMemesQuickVoteUndiscoveredDrops,
  getMemesQuickVoteUndiscoveredDropQueryKey,
} from "@/hooks/memesQuickVote.query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

type KeyedSessionState = {
  readonly key: string;
  readonly value: MemesQuickVoteSessionState;
};

type UseMemesQuickVoteSessionStateOptions = {
  readonly contextProfile: string | null | undefined;
  readonly proxyId: string | null;
  readonly enabled: boolean;
  readonly isQuickVoteEnabled: boolean;
  readonly isSettingsLoaded: boolean;
  readonly pendingDropIdsRef: { current: readonly string[] };
  readonly stateKey: string;
  readonly waveId: string | null;
};

export type UseMemesQuickVoteSessionStateResult = {
  readonly advanceVisibleDrop: (drop: ExtendedDrop) => void;
  readonly restoreFailedDrop: (drop: ExtendedDrop) => void;
  readonly sessionState: MemesQuickVoteSessionState;
  readonly syncUndiscoveredWindow: () => Promise<boolean>;
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

export const runBestEffortSync = (sync: () => Promise<unknown>): void => {
  sync().catch(() => {
    // Session state already models sync failures; callers should not block on this.
  });
};

const QUICK_VOTE_RESTART_TIMEOUT_MS = 3000;

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
  proxyId,
  enabled,
  isQuickVoteEnabled,
  isSettingsLoaded,
  pendingDropIdsRef,
  setCurrentSessionState,
  waveId,
}: UseMemesQuickVoteWindowSyncOptions) => {
  const queryClient = useQueryClient();
  const syncAbortControllerRef = useRef<AbortController | null>(null);
  const syncInFlightRef = useRef<boolean>(false);
  const syncRequestIdRef = useRef(0);
  const syncRerunRequestedRef = useRef<boolean>(false);
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
    syncInFlightRef.current = false;
    syncRerunRequestedRef.current = false;
    syncAbortControllerRef.current?.abort();
    syncAbortControllerRef.current = null;
    clearSyncRetryTimeout();
  }, [clearSyncRetryTimeout]);

  const syncUndiscoveredWindow = useCallback(
    async function syncWindow(): Promise<boolean> {
      if (syncInFlightRef.current) {
        syncRerunRequestedRef.current = true;
        return false;
      }

      if (!enabled) {
        return false;
      }

      if (isSettingsLoaded && !isQuickVoteEnabled) {
        setCurrentSessionState({
          ...createInitialSessionState(),
          isExhausted: true,
        });
        return false;
      }

      if (!isQuickVoteEnabled || !contextProfile || waveId === null) {
        return false;
      }

      syncInFlightRef.current = true;
      syncRerunRequestedRef.current = false;
      const requestId = syncRequestIdRef.current + 1;
      syncRequestIdRef.current = requestId;
      const abortController = new AbortController();
      syncAbortControllerRef.current = abortController;
      const isCurrentRequest = () =>
        !abortController.signal.aborted &&
        syncRequestIdRef.current === requestId;

      setCurrentSessionState(getQuickVoteSyncPendingState);

      try {
        const response = await fetchMemesQuickVoteUndiscoveredDrops({
          signal: abortController.signal,
          waveId,
        });
        if (!isCurrentRequest()) {
          return false;
        }
        const footerQueryKey = getMemesQuickVoteUndiscoveredDropQueryKey({
          contextProfile,
          proxyId,
          sessionId: 0,
          skip: 0,
          waveId,
        });
        await queryClient.cancelQueries({
          queryKey: footerQueryKey,
          exact: true,
        });
        if (!isCurrentRequest()) {
          return false;
        }
        const primaryDrop = response.drops[0] ?? null;
        const rawLeftThisRoundCount = response.left_to_vote_in_current_round;
        const rawUnratedCount = response.total_count;
        const fetchedDrops = getUniqueDrops(response.drops);
        queryClient.setQueryData(footerQueryKey, {
          drop: primaryDrop,
          left_to_vote_in_current_round: rawLeftThisRoundCount,
          total_count: rawUnratedCount,
        });

        setCurrentSessionState((current) =>
          applyFetchedWindowState({
            current,
            fetchedDrops,
            pendingDropIds: pendingDropIdsRef.current,
            primaryDrop,
            rawLeftThisRoundCount,
            rawUnratedCount,
          })
        );
        return true;
      } catch {
        if (!isCurrentRequest()) {
          return false;
        }

        setCurrentSessionState(getQuickVoteSyncFailureState);
        return false;
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
      setCurrentSessionState,
      waveId,
    ]
  );

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
  readonly syncUndiscoveredWindow: () => Promise<boolean>;
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
      currentSessionState.recentlyHandledDropIds.length > 0 ||
      (pendingDropIdsRef.current.length > 0 &&
        currentSessionState.currentDrop === null);

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
    currentSessionState.isLoading,
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
  proxyId,
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
      proxyId,
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
    setCurrentSessionState,
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
      runBestEffortSync(syncUndiscoveredWindow);
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
