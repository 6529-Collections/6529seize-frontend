"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WsMessageType } from "@/helpers/Types";
import { applyDelayJitter } from "@/helpers/jitter.helpers";
import { useMobileAppActivity } from "@/hooks/useMobileAppActivity";
import { useWebSocket } from "./useWebSocket";
import {
  WebSocketStatus,
  WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS,
} from "./WebSocketTypes";

// The socket stays connected through a brief tab switch, so returning from
// one has nothing to repair. A longer absence may have frozen the page while
// the server kept sending; resync then even if the socket never dropped.
// Reconnects, resync markers and native app resumes always resync.
const RESUME_RESYNC_MIN_HIDDEN_MS = 30_000;

/** Missed live updates are repaired from current authorized HTTP state. */
export function WebSocketRecoverySync() {
  const client = useQueryClient();
  const { status, subscribe } = useWebSocket();
  const active = useMobileAppActivity();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false);
  const lastRefreshAt = useRef(0);
  const hiddenAt = useRef<number | undefined>(undefined);
  const previous = useRef({
    status,
    active,
    hasConnected: status === WebSocketStatus.CONNECTED,
  });

  const refresh = useCallback(() => {
    pending.current = true;
    if (
      !active ||
      document.visibilityState !== "visible" ||
      status !== WebSocketStatus.CONNECTED ||
      timer.current !== undefined
    )
      return;
    const delay =
      Math.max(1000, lastRefreshAt.current + 5000 - Date.now()) +
      applyDelayJitter(WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS / 2, 1);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      if (document.visibilityState !== "visible") return;
      pending.current = false;
      lastRefreshAt.current = Date.now();
      // Inactive queries become stale but do not create background request bursts.
      void client.invalidateQueries({ refetchType: "active" });
    }, delay);
  }, [active, client, status]);

  useEffect(
    () => subscribe(WsMessageType.RESYNC_REQUIRED, refresh),
    [refresh, subscribe]
  );

  useEffect(() => {
    const reconnected =
      status === WebSocketStatus.CONNECTED &&
      previous.current.status !== WebSocketStatus.CONNECTED &&
      previous.current.hasConnected;
    const resumed = active && !previous.current.active;
    previous.current = {
      status,
      active,
      hasConnected:
        previous.current.hasConnected || status === WebSocketStatus.CONNECTED,
    };
    // Initial HTTP queries already load current state; reconcile missed updates only.
    if (reconnected || resumed) refresh();
    return () => {
      clearTimeout(timer.current);
      timer.current = undefined;
    };
  }, [active, refresh, status]);

  useEffect(() => {
    if (document.visibilityState !== "visible") {
      hiddenAt.current ??= Date.now();
    }
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        hiddenAt.current ??= Date.now();
        return;
      }
      const hiddenFor =
        hiddenAt.current === undefined ? 0 : Date.now() - hiddenAt.current;
      hiddenAt.current = undefined;
      if (pending.current || hiddenFor >= RESUME_RESYNC_MIN_HIDDEN_MS) {
        refresh();
      }
    };
    // Focus alone (switching windows, closing devtools) loses no updates.
    const onFocus = () => {
      if (document.visibilityState === "visible" && pending.current) refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (pending.current) refresh();
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  return null;
}
