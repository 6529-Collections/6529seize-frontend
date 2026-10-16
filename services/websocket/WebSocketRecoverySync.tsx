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

/** Missed live updates are repaired from current authorized HTTP state. */
export function WebSocketRecoverySync() {
  const client = useQueryClient();
  const { status, subscribe } = useWebSocket();
  const active = useMobileAppActivity();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false);
  const lastRefreshAt = useRef(0);
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
    const resume = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    if (pending.current) refresh();
    return () => {
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [refresh]);

  return null;
}
