"use client";

import { getWebSocketUrl } from "@/services/api/api-endpoints";
import { getSocketIdentityKey } from "@/services/websocket/socketIdentity";
import { useMobileAppActivity } from "./useMobileAppActivity";
import { WsMessageType } from "@/helpers/Types";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  isAuthJwtUsable,
} from "@/services/auth/auth.utils";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface UseWaveWebSocketResult {
  readonly socket: WebSocket | null;
  readonly readyState: number;
  readonly disconnect: () => void;
}

interface WaveConnectionState {
  readonly waveId: string;
  readonly identity: string | null;
  readonly socket: WebSocket | null;
  readonly readyState: number;
}

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 20;
const AUTHENTICATION_TIMEOUT_MS = 8000;
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
 * The typing socket declares its purpose (WAVES-PLAN 0.12), so the server
 * leaves it out of drop fan-out and sends it typing events only. Servers that
 * do not know the parameter ignore it.
 */
const TYPING_SOCKET_PURPOSE = "typing";

export const getTypingSocketUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("purpose", TYPING_SOCKET_PURPOSE);
    return parsed.toString();
  } catch (error) {
    // Without the purpose the server sends this socket every drop again.
    console.warn("[useWaveWebSocket] typing socket URL kept as is", error);
    return url;
  }
};

function messageType(event: MessageEvent<unknown>): string | null {
  if (typeof event.data !== "string") return null;
  try {
    const message: unknown = JSON.parse(event.data);
    if (typeof message !== "object" || message === null) return null;
    const type: unknown = Reflect.get(message, "type");
    return typeof type === "string" ? type : null;
  } catch {
    return null;
  }
}

/** A wave-scoped listener, independent of the global feed/notification socket.
 * Signed-in listeners authenticate before subscribing so private-wave recipient
 * filtering and the typing sender's active-wave membership check can succeed.
 * A rotated token for the same identity re-authenticates the open socket in
 * place, which keeps its wave subscription; another identity gets a new socket.
 */
