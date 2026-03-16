"use client";

import { useEffect, useRef, useState } from "react";
import { useMyStreamWaveMessages } from "@/contexts/wave/MyStreamContext";

import type { Drop } from "@/helpers/waves/drop.helpers";
import type { WaveMessages } from "@/contexts/wave/hooks/types";
import { useDropMessages } from "./useDropMessages";

interface VirtualizedWaveMessages extends Omit<WaveMessages, "drops"> {
  readonly drops: Drop[];
  readonly allDropsCount: number;
  readonly loadMoreLocally: () => void;
  readonly hasMoreLocal: boolean;
  readonly fetchNextPageForDrop: DropMessagesResult["fetchNextPage"];
  readonly waitAndRevealDrop: (
    serialNo: number,
    maxWaitTimeMs?: number,
    pollIntervalMs?: number
  ) => Promise<boolean>;
}

interface VirtualLimitState {
  readonly scopeKey: string;
  readonly limit: number;
}

interface AppendTrackingState {
  readonly scopeKey: string;
  readonly hasInitialized: boolean;
  readonly previousTotal: number;
  readonly effectiveLimit: number;
}

interface WaveMessagesSnapshot {
  readonly waveId: string;
  readonly messages: WaveMessages | null;
}

type DropMessagesResult = ReturnType<typeof useDropMessages>;
type ActiveMessages = WaveMessages | DropMessagesResult;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getScopeKey = ({
  waveId,
  dropId,
  pageSize,
}: {
  readonly waveId: string;
  readonly dropId: string | null;
  readonly pageSize: number;
}) => `${waveId}:${dropId ?? ""}:${pageSize}`;

const createAppendTrackingState = (
  scopeKey: string,
  effectiveLimit: number
): AppendTrackingState => ({
  scopeKey,
  hasInitialized: false,
  previousTotal: 0,
  effectiveLimit,
});

const isSameAppendTrackingState = (
  currentState: AppendTrackingState,
  nextState: AppendTrackingState
): boolean =>
  currentState.scopeKey === nextState.scopeKey &&
  currentState.hasInitialized === nextState.hasInitialized &&
  currentState.previousTotal === nextState.previousTotal &&
  currentState.effectiveLimit === nextState.effectiveLimit;

const getScopedVirtualLimit = ({
  scopeKey,
  virtualLimitState,
  pageSize,
}: {
  readonly scopeKey: string;
  readonly virtualLimitState: VirtualLimitState;
  readonly pageSize: number;
}): number =>
  virtualLimitState.scopeKey === scopeKey ? virtualLimitState.limit : pageSize;

const resolveFullWaveMessagesSnapshot = ({
  waveId,
  fullWaveMessages,
  fullWaveMessagesSnapshot,
}: {
  readonly waveId: string;
  readonly fullWaveMessages: WaveMessages | undefined;
  readonly fullWaveMessagesSnapshot: WaveMessagesSnapshot;
}): WaveMessagesSnapshot => {
  if (fullWaveMessages) {
    return {
      waveId,
      messages: fullWaveMessages,
    };
  }

  if (fullWaveMessagesSnapshot.waveId === waveId) {
    return fullWaveMessagesSnapshot;
  }

  return {
    waveId,
    messages: null,
  };
};

const getNextVirtualLimitAfterAppend = ({
  currentLimit,
  hasInitialized,
  pageSize,
  previousTotal,
  totalDrops,
}: {
  readonly currentLimit: number;
  readonly hasInitialized: boolean;
  readonly pageSize: number;
  readonly previousTotal: number;
  readonly totalDrops: number;
}): number => {
  if (!hasInitialized || previousTotal <= 0 || totalDrops <= previousTotal) {
    return currentLimit;
  }

  if (currentLimit >= totalDrops) {
    return currentLimit;
  }

  return Math.min(totalDrops, currentLimit + pageSize);
};

