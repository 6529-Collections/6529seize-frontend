"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  WALLET_AUTH_COOKIE,
} from "../auth/auth.utils";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";

const AUTH_BROADCAST_CHANNEL = "auth-token-updates";
const AUTH_BROADCAST_MESSAGE = "auth-token-changed";
const HEALTH_CHECK_INTERVAL_MS = 10000;
const RESUME_RECONNECT_HIDDEN_DURATION_MS = 60000;
const RESUME_EVENT_DEDUPE_WINDOW_MS = 1000;

type CookieChangeInfo = {
  readonly name?: string | null | undefined;
};

interface CookieChangeEventLike {
  readonly changed?: CookieChangeInfo[] | undefined;
  readonly deleted?: CookieChangeInfo[] | undefined;
}

interface CookieStoreWithEvents {
  addEventListener?: (
    type: "change",
    listener: (event: CookieChangeEventLike) => void
  ) => void | undefined;
  removeEventListener?: (
    type: "change",
    listener: (event: CookieChangeEventLike) => void
  ) => void | undefined;
  onchange?: ((event: CookieChangeEventLike) => void) | null | undefined;
}

type HealthCheckAction = "none" | "connect" | "disconnect";

const isAuthCookieChange = (event: CookieChangeEventLike): boolean => {
  const matchChanged = event.changed?.some(
    (cookie) => cookie.name === WALLET_AUTH_COOKIE
  );
  const matchDeleted = event.deleted?.some(
    (cookie) => cookie.name === WALLET_AUTH_COOKIE
  );
  return Boolean(matchChanged || matchDeleted);
};

/**
 * WebSocket health monitoring hook
 *
 * ARCHITECTURE:
 * - Desired State Only: Auth token changes decide whether we should connect or disconnect
 * - Resume Checks: Visibility/focus trigger a deduped health check and can force a reconnect
 *   after long hidden periods to recover silently dropped sockets
 * - Periodic Health Checks: Stable 10-second interval for ongoing monitoring
 * - Memory Safe: Single interval prevents leaks during status transitions
 * - Fresh References: Checks use current WebSocket context to avoid stale closures
 */
