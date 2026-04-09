"use client";

import { useCallback, useEffect, useRef } from "react";
import { getAuthJwt, WALLET_AUTH_COOKIE } from "../auth/auth.utils";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";
import { logWebSocketDebug } from "./webSocketDebug";

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
type HealthCheckSource =
  | "status-effect"
  | "resume"
  | "cookie-change"
  | "broadcast-channel"
  | "interval";
type ResumeEventSource = "visibilitychange" | "focus";

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

  const performHealthCheckForSource = useCallback(
    (
      source: HealthCheckSource
    ): {
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
      } else if (
        currentToken &&
        currentStatus === WebSocketStatus.DISCONNECTED
      ) {
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

      if (
        source === "resume" ||
        source === "status-effect" ||
        action !== "none"
      ) {
        logWebSocketDebug("Health check completed", {
          source,
          action,
          reason,
          status: currentStatus,
          hasToken: Boolean(currentToken),
          tokenChanged,
        });
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
    },
    []
  );

  const performResumeHealthCheck = useCallback(
    (source: ResumeEventSource) => {
      if (
        typeof document === "undefined" ||
        document.visibilityState !== "visible"
      ) {
        logWebSocketDebug(
          "Resume health check skipped because document is hidden",
          {
            source,
            visibilityState:
              typeof document === "undefined"
                ? "undefined"
                : document.visibilityState,
          }
        );
        return;
      }

      const now = Date.now();
      const hiddenAt = hiddenAtRef.current;
      const hiddenDurationMs = hiddenAt === null ? null : now - hiddenAt;
      // Clear the hidden marker for this resume attempt even if we dedupe it.
      hiddenAtRef.current = null;

      const sinceLastResumeCheckMs = now - lastResumeCheckAtRef.current;
      if (sinceLastResumeCheckMs < RESUME_EVENT_DEDUPE_WINDOW_MS) {
        logWebSocketDebug("Resume health check deduped", {
          source,
          sinceLastResumeCheckMs,
          hiddenDurationMs,
        });
        return;
      }
      lastResumeCheckAtRef.current = now;

      logWebSocketDebug("Running resume health check", {
        source,
        hiddenDurationMs,
        status: webSocketStateRef.current.status,
      });

      const {
        action,
        token: currentToken,
        reason: healthCheckReason,
      } = performHealthCheckForSource("resume");

      // Avoid a second reconnect when the health check already replaced the socket.
      if (action === "connect") {
        logWebSocketDebug("Resume reconnect already handled by health check", {
          source,
          hiddenDurationMs,
          reason: healthCheckReason,
        });
        return;
      }

      if (!currentToken || hiddenDurationMs === null) {
        logWebSocketDebug("Resume reconnect skipped", {
          source,
          hiddenDurationMs,
          reason: currentToken ? "missing-hidden-marker" : "missing-token",
        });
        return;
      }

      if (hiddenDurationMs < RESUME_RECONNECT_HIDDEN_DURATION_MS) {
        logWebSocketDebug(
          "Resume reconnect skipped because hidden duration is below threshold",
          {
            source,
            hiddenDurationMs,
            thresholdMs: RESUME_RECONNECT_HIDDEN_DURATION_MS,
          }
        );
        return;
      }

      const { status: currentStatus, connect: currentConnect } =
        webSocketStateRef.current;
      if (
        currentStatus === WebSocketStatus.CONNECTED ||
        currentStatus === WebSocketStatus.CONNECTING
      ) {
        logWebSocketDebug(
          "Forcing websocket reconnect after long hidden interval",
          {
            source,
            hiddenDurationMs,
            status: currentStatus,
            thresholdMs: RESUME_RECONNECT_HIDDEN_DURATION_MS,
          }
        );
        currentConnect(currentToken);
        return;
      }

      logWebSocketDebug(
        "Resume reconnect skipped because socket is disconnected",
        {
          source,
          hiddenDurationMs,
          status: currentStatus,
        }
      );
    },
    [performHealthCheckForSource]
  );

  useEffect(() => {
    performHealthCheckForSource("status-effect");
  }, [performHealthCheckForSource, webSocketState.status]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        logWebSocketDebug("Document became hidden", {
          hiddenAt: hiddenAtRef.current,
        });
        return;
      }

      logWebSocketDebug("Document became visible", {
        hiddenDurationMs:
          hiddenAtRef.current === null
            ? null
            : Date.now() - hiddenAtRef.current,
      });
      performResumeHealthCheck("visibilitychange");
    };

    const handleFocus = () => {
      logWebSocketDebug("Window focus event received", {
        visibilityState: document.visibilityState,
      });
      performResumeHealthCheck("focus");
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
        performHealthCheckForSource("cookie-change");
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
            performHealthCheckForSource("broadcast-channel");
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
  }, [performHealthCheckForSource]);

  useEffect(() => {
    const healthCheck = window.setInterval(() => {
      performHealthCheckForSource("interval");
    }, HEALTH_CHECK_INTERVAL_MS);
    return () => window.clearInterval(healthCheck);
  }, [performHealthCheckForSource]);
}