export function useVirtualizedWaveMessages(
  waveId: string,
  dropId: string | null,
  pageSize: number = 50
): VirtualizedWaveMessages | undefined {
  const fullWaveMessages = useMyStreamWaveMessages(waveId);
  const fullWaveMessagesForDrop = useDropMessages(waveId, dropId);
  const fetchNextPageForDrop = fullWaveMessagesForDrop.fetchNextPage;

  const scopeKey = getScopeKey({ waveId, dropId, pageSize });

  const [fullWaveMessagesSnapshot, setFullWaveMessagesSnapshot] =
    useState<WaveMessagesSnapshot>(() => ({
      waveId,
      messages: fullWaveMessages ?? null,
    }));
  const [appendTrackingState, setAppendTrackingState] =
    useState<AppendTrackingState>(() =>
      createAppendTrackingState(scopeKey, pageSize)
    );
  const scopedAppendTrackingState =
    appendTrackingState.scopeKey === scopeKey
      ? appendTrackingState
      : createAppendTrackingState(scopeKey, pageSize);
  const latestScopeKeyRef = useRef(scopeKey);
  const latestActiveMessagesRef = useRef<ActiveMessages | null>(null);
  const latestEffectiveLimitRef = useRef(pageSize);

  const [virtualLimitState, setVirtualLimitState] = useState<VirtualLimitState>(
    () => ({
      scopeKey,
      limit: pageSize,
    })
  );

  const resolvedFullWaveMessagesSnapshot = resolveFullWaveMessagesSnapshot({
    waveId,
    fullWaveMessages,
    fullWaveMessagesSnapshot,
  });

  if (
    resolvedFullWaveMessagesSnapshot.waveId !==
      fullWaveMessagesSnapshot.waveId ||
    resolvedFullWaveMessagesSnapshot.messages !==
      fullWaveMessagesSnapshot.messages
  ) {
    setFullWaveMessagesSnapshot(resolvedFullWaveMessagesSnapshot);
  }

  const activeFullWaveMessages =
    fullWaveMessages ??
    (resolvedFullWaveMessagesSnapshot.waveId === waveId
      ? resolvedFullWaveMessagesSnapshot.messages
      : null);
  const activeDropMessages = dropId ? fullWaveMessagesForDrop : null;
  const activeMessages = activeDropMessages ?? activeFullWaveMessages;
  const virtualLimit = getScopedVirtualLimit({
    scopeKey,
    virtualLimitState,
    pageSize,
  });
  const persistedEffectiveLimit = scopedAppendTrackingState.effectiveLimit;
  const baseVirtualLimit = Math.max(virtualLimit, persistedEffectiveLimit);
  const effectiveVirtualLimit = activeMessages
    ? getNextVirtualLimitAfterAppend({
        currentLimit: baseVirtualLimit,
        hasInitialized: scopedAppendTrackingState.hasInitialized,
        pageSize,
        previousTotal: scopedAppendTrackingState.previousTotal,
        totalDrops: activeMessages.drops.length,
      })
    : baseVirtualLimit;
  const hasMoreLocal = activeMessages
    ? activeMessages.drops.length > effectiveVirtualLimit
    : false;

  const nextAppendTrackingState = activeMessages
    ? {
        scopeKey,
        previousTotal: activeMessages.drops.length,
        hasInitialized:
          scopedAppendTrackingState.hasInitialized ||
          activeMessages.drops.length > 0,
        effectiveLimit: effectiveVirtualLimit,
      }
    : createAppendTrackingState(scopeKey, pageSize);

  if (
    !isSameAppendTrackingState(appendTrackingState, nextAppendTrackingState)
  ) {
    setAppendTrackingState(nextAppendTrackingState);
  }

  useEffect(() => {
    latestScopeKeyRef.current = scopeKey;
    latestActiveMessagesRef.current = activeMessages ?? null;
    latestEffectiveLimitRef.current = effectiveVirtualLimit;
  }, [activeMessages, effectiveVirtualLimit, scopeKey]);

  const loadMoreLocally = () => {
    if (latestScopeKeyRef.current !== scopeKey) {
      return;
    }

    setVirtualLimitState((currentState) => {
      const totalDrops = latestActiveMessagesRef.current?.drops.length ?? 0;
      const currentLimit =
        currentState.scopeKey === scopeKey
          ? Math.max(currentState.limit, latestEffectiveLimitRef.current)
          : latestEffectiveLimitRef.current;

      return {
        scopeKey,
        limit:
          totalDrops > currentLimit ? currentLimit + pageSize : currentLimit,
      };
    });
  };

  const revealDrop = (serialNo: number) => {
    if (latestScopeKeyRef.current !== scopeKey) {
      return;
    }

    const activeDrops = latestActiveMessagesRef.current?.drops;
    if (!activeDrops) {
      return;
    }

    const index = activeDrops.findIndex((drop) => drop.serial_no === serialNo);
    if (index === -1) {
      return;
    }

    const maxIndex = activeDrops.length - 1;
    const targetIndex = Math.min(index + 30, maxIndex);

    setVirtualLimitState((currentState) => {
      const currentLimit =
        currentState.scopeKey === scopeKey
          ? Math.max(currentState.limit, latestEffectiveLimitRef.current)
          : latestEffectiveLimitRef.current;

      return {
        scopeKey,
        limit: Math.max(currentLimit, targetIndex + 1),
      };
    });
  };

  const waitAndRevealDrop = async (
    serialNo: number,
    maxWaitTimeMs: number = 3000,
    pollIntervalMs: number = 100
  ) => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTimeMs) {
      if (latestScopeKeyRef.current !== scopeKey) {
        return false;
      }

      if (
        latestActiveMessagesRef.current?.drops.some(
          (drop) => drop.serial_no === serialNo
        )
      ) {
        revealDrop(serialNo);
        return true;
      }
      await delay(pollIntervalMs);
    }
    console.warn(
      `useVirtualizedWaveMessages: Timed out after ${maxWaitTimeMs}ms waiting for serialNo ${serialNo} in wave ${waveId}`
    );
    return false;
  };

  if (!activeMessages) {
    return undefined;
  }

  const virtualizedDrops = activeMessages.drops.slice(0, effectiveVirtualLimit);
  const allDropsCount = activeMessages.drops.length;

  if (activeDropMessages) {
    return {
      hasNextPage: activeDropMessages.hasNextPage,
      id: waveId,
      isLoading: activeDropMessages.isFetching,
      isLoadingNextPage: activeDropMessages.isFetchingNextPage,
      latestFetchedSerialNo: activeDropMessages.drops.at(-1)?.serial_no ?? null,
      drops: virtualizedDrops,
      allDropsCount,
      loadMoreLocally,
      hasMoreLocal,
      fetchNextPageForDrop,
      waitAndRevealDrop,
    };
  }

  const visibleFullWaveMessages = activeMessages as WaveMessages;

  return {
    hasNextPage: visibleFullWaveMessages.hasNextPage,
    id: waveId,
    isLoading: visibleFullWaveMessages.isLoading,
    isLoadingNextPage: visibleFullWaveMessages.isLoadingNextPage,
    latestFetchedSerialNo: visibleFullWaveMessages.latestFetchedSerialNo,
    drops: virtualizedDrops,
    allDropsCount,
    loadMoreLocally,
    hasMoreLocal,
    fetchNextPageForDrop,
    waitAndRevealDrop,
  };
}
