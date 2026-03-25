"use client";

import {
  appendSkippedDropId,
  MEMES_QUICK_VOTE_REPLENISH_THRESHOLD,
} from "@/hooks/memesQuickVote.helpers";
import {
  createInitialMemesQuickVoteDiscoveryState,
  deferMemesQuickVoteDropId,
  deriveMemesQuickVoteDiscoverySnapshot,
  getMemesQuickVoteActiveCandidateId,
  getMemesQuickVoteDiscoveredQueue,
  getMemesQuickVoteNextCandidateId,
  isMemesQuickVoteExhausted,
  type MemesQuickVoteDiscoveryPage,
  type MemesQuickVoteDiscoveryState,
  removeMemesQuickVoteDropId,
  shouldFetchMemesQuickVotePage,
} from "@/hooks/memesQuickVote.queue.helpers";
import {
  fetchMemesQuickVoteDiscoveryBatch,
  getMemesQuickVoteDiscoveryQueryKey,
  getMemesQuickVoteDiscoveryStateKey,
  type MemesQuickVoteDiscoveryQueryData,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

const EMPTY_DISCOVERY_PAGES: readonly MemesQuickVoteDiscoveryPage[] = [];

type KeyedMemesQuickVoteDiscoveryState = MemesQuickVoteDiscoveryState & {
  readonly fetchVersion: number;
  readonly key: string;
};

const createKeyedMemesQuickVoteDiscoveryState = (
  key: string
): KeyedMemesQuickVoteDiscoveryState => ({
  ...createInitialMemesQuickVoteDiscoveryState(),
  fetchVersion: 0,
  key,
});

const getCurrentMemesQuickVoteDiscoveryState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: KeyedMemesQuickVoteDiscoveryState;
}): KeyedMemesQuickVoteDiscoveryState =>
  state.key === key ? state : createKeyedMemesQuickVoteDiscoveryState(key);

const getMemesQuickVoteDiscoveryQueryKeyIdentity = (
  candidate: unknown
): string | null => {
  if (candidate === undefined || candidate === null) {
    return null;
  }

  if (typeof candidate !== "object" || !("identity" in candidate)) {
    return null;
  }

  const identity = candidate.identity;

  return typeof identity === "string" ? identity : null;
};

const shouldReuseDiscoveryPlaceholderData = ({
  identity,
  previousQuery,
}: {
  readonly identity: string;
  readonly previousQuery:
    | {
        readonly queryKey: readonly unknown[];
      }
    | undefined;
}): boolean => {
  const previousQueryIdentity = getMemesQuickVoteDiscoveryQueryKeyIdentity(
    previousQuery?.queryKey[1]
  );

  return previousQueryIdentity === identity;
};

const applyMemesQuickVoteDiscoveryStateUpdate = ({
  current,
  discoveryPages,
  discoveryStateKey,
  isDiscoveryEnabled,
  nextSkippedDropIds,
  transformState,
}: {
  readonly current: KeyedMemesQuickVoteDiscoveryState;
  readonly discoveryPages: readonly MemesQuickVoteDiscoveryPage[];
  readonly discoveryStateKey: string;
  readonly isDiscoveryEnabled: boolean;
  readonly nextSkippedDropIds: readonly string[];
  readonly transformState: (
    state: KeyedMemesQuickVoteDiscoveryState
  ) => MemesQuickVoteDiscoveryState;
}): KeyedMemesQuickVoteDiscoveryState => {
  const baseState = getCurrentMemesQuickVoteDiscoveryState({
    key: discoveryStateKey,
    state: current,
  });
  const nextState = transformState(baseState);

  if (nextState === baseState) {
    return baseState;
  }

  const nextSnapshot = deriveMemesQuickVoteDiscoverySnapshot({
    enabled: isDiscoveryEnabled,
    pages: discoveryPages,
    skippedDropIds: nextSkippedDropIds,
    state: nextState,
  });

  return {
    ...nextState,
    fetchVersion: shouldFetchMemesQuickVotePage({
      replenishThreshold: MEMES_QUICK_VOTE_REPLENISH_THRESHOLD,
      state: nextSnapshot,
    })
      ? baseState.fetchVersion + 1
      : baseState.fetchVersion,
    key: discoveryStateKey,
  };
};

