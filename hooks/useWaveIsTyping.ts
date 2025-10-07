"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import {
  WsDropUpdateMessage,
  WsMessageType,
  WsTypingMessage,
} from "@/helpers/Types";
import { useWebSocket } from "@/services/websocket/useWebSocket";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
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
 * React hook that returns a live “is‑typing” label for a wave.
 *
 * @param waveId    Wave/channel ID being viewed.
 * @param myHandle  Handle of current user (events from this handle are ignored).
 */
export function useWaveIsTyping(
  waveId: string,
  myHandle: string | null
): string {
  const { send, status } = useWebSocket();

  /** Only the final string lives in state; everything else is in a ref. */
  const [typingMessage, setTypingMessage] = useState("");

  /** Mutable store of active typers — doesn’t cause re‑renders. */
  const typersRef = useRef<Map<string, TypingEntry>>(new Map());

  /* ----- 1. Reset when wave changes -------------------------------- */
  const updateTypingString = useCallback(() => {
    const entries = Array.from(typersRef.current.values());
    const newMessage = buildTypingString(entries);

    setTypingMessage((prev) => (prev === newMessage ? prev : newMessage));
  }, []);

  /* ----- 1. Reset when wave changes -------------------------------- */
  useEffect(() => {
    typersRef.current.clear();
    updateTypingString();
  }, [waveId, updateTypingString]);

  /* ----- 2. Subscribe to wave events ------------------------------- */
  useEffect(() => {
    if (status !== WebSocketStatus.CONNECTED) {
      return;
    }

    send(WsMessageType.SUBSCRIBE_TO_WAVE, {
      subscribe: true,
      wave_id: waveId,
    });

    return () => {
      send(WsMessageType.SUBSCRIBE_TO_WAVE, {
        subscribe: false,
        wave_id: waveId,
      });
    };
  }, [send, status, waveId]);

  /* ----- 3. Handle incoming USER_IS_TYPING packets ----------------- */
  useWebSocketMessage<WsTypingMessage["data"]>(
    WsMessageType.USER_IS_TYPING,
    useCallback(
      (data) => {
        if (!data || data.wave_id !== waveId) return;
        if (data.profile?.handle === myHandle) return;

        const handle = data.profile?.handle;
        if (!handle) return;

        typersRef.current.set(handle, {
          profile: data.profile,
          lastTypingAt: Date.now(),
        });
        updateTypingString();
      },
      [myHandle, waveId, updateTypingString]
    )
  );

  /* ----- 4. Clear typers when they post drops ---------------------- */
  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (drop) => {
        if (drop?.author?.handle) {
          const sameWave = drop.wave?.id === waveId;
          if (!sameWave) return;
          if (typersRef.current.delete(drop.author.handle)) {
            updateTypingString();
          }
        }
      },
      [waveId, updateTypingString]
    )
  );

  /* ----- 5. Clear stale state when connection drops ---------------- */
  useEffect(() => {
    if (status !== WebSocketStatus.CONNECTED) {
      typersRef.current.clear();
      updateTypingString();
    }
  }, [status, updateTypingString]);

  /* ----- 6. Periodic cleanup + state update ------------------------ */
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      // Prune stale typers
      typersRef.current.forEach((entry, handle) => {
        if (now - entry.lastTypingAt > TYPING_WINDOW_MS) {
          typersRef.current.delete(handle);
        }
      });

      updateTypingString();
    }, CLEANUP_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [updateTypingString]);

  return typingMessage;
}
