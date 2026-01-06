"use client";

import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { useMyStreamWaveMessages } from "@/contexts/wave/MyStreamContext";

import type { Drop } from "@/helpers/waves/drop.helpers";
import type { WaveMessages } from "@/contexts/wave/hooks/types";
import { useDropMessages } from "./useDropMessages";

interface VirtualizedWaveMessages extends Omit<WaveMessages, "drops"> {
  readonly drops: Drop[];
  readonly allDropsCount: number;
  readonly loadMoreLocally: () => void;
  readonly hasMoreLocal: boolean;
  readonly fetchNextPageForDrop: () => void;
  readonly waitAndRevealDrop: (
    serialNo: number,
    maxWaitTimeMs?: number,
    pollIntervalMs?: number
  ) => Promise<boolean>;
}

const getShouldRefresh = (old: Drop[], newDrops: Drop[]) => {
  for (const newDrop of newDrops) {
    const oldDrop = old.find(
      (oldDrop) => oldDrop.serial_no === newDrop.serial_no
    );
    if (oldDrop && "reactions" in oldDrop && "reactions" in newDrop) {
      if (oldDrop.reactions !== newDrop.reactions) {
        return true;
      }
    }
  }
  return false;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useVirtualizedWaveMessages(
  waveId: string,
  dropId: string | null,
  pageSize: number = 50
): VirtualizedWaveMessages | undefined {
  const fullWaveMessages = useMyStreamWaveMessages(waveId);

  const fullWaveMessagesRef = useRef<WaveMessages | null>(null);

  const [, forceRefresh] = useReducer((prev: number) => prev + 1, 0);

  useEffect(() => {
    const shouldRefresh = getShouldRefresh(
      fullWaveMessagesRef.current?.drops ?? [],
      fullWaveMessages?.drops ?? []
    );

    fullWaveMessagesRef.current = fullWaveMessages ?? null;
    if (shouldRefresh) {
      forceRefresh();
    }
  }, [fullWaveMessages]);

  const fullWaveMessagesForDrop = useDropMessages(waveId, dropId);

  const [virtualLimit, setVirtualLimit] = useState<number>(pageSize);

  const [hasMoreLocal, setHasMoreLocal] = useState<boolean>(false);

  const hasInitialized = useRef<boolean>(false);
  const previousDropsCountRef = useRef<number>(0);

  useEffect(() => {
    const activeMessages = dropId
      ? fullWaveMessagesForDrop
      : fullWaveMessages ?? fullWaveMessagesRef.current;

    if (activeMessages) {
      const totalDrops = activeMessages.drops.length;
      setHasMoreLocal(totalDrops > virtualLimit);

      if (!hasInitialized.current && totalDrops > 0) {
        hasInitialized.current = true;
      }
    } else {
      setHasMoreLocal(false);
      hasInitialized.current = false;
    }
  }, [
    dropId,
    fullWaveMessages,
    virtualLimit,
    fullWaveMessagesForDrop,
  ]);

  useEffect(() => {
    setVirtualLimit(pageSize);
    hasInitialized.current = false;
    previousDropsCountRef.current = 0;
  }, [waveId, pageSize, dropId]);

  useEffect(() => {
    const activeWaveMessages = dropId
      ? fullWaveMessagesForDrop
      : fullWaveMessages;

    if (!activeWaveMessages) {
      previousDropsCountRef.current = 0;
      return;
    }

    const totalDrops = activeWaveMessages.drops.length;
    const previousTotal = previousDropsCountRef.current;

    if (hasInitialized.current && previousTotal > 0 && totalDrops > previousTotal) {
      setVirtualLimit((currentLimit) => {
        if (currentLimit >= totalDrops) {
          return currentLimit;
        }

        const nextLimit = Math.min(totalDrops, currentLimit + pageSize);
        return nextLimit;
      });
    }

    previousDropsCountRef.current = totalDrops;
  }, [dropId, fullWaveMessages, fullWaveMessagesForDrop, pageSize]);

  const loadMoreLocally = useCallback(() => {
    setVirtualLimit((prevLimit) => {
      const messages = dropId
        ? fullWaveMessagesForDrop
        : fullWaveMessagesRef.current;
      const totalDrops = messages?.drops.length ?? 0;

      return totalDrops > prevLimit ? prevLimit + pageSize : prevLimit;
    });
  }, [pageSize, fullWaveMessagesForDrop, dropId]);

  const revealDrop = useCallback(
    (serialNo: number) => {
      if (fullWaveMessagesRef.current) {
        const index = fullWaveMessagesRef.current.drops.findIndex(
          (drop) => drop.serial_no === serialNo
        );

        if (index !== -1) {
          const maxIndex = fullWaveMessagesRef.current.drops.length - 1;
          const targetIndex = Math.min(index + 30, maxIndex);
          setVirtualLimit(targetIndex + 1);
        }
      }
    },
    []
  );

  const waitAndRevealDrop = useCallback(
    async (
      serialNo: number,
      maxWaitTimeMs: number = 3000,
      pollIntervalMs: number = 100
    ) => {
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitTimeMs) {
        if (
          fullWaveMessagesRef?.current?.drops?.some(
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
    },
    [revealDrop, waveId]
  );

  if (dropId && !fullWaveMessagesForDrop) {
    return undefined;
  }

  if (!fullWaveMessagesRef.current) {
    return undefined;
  }

  const virtualizedDrops = dropId
    ? fullWaveMessagesForDrop.drops.slice(0, virtualLimit)
    : fullWaveMessagesRef.current.drops.slice(0, virtualLimit);

  const hasNextPage = dropId
    ? fullWaveMessagesForDrop.hasNextPage
    : fullWaveMessagesRef.current.hasNextPage;

  const isLoading = dropId
    ? fullWaveMessagesForDrop.isFetching
    : fullWaveMessagesRef.current.isLoading;

  const isLoadingNextPage = dropId
    ? fullWaveMessagesForDrop.isFetchingNextPage
    : fullWaveMessagesRef.current.isLoadingNextPage;

  const latestFetchedSerialNo = dropId
    ? fullWaveMessagesForDrop.drops.at(-1)?.serial_no ?? null
    : fullWaveMessagesRef.current.latestFetchedSerialNo;

  const allDropsCount = dropId
    ? fullWaveMessagesForDrop.drops.length
    : fullWaveMessagesRef.current.drops.length;

  return {
    hasNextPage,
    id: waveId,
    isLoading,
    isLoadingNextPage,
    latestFetchedSerialNo,
    drops: virtualizedDrops,
    allDropsCount,
    loadMoreLocally,
    hasMoreLocal,
    fetchNextPageForDrop: fullWaveMessagesForDrop.fetchNextPage,
    waitAndRevealDrop,
  };
}
