"use client";

import { useEffect, useRef, useState } from "react";
import { useWaveWebSocket } from "./useWaveWebSocket";
import type { WsDropUpdateMessage, WsTypingMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type TypingProfile = ApiProfileMin & { readonly handle: string };

interface TypingEntry {
  profile: TypingProfile;
  lastTypingAt: number; // our local receive time (ms)
}

interface TypingMessageState {
  readonly scopeKey: string;
  readonly message: string;
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

  // Highest-level first.
  const sorted = [...entries];
  sorted.sort((a, b) => b.profile.level - a.profile.level);

  const names = sorted.map((e) => e.profile.handle);
  const firstName = names[0] ?? "";
  const secondName = names[1] ?? "";

  if (names.length === 1) {
    return `${firstName} is typing`;
  }
  if (names.length === 2) {
    return `${firstName}, ${secondName} are typing`;
  }
  return `${firstName}, ${secondName} and ${
    names.length - 2
  } more people are typing`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isTypingProfile = (value: unknown): value is TypingProfile =>
  isRecord(value) &&
  typeof value["handle"] === "string" &&
  typeof value["level"] === "number";

type ValidWsTypingMessage = WsTypingMessage & {
  readonly data: WsTypingMessage["data"] & {
    readonly profile: TypingProfile;
  };
};

const isWsTypingMessage = (value: unknown): value is ValidWsTypingMessage => {
  if (!isRecord(value) || value["type"] !== WsMessageType.USER_IS_TYPING) {
    return false;
  }

  const data = value["data"];
  if (!isRecord(data)) {
    return false;
  }

  return (
    typeof data["wave_id"] === "string" && isTypingProfile(data["profile"])
  );
};

const isWsDropUpdateMessage = (
  value: unknown
): value is WsDropUpdateMessage => {
  if (!isRecord(value) || value["type"] !== WsMessageType.DROP_UPDATE) {
    return false;
  }

  const data = value["data"];
  if (!isRecord(data)) {
    return false;
  }

  const author = data["author"];
  return isRecord(author) && typeof author["handle"] === "string";
};

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
  disabled: boolean = false,
  options?: { readonly enabled?: boolean | undefined }
): string {
  const enabled = options?.enabled ?? true;
  const shouldSubscribe = enabled && !disabled;
  const { socket } = useWaveWebSocket(shouldSubscribe ? waveId : "");
  const scopeKey = `${waveId}:${shouldSubscribe ? "subscribed" : "paused"}`;

  const [typingMessageState, setTypingMessageState] =
    useState<TypingMessageState>({
      scopeKey,
      message: "",
    });

  const typersRef = useRef<Map<string, TypingEntry>>(new Map());

  useEffect(() => {
    typersRef.current.clear();
  }, [scopeKey]);

  /* ----- 2. Handle incoming USER_IS_TYPING packets ----------------- */
  useEffect(() => {
    if (!shouldSubscribe || !socket) return;

    const onMessage = (event: MessageEvent) => {
      let msg: unknown;
      try {
        msg = JSON.parse(String(event.data)) as unknown;
      } catch {
        return;
      }
      if (isWsDropUpdateMessage(msg)) {
        const authorHandle = msg.data.author.handle;
        if (authorHandle) {
          typersRef.current.delete(authorHandle);
        }
      }
      if (!isWsTypingMessage(msg)) return;
      const data = msg.data;
      if (data.wave_id !== waveId) return;
      if (data.profile.handle === myHandle) return; // ignore myself
      // Use local clock for freshness (avoids clock‑skew issues)
      typersRef.current.set(data.profile.handle, {
        profile: data.profile,
        lastTypingAt: Date.now(),
      });
    };

    const currentSocket = socket;
    currentSocket.addEventListener("message", onMessage);
    return () => {
      currentSocket.removeEventListener("message", onMessage);
    };
  }, [socket, waveId, myHandle, shouldSubscribe]);

  /* ----- 3. Periodic cleanup + state update ------------------------ */
  useEffect(() => {
    if (!shouldSubscribe) {
      return;
    }

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
      setTypingMessageState((prev) =>
        prev.scopeKey === scopeKey && prev.message === newMessage
          ? prev
          : { scopeKey, message: newMessage }
      );
    }, CLEANUP_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [scopeKey, shouldSubscribe]);

  return shouldSubscribe && typingMessageState.scopeKey === scopeKey
    ? typingMessageState.message
    : "";
}