export function useWebSocketHealth() {
  const webSocketState = useWebSocket();
  const lastTokenRef = useRef<string | null>(null);
  const webSocketStateRef = useRef(webSocketState);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const lastResumeCheckAtRef = useRef(0);

  // Keep ref updated with current WebSocket state
  webSocketStateRef.current = webSocketState;

  const performHealthCheck = useCallback((): {
    action: HealthCheckAction;
    token: string | null;
    reason: string | null;
  } => {
    const currentToken = getAuthJwt();
    const previousToken = lastTokenRef.current;
    const tokenChanged = currentToken !== previousToken;
    lastTokenRef.current = currentToken;

    const {
      status: currentStatus,
      connect: currentConnect,
      disconnect: currentDisconnect,
    } = webSocketStateRef.current;

    let action: HealthCheckAction = "none";
    let reason: string | null = null;

    if (!currentToken && currentStatus !== WebSocketStatus.DISCONNECTED) {
      currentDisconnect();
      action = "disconnect";
      reason = "missing-token";
    } else if (currentToken && currentStatus === WebSocketStatus.DISCONNECTED) {
      currentConnect(currentToken);
      action = "connect";
      reason = "connect-while-disconnected";
    } else if (
      currentToken &&
      currentStatus !== WebSocketStatus.DISCONNECTED &&
      currentToken !== previousToken
    ) {
      currentConnect(currentToken);
      action = "connect";
      reason = "token-changed";
    }

    if (tokenChanged) {
      broadcastChannelRef.current?.postMessage({
        type: AUTH_BROADCAST_MESSAGE,
      });
    }

    return {
      action,
      token: currentToken,
      reason,
    };
  }, []);

  const performResumeHealthCheck = useCallback(() => {
    if (
      typeof document === "undefined" ||
      document.visibilityState !== "visible"
    ) {
      return;
    }

    const now = Date.now();
    const hiddenAt = hiddenAtRef.current;
    const hiddenDurationMs = hiddenAt === null ? null : now - hiddenAt;
    // Clear the hidden marker for this resume attempt even if we dedupe it.
    hiddenAtRef.current = null;

    const sinceLastResumeCheckMs = now - lastResumeCheckAtRef.current;
    if (sinceLastResumeCheckMs < RESUME_EVENT_DEDUPE_WINDOW_MS) {
      return;
    }
    lastResumeCheckAtRef.current = now;

    const { action, token: currentToken } = performHealthCheck();

    // Avoid a second reconnect when the health check already replaced the socket.
    if (action === "connect") {
      return;
    }

    if (!currentToken || hiddenDurationMs === null) {
      return;
    }

    if (hiddenDurationMs < RESUME_RECONNECT_HIDDEN_DURATION_MS) {
      return;
    }

    const { status: currentStatus, connect: currentConnect } =
      webSocketStateRef.current;
    if (
      currentStatus === WebSocketStatus.CONNECTED ||
      currentStatus === WebSocketStatus.CONNECTING ||
      currentStatus === WebSocketStatus.AUTHENTICATING
    ) {
      currentConnect(currentToken);
    }
  }, [performHealthCheck]);

  useEffect(() => {
    // Unexpected-close recovery belongs to WebSocketProvider's backoff loop.
    performHealthCheck();
  }, [performHealthCheck]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      performResumeHealthCheck();
    };

    const handleFocus = () => {
      performResumeHealthCheck();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [performResumeHealthCheck]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleAuthTokenChanged = () => {
      performHealthCheck();
    };
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthTokenChanged);

    const cookieStore = (
      window as unknown as {
        cookieStore?: CookieStoreWithEvents | undefined;
      }
    ).cookieStore;

    const hasCookieStoreListener = Boolean(
      cookieStore &&
      (typeof cookieStore.addEventListener === "function" ||
        "onchange" in cookieStore)
    );

    const handleCookieChange = (event: CookieChangeEventLike) => {
      if (isAuthCookieChange(event)) {
        performHealthCheck();
      }
    };

    let removeCookieListener: (() => void) | undefined;

    if (cookieStore && hasCookieStoreListener) {
      if (typeof cookieStore.addEventListener === "function") {
        cookieStore.addEventListener("change", handleCookieChange);
        removeCookieListener = () => {
          cookieStore.removeEventListener?.("change", handleCookieChange);
        };
      } else if ("onchange" in cookieStore) {
        const previousOnChange = cookieStore.onchange;
        const delegatedHandler = (event: CookieChangeEventLike) => {
          handleCookieChange(event);
          previousOnChange?.(event);
        };
        cookieStore.onchange = delegatedHandler;
        removeCookieListener = () => {
          if (cookieStore.onchange === delegatedHandler) {
            cookieStore.onchange = previousOnChange ?? null;
          }
        };
      }
    }

    let closeBroadcastChannel: (() => void) | undefined;

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      broadcastChannelRef.current = channel;

      if (!hasCookieStoreListener) {
        const handleMessage = (event: MessageEvent) => {
          if (
            (event.data as { type?: string | undefined })?.type ===
            AUTH_BROADCAST_MESSAGE
          ) {
            performHealthCheck();
          }
        };
        channel.addEventListener("message", handleMessage as EventListener);
        closeBroadcastChannel = () => {
          channel.removeEventListener(
            "message",
            handleMessage as EventListener
          );
          channel.close();
          if (broadcastChannelRef.current === channel) {
            broadcastChannelRef.current = null;
          }
        };
      } else {
        closeBroadcastChannel = () => {
          channel.close();
          if (broadcastChannelRef.current === channel) {
            broadcastChannelRef.current = null;
          }
        };
      }
    } else {
      broadcastChannelRef.current = null;
    }

    return () => {
      window.removeEventListener(
        AUTH_TOKEN_CHANGED_EVENT,
        handleAuthTokenChanged
      );
      removeCookieListener?.();
      closeBroadcastChannel?.();
    };
  }, [performHealthCheck]);

  useEffect(() => {
    const healthCheck = window.setInterval(() => {
      performHealthCheck();
    }, HEALTH_CHECK_INTERVAL_MS);
    return () => window.clearInterval(healthCheck);
  }, [performHealthCheck]);
}
