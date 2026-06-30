"use client";

import { useEffect, useRef } from "react";
import { useMemesQuickVoteDialogController } from "@/hooks/useMemesQuickVoteDialogController";
import MemesQuickVoteDialog from "./MemesQuickVoteDialog";

export type MemesQuickVoteRuntimeIntent = {
  readonly action: "open";
  readonly id: number;
};

export type MemesQuickVoteRuntimeProps = {
  readonly intent: MemesQuickVoteRuntimeIntent;
  readonly onIdle: () => void;
};

export default function MemesQuickVoteRuntime({
  intent,
  onIdle,
}: MemesQuickVoteRuntimeProps) {
  const quickVote = useMemesQuickVoteDialogController();
  const { openQuickVote } = quickVote;
  const handledIntentIdRef = useRef(0);
  const hasObservedOpenRef = useRef(false);

  useEffect(() => {
    if (intent.id <= handledIntentIdRef.current) {
      return;
    }

    handledIntentIdRef.current = intent.id;
    openQuickVote(intent.id);
  }, [intent, openQuickVote]);

  useEffect(() => {
    // First mount renders before open state lands; only tear down after an open was observed.
    if (quickVote.isQuickVoteOpen) {
      hasObservedOpenRef.current = true;
      return;
    }

    if (hasObservedOpenRef.current) {
      hasObservedOpenRef.current = false;
      onIdle();
    }
  }, [quickVote.isQuickVoteOpen, onIdle]);

  if (!quickVote.isQuickVoteOpen && quickVote.quickVoteSessionId === 0) {
    return null;
  }

  return <MemesQuickVoteDialog {...quickVote.dialogState} />;
}