export const useMemesQuickVoteDiscovery = ({
  enabled,
  sessionId,
  skippedDropIds,
}: {
  readonly enabled: boolean;
  readonly sessionId: number;
  readonly skippedDropIds: readonly string[];
}) => {
  const { contextProfile, isEnabled, memesWaveId } = useMemesQuickVoteContext();
  const waveId =
    typeof memesWaveId === "string" && memesWaveId.length > 0
      ? memesWaveId
      : null;
  const isDiscoveryEnabled = enabled && isEnabled;
  const discoveryStateKey = getMemesQuickVoteDiscoveryStateKey({
    contextProfile,
    enabled: isDiscoveryEnabled,
    memesWaveId: waveId,
    sessionId,
  });
  const [storedState, setStoredState] =
    useState<KeyedMemesQuickVoteDiscoveryState>(() =>
      createKeyedMemesQuickVoteDiscoveryState(discoveryStateKey)
    );
  const discoveryState = getCurrentMemesQuickVoteDiscoveryState({
    key: discoveryStateKey,
    state: storedState,
  });
  const queryKey = getMemesQuickVoteDiscoveryQueryKey({
    discoveryStateKey,
    fetchVersion: discoveryState.fetchVersion,
    waveId,
  });
  const fetchDiscoveryBatch = useCallback(
    async (): Promise<MemesQuickVoteDiscoveryQueryData> =>
      await fetchMemesQuickVoteDiscoveryBatch({
        discoveryState,
        skippedDropIds,
        waveId,
      }),
    [discoveryState, skippedDropIds, waveId]
  );

  const {
    data: discoveryData,
    isError: hasPageFetchError,
    isFetching: isFetchingPage,
    refetch: refetchDiscovery,
  } = useQuery({
    queryKey,
    enabled: isDiscoveryEnabled && waveId !== null,
    queryFn: fetchDiscoveryBatch,
    placeholderData: (previousData, previousQuery) =>
      shouldReuseDiscoveryPlaceholderData({
        identity: discoveryStateKey,
        previousQuery,
      })
        ? previousData
        : undefined,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const discoveryPages = discoveryData?.pages ?? EMPTY_DISCOVERY_PAGES;
  const discoverySnapshot = deriveMemesQuickVoteDiscoverySnapshot({
    enabled: isDiscoveryEnabled,
    pages: discoveryPages,
    skippedDropIds,
    state: discoveryState,
  });
  const activeCandidateId =
    getMemesQuickVoteActiveCandidateId(discoverySnapshot);
  const nextCandidateId = getMemesQuickVoteNextCandidateId(discoverySnapshot);
  const queue = getMemesQuickVoteDiscoveredQueue(discoverySnapshot);

  const removeDropId = useCallback(
    (dropId: string) => {
      setStoredState((current) =>
        applyMemesQuickVoteDiscoveryStateUpdate({
          current,
          discoveryPages,
          discoveryStateKey,
          isDiscoveryEnabled,
          nextSkippedDropIds: skippedDropIds.filter(
            (value) => value !== dropId
          ),
          transformState: (state) =>
            removeMemesQuickVoteDropId({ dropId, state }),
        })
      );
    },
    [discoveryPages, discoveryStateKey, isDiscoveryEnabled, skippedDropIds]
  );

  const deferDropId = useCallback(
    (dropId: string) => {
      setStoredState((current) =>
        applyMemesQuickVoteDiscoveryStateUpdate({
          current,
          discoveryPages,
          discoveryStateKey,
          isDiscoveryEnabled,
          nextSkippedDropIds: appendSkippedDropId(skippedDropIds, dropId),
          transformState: (state) =>
            deferMemesQuickVoteDropId({ dropId, state }),
        })
      );
    },
    [discoveryPages, discoveryStateKey, isDiscoveryEnabled, skippedDropIds]
  );

  const retryDiscovery = useCallback(() => {
    void refetchDiscovery();
  }, [refetchDiscovery]);

  const resyncDiscovery = useCallback(() => {
    setStoredState((current) => {
      const baseState = getCurrentMemesQuickVoteDiscoveryState({
        key: discoveryStateKey,
        state: current,
      });

      return {
        ...createInitialMemesQuickVoteDiscoveryState(),
        fetchVersion: baseState.fetchVersion + 1,
        key: discoveryStateKey,
      };
    });
  }, [discoveryStateKey]);

  return {
    activeCandidateId,
    deferredCount: discoverySnapshot.deferredIds.length,
    deferDropId,
    discoveredDropsById: discoverySnapshot.discoveredDropsById,
    hasPageFetchError,
    isExhausted: isMemesQuickVoteExhausted(discoverySnapshot),
    isFetchingPage,
    nextCandidateId,
    queue,
    removeDropId,
    resyncDiscovery,
    retryDiscovery,
    serverCount: discoverySnapshot.serverCount,
  };
};
