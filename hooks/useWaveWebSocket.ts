"use client";

import { publicEnv } from "@/config/env";
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
  readonly token: string | null;
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
 */
export function useWaveWebSocket(waveId: string): UseWaveWebSocketResult {
  const token = useSyncExternalStore(
    subscribeToAuthChanges,
    getAuthJwt,
    getServerToken
  );
  const socketRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<() => void>(() => undefined);
  const [connection, setConnection] = useState<WaveConnectionState>({
    waveId: "",
    token: null,
    socket: null,
    readyState: WebSocket.CLOSED,
  });

  useEffect(() => {
    if (!waveId || (token && !isAuthJwtUsable(token))) return;

    let disposed = false;
    let shouldReconnect = true;
    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let authenticationTimeout: ReturnType<typeof setTimeout> | null = null;
    const url =
      publicEnv.WS_ENDPOINT ??
      publicEnv.API_ENDPOINT?.replace("https://api", "wss://ws") ??
      "wss://default-fallback-url";

    const clearAuthenticationTimeout = () => {
      if (authenticationTimeout !== null) {
        clearTimeout(authenticationTimeout);
        authenticationTimeout = null;
      }
    };
    const publish = (socket: WebSocket | null, readyState: number) => {
      setConnection({ waveId, token, socket, readyState });
    };
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
      if (disposed || !shouldReconnect || getAuthJwt() !== token) return;
      if (token && !isAuthJwtUsable(token)) return;
      const ws = new WebSocket(url);
      socketRef.current = ws;
      publish(null, WebSocket.CONNECTING);
      const isCurrent = () =>
        !disposed && socketRef.current === ws && getAuthJwt() === token;
      let subscribed = false;
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
        if (!token) {
          subscribe();
          return;
        }
        authenticationTimeout = setTimeout(() => {
          if (isCurrent()) ws.close(4011, "Authentication timeout");
        }, AUTHENTICATION_TIMEOUT_MS);
        ws.send(JSON.stringify({ type: "AUTHENTICATE", access_token: token }));
      };
      ws.onmessage = (event) => {
        if (!isCurrent() || !token) return;
        const type = messageType(event);
        if (type === "AUTHENTICATED") subscribe();
        if (type === "AUTHENTICATION_FAILED") {
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

    connect();
    return () => {
      disposed = true;
      stop();
      stopRef.current = () => undefined;
    };
  }, [waveId, token]);

  const isCurrent = connection.waveId === waveId && connection.token === token;
  return {
    socket: isCurrent ? connection.socket : null,
    readyState: isCurrent ? connection.readyState : WebSocket.CLOSED,
    disconnect: () => stopRef.current(),
  };
}
