"use client";

import { useCallback, useEffect, useRef } from "react";
import { getAuthJwt, WALLET_AUTH_COOKIE } from "../auth/auth.utils";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";

const AUTH_BROADCAST_CHANNEL = "auth-token-updates";
const AUTH_BROADCAST_MESSAGE = "auth-token-changed";

type CookieChangeInfo = {
  readonly name?: string | null;
};

interface CookieChangeEventLike {
  readonly changed?: CookieChangeInfo[];
  readonly deleted?: CookieChangeInfo[];
}

interface CookieStoreWithEvents {
  addEventListener?: (
    type: "change",
    listener: (event: CookieChangeEventLike) => void
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: (event: CookieChangeEventLike) => void
  ) => void;
  onchange?: ((event: CookieChangeEventLike) => void) | null;
}

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
 * - Immediate Health Checks: Triggered by status changes for responsive connection management
 * - Periodic Health Checks: Stable 10-second interval for ongoing monitoring
 * - Memory Safe: Single interval prevents leaks during status transitions
 * - Fresh References: Periodic checks use current WebSocket context to avoid stale closures
 */
export function useWebSocketHealth() {
  const webSocketState = useWebSocket();
  const lastTokenRef = useRef<string | null>(null);
  const webSocketStateRef = useRef(webSocketState);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Keep ref updated with current WebSocket state
  webSocketStateRef.current = webSocketState;

  const performHealthCheck = useCallback(() => {
    const currentToken = getAuthJwt();
    const previousToken = lastTokenRef.current;
    lastTokenRef.current = currentToken;

    const {
      status: currentStatus,
      connect: currentConnect,
      disconnect: currentDisconnect,
    } = webSocketStateRef.current;

    if (!currentToken && currentStatus !== WebSocketStatus.DISCONNECTED) {
      currentDisconnect();
    } else if (
      currentToken &&
      currentStatus === WebSocketStatus.DISCONNECTED
    ) {
      currentConnect(currentToken);
    } else if (
      currentToken &&
      currentStatus !== WebSocketStatus.DISCONNECTED &&
      currentToken !== previousToken
    ) {
      currentConnect(currentToken);
    }

    if (currentToken !== previousToken) {
      broadcastChannelRef.current?.postMessage({
        type: AUTH_BROADCAST_MESSAGE,
      });
    }
  }, []);

  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck, webSocketState.status]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cookieStore = (window as unknown as {
      cookieStore?: CookieStoreWithEvents;
    }).cookieStore;

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
          if ((event.data as { type?: string })?.type === AUTH_BROADCAST_MESSAGE) {
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
      removeCookieListener?.();
      closeBroadcastChannel?.();
    };
  }, [performHealthCheck]);

  useEffect(() => {
    const healthCheck = window.setInterval(performHealthCheck, 10000);
    return () => window.clearInterval(healthCheck);
  }, [performHealthCheck]);
}

