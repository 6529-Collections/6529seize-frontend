import { useEffect, useRef, useState } from "react";
import { useWaveWebSocket } from "./useWaveWebSocket";
import { WsMessageType } from "../helpers/Types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Profile {
  handle: string;
  level?: number; // “higher” means more important
}

interface TypingPayload {
  wave_id: string;
  profile: Profile;
  timestamp: number; // server‑side event time (ignored for freshness)
}

interface TypingEntry {
  profile: Profile;
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
  const { socket } = useWaveWebSocket(waveId);

  /** Only the final string lives in state; everything else is in a ref. */
  const [typingMessage, setTypingMessage] = useState("");

  /** Mutable store of active typers — doesn’t cause re‑renders. */
  const typersRef = useRef<Map<string, TypingEntry>>(new Map());

  /* ----- 1. Reset when wave changes -------------------------------- */
  useEffect(() => {
    typersRef.current.clear();
    setTypingMessage("");
  }, [waveId]);

  /* ----- 2. Handle incoming USER_IS_TYPING packets ----------------- */
  useEffect(() => {
    if (!socket) return;

    const onMessage = (event: MessageEvent) => {
      let msg: { type: WsMessageType; data?: TypingPayload };
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        console.error("Bad WebSocket JSON", err);
        return;
      }

      if (msg.type !== WsMessageType.USER_IS_TYPING) return;
      const data = msg.data;
      if (!data || data.wave_id !== waveId) return;
      if (data.profile?.handle === myHandle) return; // ignore myself

      // Use local clock for freshness (avoids clock‑skew issues)
      typersRef.current.set(data.profile.handle, {
        profile: data.profile,
        lastTypingAt: Date.now(),
      });
    };

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
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
