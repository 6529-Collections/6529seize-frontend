"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  typingSocket,
  type TypingSocketSnapshot,
} from "@/services/websocket/typingSocket";
import { useMobileAppActivity } from "./useMobileAppActivity";

interface UseWaveWebSocketResult {
  readonly socket: WebSocket | null;
  readonly readyState: number;
  readonly disconnect: () => void;
}

const SERVER_SNAPSHOT: TypingSocketSnapshot = { socket: null, waveId: null };
const getServerSnapshot = (): TypingSocketSnapshot => SERVER_SNAPSHOT;

/**
 * Typing events for one wave, from the tab's shared typing socket. Signed-in
 * listeners authenticate before subscribing so private-wave recipient
 * filtering and the typing sender's active-wave membership check can succeed.
 * Switching waves re-subscribes the same socket; the newest wave asked for
 * wins, and the socket is returned only while it follows `waveId`.
 * `disconnect()` turns typing off for this caller's wave until it moves to
 * another wave; the shared socket stays for other callers.
 */
export function useWaveWebSocket(waveId: string): UseWaveWebSocketResult {
  const isAppActive = useMobileAppActivity();
  // The wave whose typing this caller turned off; another wave turns it on.
  const [disconnectedWaveId, setDisconnectedWaveId] = useState<string | null>(
    null
  );
  const snapshot = useSyncExternalStore(
    typingSocket.subscribe,
    typingSocket.getSnapshot,
    getServerSnapshot
  );
  const isWanted =
    waveId !== "" && isAppActive && disconnectedWaveId !== waveId;

  useEffect(() => {
    typingSocket.setAppActive(isAppActive);
  }, [isAppActive]);

  useEffect(() => {
    if (!isWanted) return;
    return typingSocket.acquire(waveId);
  }, [isWanted, waveId]);

  const isCurrent = isWanted && snapshot.waveId === waveId;
  const socket = isCurrent ? snapshot.socket : null;
  return {
    socket,
    readyState: socket ? WebSocket.OPEN : WebSocket.CLOSED,
    disconnect: () => setDisconnectedWaveId(waveId),
  };
}
