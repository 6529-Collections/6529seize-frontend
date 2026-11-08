"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
} from "@/services/auth/auth.utils";
import { getSocketIdentityKey } from "@/services/websocket/socketIdentity";
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
const AUTH_BROADCAST_CHANNEL = "auth-token-updates";

function subscribeToAuthChanges(onChange: () => void): () => void {
  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onChange);
  window.addEventListener("focus", onChange);
  window.addEventListener("storage", onChange);
  const channel =
    typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  channel?.addEventListener("message", onChange);
  return () => {
    window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onChange);
    window.removeEventListener("focus", onChange);
    window.removeEventListener("storage", onChange);
    channel?.removeEventListener("message", onChange);
    channel?.close();
  };
}

const getServerToken = (): null => null;

/**
 * Typing events for one wave, from the tab's shared typing socket. Signed-in
 * listeners authenticate before subscribing so private-wave recipient
 * filtering and the typing sender's active-wave membership check can succeed.
 * Switching waves re-subscribes the same socket; the newest wave asked for
 * wins, and the socket is returned only while it follows `waveId`.
 * `disconnect()` turns typing off for this caller's wave until the wave or the
 * signed-in identity changes (a rotated token for the same identity keeps
 * it); the shared socket stays for other callers.
 */
export function useWaveWebSocket(waveId: string): UseWaveWebSocketResult {
  const isAppActive = useMobileAppActivity();
  const token = useSyncExternalStore(
    subscribeToAuthChanges,
    getAuthJwt,
    getServerToken
  );
  const scope = `${getSocketIdentityKey(token)}|${waveId}`;
  // The wave and identity whose typing this caller turned off.
  const [disconnectedScope, setDisconnectedScope] = useState<string | null>(
    null
  );
  const snapshot = useSyncExternalStore(
    typingSocket.subscribe,
    typingSocket.getSnapshot,
    getServerSnapshot
  );
  const isWanted = waveId !== "" && isAppActive && disconnectedScope !== scope;

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
    disconnect: () => setDisconnectedScope(scope),
  };
}
