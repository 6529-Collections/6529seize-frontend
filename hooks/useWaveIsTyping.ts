"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  WsDropUpdateMessage,
  WsMessageType,
  WsTypingMessage,
} from "../helpers/Types";
import { ApiProfileMin } from "../generated/models/ApiProfileMin";
import { useWebSocket } from "../services/websocket/useWebSocket";
import { useWebSocketMessage } from "../services/websocket/useWebSocketMessage";
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
  const { send } = useWebSocket();

  /** Only the final string lives in state; everything else is in a ref. */
  const [typingMessage, setTypingMessage] = useState("");

  /** Mutable store of active typers — doesn’t cause re‑renders. */
  const typersRef = useRef<Map<string, TypingEntry>>(new Map());

  /* ----- 1. Reset when wave changes -------------------------------- */
  useEffect(() => {
    typersRef.current.clear();
    setTypingMessage("");
  }, [waveId]);

  /* ----- 2. Subscribe to wave updates ------------------------------- */
  useEffect(() => {
    if (!waveId) {
      return;
    }

    send(WsMessageType.SUBSCRIBE_TO_WAVE, {
      wave_id: waveId,
      subscribe: true,
    });

    return () => {
      send(WsMessageType.SUBSCRIBE_TO_WAVE, {
        wave_id: waveId,
        subscribe: false,
      });
    };
  }, [send, waveId]);

  /* ----- 3. Handle drop updates ------------------------------------ */
  const handleDropUpdate = useCallback(
    (drop: WsDropUpdateMessage["data"]) => {
      if (!drop) {
        return;
      }

      if (drop.wave?.id !== waveId) {
        return;
      }

      const handle = drop.author?.handle;
      if (!handle) {
        return;
      }

      typersRef.current.delete(handle);
    },
    [waveId]
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    handleDropUpdate
  );

  /* ----- 4. Handle incoming USER_IS_TYPING packets ----------------- */
  const handleTypingMessage = useCallback(
    (data: WsTypingMessage["data"]) => {
      if (!data || data.wave_id !== waveId) {
        return;
      }

      const handle = data.profile?.handle;
      if (!handle || handle === myHandle) {
        return;
      }

      // Use local clock for freshness (avoids clock‑skew issues)
      typersRef.current.set(handle, {
        profile: data.profile,
        lastTypingAt: Date.now(),
      });
    },
    [waveId, myHandle]
  );

  useWebSocketMessage<WsTypingMessage["data"]>(
    WsMessageType.USER_IS_TYPING,
    handleTypingMessage
  );

  /* ----- 5. Periodic cleanup + state update ------------------------ */
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
