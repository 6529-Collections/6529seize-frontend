"use client";

import { useEffect, useRef, useState } from "react";
import { useWaveWebSocket } from "./useWaveWebSocket";
import {
  WsDropUpdateMessage,
  WsMessageType,
  WsTypingMessage,
} from "@/helpers/Types";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface TypingEntry {
  profile: ApiProfileMin;
  lastTypingAt: number; // our local receive time (ms)
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TYPING_WINDOW_MS = 5_000; // still typing if ≤ 5 s old
const CLEANUP_INTERVAL_MS = 1_000; // prune/check once per second

/* ------------------------------------------------------------------ */
/*  Helper to convert active typers → human string                    */
/* ------------------------------------------------------------------ */

function buildTypingString(entries: TypingEntry[]): string {
  if (entries.length === 0) return "";

  // Highest‑level first (undefined → 0)
  const sorted = entries.sort(
    (a, b) => (b.profile.level ?? 0) - (a.profile.level ?? 0)
  );

  const names = sorted.map((e) => e.profile.handle);

  if (names.length === 1) {
    return `${names[0]} is typing`;
  }
  if (names.length === 2) {
    return `${names[0]}, ${names[1]} are typing`;
  }
  return `${names[0]}, ${names[1]} and ${
    names.length - 2
  } more people are typing`;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

/**
 * React hook that returns a live "is‑typing" label for a wave.
 *
 * @param waveId    Wave/channel ID being viewed.
 * @param myHandle  Handle of current user (events from this handle are ignored).
 * @param disabled  If true, skip websocket subscription (e.g., for muted waves).
 */
export function useWaveIsTyping(
  waveId: string,
  myHandle: string | null,
  disabled: boolean = false
): string {
  const { socket } = useWaveWebSocket(disabled ? "" : waveId);

  const [typingMessage, setTypingMessage] = useState("");

  const typersRef = useRef<Map<string, TypingEntry>>(new Map());

  useEffect(() => {
    typersRef.current.clear();
    setTypingMessage("");
  }, [waveId, disabled]);

  /* ----- 2. Handle incoming USER_IS_TYPING packets ----------------- */
  useEffect(() => {
    if (!socket) return;

    const onMessage = (event: MessageEvent) => {
      let msg: WsTypingMessage | WsDropUpdateMessage;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        console.error("Bad WebSocket JSON", err);
        return;
      }
      if (msg.type === WsMessageType.DROP_UPDATE) {
        typersRef.current.delete(msg.data?.author.handle ?? "");
      }
      if (msg.type !== WsMessageType.USER_IS_TYPING) return;
      const data = msg.data;
      if (!data || data.wave_id !== waveId) return;
      if (data.profile?.handle === myHandle) return; // ignore myself
      if (!data.profile?.handle) return;
      // Use local clock for freshness (avoids clock‑skew issues)
      typersRef.current.set(data.profile.handle, {
        profile: data.profile,
        lastTypingAt: Date.now(),
      });
    };

    const currentSocket = socket;
    currentSocket.addEventListener("message", onMessage);
    return () => {
      if (currentSocket) {
        currentSocket.removeEventListener("message", onMessage);
      }
    };
  }, [socket, waveId, myHandle]);

  /* ----- 3. Periodic cleanup + state update ------------------------ */
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      // Prune stale typers
      typersRef.current.forEach((entry, handle) => {
        if (now - entry.lastTypingAt > TYPING_WINDOW_MS) {
          typersRef.current.delete(handle);
        }
      });

      // Derive the new string
      const newMessage = buildTypingString(
        Array.from(typersRef.current.values())
      );

      // Only trigger re‑render if text actually changed
      setTypingMessage((prev) => (prev === newMessage ? prev : newMessage));
    }, CLEANUP_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []); // stable for entire lifespan

  return typingMessage;
}
