"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import {
  EMPTY_PURGE,
  getChatHistoryPurge,
  runChatHistoryPurge,
  subscribeChatHistoryPurge,
} from "@/services/waves/chat-history-purge";

export function useWaveChatHistoryPurge({
  waveId,
  profileId,
  onSettled,
}: {
  readonly waveId: string;
  readonly profileId: string;
  readonly onSettled: (completed: boolean, deletedCount: number) => void;
}) {
  const key = JSON.stringify([profileId, waveId]);
  const { requestAuth } = useAuth();
  const { processDropsRemoved, refreshWaveMessages } = useMyStream();
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const subscribe = useCallback(
    (listener: () => void) => subscribeChatHistoryPurge(key, listener),
    [key]
  );
  const snapshot = useCallback(() => getChatHistoryPurge(key), [key]);
  const state = useSyncExternalStore(subscribe, snapshot, () => EMPTY_PURGE);

  useEffect(() => {
    mounted.current = true;
    const stop = () => {
      mounted.current = false;
      controller.current?.abort();
    };
    // A recovered operation may contain commits whose responses were lost.
    if (getChatHistoryPurge(key).token) refreshWaveMessages(waveId);
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, stop);
    return () => {
      stop();
      globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, stop);
    };
  }, [key, waveId, refreshWaveMessages]);

  const start = async () => {
    if (!mounted.current || getChatHistoryPurge(key).phase === "running")
      return;
    const currentController = new AbortController();
    controller.current = currentController;
    const ownsRun = () =>
      mounted.current &&
      controller.current === currentController &&
      !currentController.signal.aborted;
    await runChatHistoryPurge({
      key,
      waveId,
      signal: currentController.signal,
      authenticate: requestAuth,
      onBatch: (ids) => {
        if (ownsRun()) processDropsRemoved(waveId, ids);
      },
      onSettled: (completed, count) => {
        if (!ownsRun()) return;
        refreshWaveMessages(waveId);
        onSettled(completed, count);
      },
    });
  };
  return { state, start };
}
