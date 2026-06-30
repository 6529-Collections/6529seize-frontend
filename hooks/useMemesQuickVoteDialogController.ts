"use client";

import {
  useMemesQuickVoteQueue,
  type UseMemesQuickVoteQueueResult,
} from "@/hooks/useMemesQuickVoteQueue";
import { useCallback, useRef, useState } from "react";

export type MemesQuickVoteDialogState = Pick<
  UseMemesQuickVoteQueueResult,
  | "activeDrop"
  | "hasDiscoveryError"
  | "isExhausted"
  | "isRestartingRound"
  | "leftThisRoundCount"
  | "latestUsedAmount"
  | "nextDrop"
  | "recentAmounts"
  | "retryDiscovery"
  | "submitVote"
  | "skipDrop"
  | "uncastPower"
  | "unratedCount"
  | "votingLabel"
> & {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly sessionId: number;
};

type UseMemesQuickVoteDialogControllerResult = {
  readonly closeQuickVote: () => void;
  readonly dialogState: MemesQuickVoteDialogState;
  readonly isQuickVoteOpen: boolean;
  readonly openQuickVote: (sessionIdOverride?: number) => void;
  readonly prefetchQuickVote: () => void;
  readonly quickVoteSessionId: number;
};

export const useMemesQuickVoteDialogController =
  (): UseMemesQuickVoteDialogControllerResult => {
    const [isQuickVoteOpen, setIsQuickVoteOpen] = useState(false);
    const [quickVoteSessionId, setQuickVoteSessionId] = useState(0);
    const lastIssuedSessionIdRef = useRef(0);
    const reservedSessionIdRef = useRef<number | null>(null);
    const quickVoteQueue = useMemesQuickVoteQueue({
      enabled: quickVoteSessionId > 0,
      sessionId: quickVoteSessionId,
    });
    const { retryDiscovery } = quickVoteQueue;

    const reserveSessionId = useCallback(() => {
      if (reservedSessionIdRef.current !== null) {
        return reservedSessionIdRef.current;
      }

      const nextSessionId = lastIssuedSessionIdRef.current + 1;
      reservedSessionIdRef.current = nextSessionId;
      return nextSessionId;
    }, []);

    const prefetchQuickVote = useCallback(() => {
      if (quickVoteSessionId > 0) {
        retryDiscovery();
        return;
      }

      const sessionId = reserveSessionId();
      lastIssuedSessionIdRef.current = sessionId;
      setQuickVoteSessionId(sessionId);
    }, [quickVoteSessionId, reserveSessionId, retryDiscovery]);

    const openQuickVote = useCallback(
      (sessionIdOverride?: number) => {
        if (quickVoteSessionId > 0) {
          retryDiscovery();
          setIsQuickVoteOpen(true);
          return;
        }

        const sessionId =
          sessionIdOverride ??
          reservedSessionIdRef.current ??
          lastIssuedSessionIdRef.current + 1;

        lastIssuedSessionIdRef.current = Math.max(
          lastIssuedSessionIdRef.current,
          sessionId
        );
        reservedSessionIdRef.current = null;
        setQuickVoteSessionId(sessionId);
        setIsQuickVoteOpen(true);
      },
      [quickVoteSessionId, retryDiscovery]
    );

    const closeQuickVote = useCallback(() => {
      setIsQuickVoteOpen(false);
    }, []);

    return {
      closeQuickVote,
      dialogState: {
        activeDrop: quickVoteQueue.activeDrop,
        hasDiscoveryError: quickVoteQueue.hasDiscoveryError,
        isExhausted: quickVoteQueue.isExhausted,
        isRestartingRound: quickVoteQueue.isRestartingRound,
        isOpen: isQuickVoteOpen,
        leftThisRoundCount: quickVoteQueue.leftThisRoundCount,
        latestUsedAmount: quickVoteQueue.latestUsedAmount,
        nextDrop: quickVoteQueue.nextDrop,
        onClose: closeQuickVote,
        recentAmounts: quickVoteQueue.recentAmounts,
        retryDiscovery: quickVoteQueue.retryDiscovery,
        sessionId: quickVoteSessionId,
        skipDrop: quickVoteQueue.skipDrop,
        submitVote: quickVoteQueue.submitVote,
        uncastPower: quickVoteQueue.uncastPower,
        unratedCount: quickVoteQueue.unratedCount,
        votingLabel: quickVoteQueue.votingLabel,
      },
      isQuickVoteOpen,
      openQuickVote,
      prefetchQuickVote,
      quickVoteSessionId,
    };
  };
