"use client";

import { WsMessageType } from "@/helpers/Types";
import { useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { WebSocketStatus } from "./WebSocketTypes";

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
const isDocumentHidden = () => document.visibilityState === "hidden";
const isHiddenOnServer = () => false;

/**
 * Tells the server which wave this tab has open, on the main app socket:
 * `{"type":"SET_OPEN_WAVE","wave_id":<id or null>}`. It is sent when a wave
 * opens or the tab switches waves, after every (re)connect and
 * re-authentication (the server's connection row is new then), and with
 * null when the reader leaves the wave view or hides the tab. Typing keeps
 * its own socket; this never sends SUBSCRIBE_TO_WAVE. Backends that do not
 * know the frame ignore it.
 */
export function useOpenWaveSocketSync(activeWaveId: string | null): void {
  // Optional, so a tree without the socket provider simply sends nothing.
  const socket = useContext(WebSocketContext);
  const status = socket?.status ?? WebSocketStatus.DISCONNECTED;
  const send = socket?.send;
  const isHidden = useSyncExternalStore(
    subscribeToVisibility,
    isDocumentHidden,
    isHiddenOnServer
  );
  const openWaveId = isHidden ? null : activeWaveId;
  // What the current connection was told; undefined while not connected.
  const sentRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status !== WebSocketStatus.CONNECTED || !send) {
      sentRef.current = undefined;
      return;
    }
    // A new or re-authenticated connection has no open wave on the server.
    const serverOpenWaveId = sentRef.current ?? null;
    sentRef.current = openWaveId;
    if (serverOpenWaveId !== openWaveId) {
      send(WsMessageType.SET_OPEN_WAVE, { wave_id: openWaveId });
    }
  }, [openWaveId, send, status]);
}
