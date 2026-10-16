"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WsMessageType } from "@/helpers/Types";
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
      Math.floor(Math.random() * WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS);
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
    // Includes reconnect after a server closes a listener whose buffer is full.
    if (status === WebSocketStatus.CONNECTED && active) refresh();
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