export function useWaveWebSocket(waveId: string): UseWaveWebSocketResult {
  const isAppActive = useMobileAppActivity();
  const manuallyDisconnectedRef = useRef(false);
  const activeWaveRef = useRef(waveId);
  const token = useSyncExternalStore(
    subscribeToAuthChanges,
    getAuthJwt,
    getServerToken
  );
  const identity = getSocketIdentityKey(token);
  const isTokenUsable = !token || isAuthJwtUsable(token);
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<() => void>(() => undefined);
  const tokenChangedRef = useRef<() => void>(() => undefined);
  const [connection, setConnection] = useState<WaveConnectionState>({
    waveId: "",
    identity: null,
    socket: null,
    readyState: WebSocket.CLOSED,
  });

  useEffect(() => {
    if (activeWaveRef.current !== waveId) {
      activeWaveRef.current = waveId;
      manuallyDisconnectedRef.current = false;
    }
    if (!waveId || !isAppActive || manuallyDisconnectedRef.current) return;
    if (!isTokenUsable) return;

    let disposed = false;
    let shouldReconnect = true;
    let reconnectAttempts = 0;
    // The token the server rejected; a newer one for this identity retries.
    let rejectedToken: string | null = null;
    // Re-authenticates the open socket with the latest token, if it changed.
    let syncSocketToken: () => void = () => undefined;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let authenticationTimeout: ReturnType<typeof setTimeout> | null = null;
    const url = getTypingSocketUrl(getWebSocketUrl());

    const clearAuthenticationTimeout = () => {
      if (authenticationTimeout !== null) {
        clearTimeout(authenticationTimeout);
        authenticationTimeout = null;
      }
    };
    const publish = (socket: WebSocket | null, readyState: number) => {
      setConnection({ waveId, identity, socket, readyState });
    };
    const isSameIdentity = () =>
      getSocketIdentityKey(getAuthJwt()) === identity;
    const stop = () => {
      shouldReconnect = false;
      if (reconnectTimeout !== null) clearTimeout(reconnectTimeout);
      clearAuthenticationTimeout();
      const socket = socketRef.current;
      socketRef.current = null;
      socket?.close();
    };
    stopRef.current = () => {
      stop();
      publish(null, WebSocket.CLOSED);
    };

    function connect() {
      if (disposed || !shouldReconnect || !isSameIdentity()) return;
      const connectToken = getAuthJwt();
      if (connectToken && !isAuthJwtUsable(connectToken)) return;
      const ws = new WebSocket(url);
      socketRef.current = ws;
      publish(null, WebSocket.CONNECTING);
      const isCurrent = () =>
        !disposed && socketRef.current === ws && isSameIdentity();
      let subscribed = false;
      // The token of the AUTHENTICATE in flight or last accepted.
      let sentToken: string | null = null;
      let authenticating = false;
      const authenticate = (accessToken: string) => {
        sentToken = accessToken;
        authenticating = true;
        clearAuthenticationTimeout();
        authenticationTimeout = setTimeout(() => {
          if (isCurrent()) ws.close(4011, "Authentication timeout");
        }, AUTHENTICATION_TIMEOUT_MS);
        ws.send(
          JSON.stringify({ type: "AUTHENTICATE", access_token: accessToken })
        );
      };
      syncSocketToken = () => {
        const latest = getAuthJwt();
        if (
          !isCurrent() ||
          ws.readyState !== WebSocket.OPEN ||
          authenticating ||
          sentToken === null ||
          !latest ||
          latest === sentToken ||
          !isAuthJwtUsable(latest)
        )
          return;
        authenticate(latest);
      };
      const subscribe = () => {
        if (!isCurrent() || subscribed || ws.readyState !== WebSocket.OPEN)
          return;
        subscribed = true;
        clearAuthenticationTimeout();
        ws.send(
          JSON.stringify({
            type: WsMessageType.SUBSCRIBE_TO_WAVE,
            wave_id: waveId,
          })
        );
        reconnectAttempts = 0;
        publish(ws, WebSocket.OPEN);
      };

      ws.onopen = () => {
        if (!isCurrent()) return;
        const openToken = getAuthJwt();
        if (!openToken) {
          subscribe();
          return;
        }
        authenticate(openToken);
      };
      ws.onmessage = (event) => {
        if (!isCurrent() || sentToken === null) return;
        const type = messageType(event);
        if (type === "AUTHENTICATED") {
          authenticating = false;
          clearAuthenticationTimeout();
          subscribe();
          // The token may have rotated while this one was in flight.
          syncSocketToken();
        }
        if (type === "AUTHENTICATION_FAILED") {
          rejectedToken = sentToken;
          // Frames that still arrive on the closing socket are ignored.
          sentToken = null;
          shouldReconnect = false;
          clearAuthenticationTimeout();
          publish(null, WebSocket.CLOSED);
          ws.close(4008, "Authentication failed");
        }
      };
      ws.onclose = () => {
        if (!isCurrent()) return;
        clearAuthenticationTimeout();
        socketRef.current = null;
        publish(null, WebSocket.CLOSED);
        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts += 1;
          reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
        }
      };
      ws.onerror = () => {
        if (isCurrent()) ws.close();
      };
    }

    tokenChangedRef.current = () => {
      const latest = getAuthJwt();
      if (disposed || !isSameIdentity()) return;
      if (rejectedToken === null) {
        syncSocketToken();
      } else if (
        latest &&
        latest !== rejectedToken &&
        isAuthJwtUsable(latest)
      ) {
        rejectedToken = null;
        shouldReconnect = true;
        reconnectAttempts = 0;
        connect();
      }
    };

    connect();
    return () => {
      disposed = true;
      stop();
      stopRef.current = () => undefined;
      tokenChangedRef.current = () => undefined;
    };
  }, [waveId, identity, isTokenUsable, isAppActive]);

  // A new token for the same identity: the effect above keeps its socket.
  useEffect(() => {
    tokenChangedRef.current();
  }, [token]);

  const isCurrent =
    isAppActive &&
    connection.waveId === waveId &&
    connection.identity === identity;
  return {
    socket: isCurrent ? connection.socket : null,
    readyState: isCurrent ? connection.readyState : WebSocket.CLOSED,
    disconnect: () => {
      manuallyDisconnectedRef.current = true;
      stopRef.current();
    },
  };
}
