"use client";

import { usePrefetchMemesQuickVote } from "@/hooks/usePrefetchMemesQuickVote";
import { useCallback, useRef, useState } from "react";

type UseMemesQuickVoteDialogControllerResult = {
  readonly closeQuickVote: () => void;
  readonly isQuickVoteOpen: boolean;
  readonly openQuickVote: () => void;
  readonly prefetchQuickVote: () => void;
  readonly quickVoteSessionId: number;
};

export const useMemesQuickVoteDialogController =
  (): UseMemesQuickVoteDialogControllerResult => {
    const prefetchMemesQuickVote = usePrefetchMemesQuickVote();
    const [isQuickVoteOpen, setIsQuickVoteOpen] = useState(false);
    const [quickVoteSessionId, setQuickVoteSessionId] = useState(0);
    const lastIssuedSessionIdRef = useRef(0);
    const reservedSessionIdRef = useRef<number | null>(null);
    const prefetchedSessionIdsRef = useRef(new Set<number>());

    const reserveSessionId = useCallback(() => {
      if (reservedSessionIdRef.current !== null) {
        return reservedSessionIdRef.current;
      }

      const nextSessionId = lastIssuedSessionIdRef.current + 1;
      reservedSessionIdRef.current = nextSessionId;
      return nextSessionId;
    }, []);

    const prefetchQuickVote = useCallback(() => {
      const sessionId = reserveSessionId();

      if (prefetchedSessionIdsRef.current.has(sessionId)) {
        return;
      }

      prefetchedSessionIdsRef.current.add(sessionId);
      void prefetchMemesQuickVote(sessionId);
    }, [prefetchMemesQuickVote, reserveSessionId]);

    const openQuickVote = useCallback(() => {
      const sessionId =
        reservedSessionIdRef.current ?? lastIssuedSessionIdRef.current + 1;

      lastIssuedSessionIdRef.current = sessionId;
      reservedSessionIdRef.current = null;
      setQuickVoteSessionId(sessionId);
      setIsQuickVoteOpen(true);
    }, []);

    const closeQuickVote = useCallback(() => {
      setIsQuickVoteOpen(false);
    }, []);

    return {
      closeQuickVote,
      isQuickVoteOpen,
      openQuickVote,
      prefetchQuickVote,
      quickVoteSessionId,
    };
  };
