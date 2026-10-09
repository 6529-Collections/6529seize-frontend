"use client";

import { useEffect, useRef, useState } from "react";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { useWaveWebSocket } from "./useWaveWebSocket";
import { useMobileAppActivity } from "./useMobileAppActivity";
import type {
  WsDropUpdateMessage,
  WsDropUpdateRefMessage,
  WsTypingMessage,
} from "@/helpers/Types";
import { isWsDropUpdateRefData, WsMessageType } from "@/helpers/Types";
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
  readonly socket: WebSocket | null;
  readonly message: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TYPING_WINDOW_MS = 5_000; // still typing if ≤ 5 s old

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

const isWsDropUpdateRefMessage = (
  value: unknown
): value is WsDropUpdateRefMessage =>
  isRecord(value) &&
  value["type"] === WsMessageType.DROP_UPDATE_REF &&
  isWsDropUpdateRefData(value["data"]);

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
  const isAppActive = useMobileAppActivity();
  const shouldSubscribe = enabled && !disabled && isAppActive;
  const { socket } = useWaveWebSocket(shouldSubscribe ? waveId : "");
  const scopeKey = `${waveId}:${shouldSubscribe ? "subscribed" : "paused"}`;

  const [typingMessageState, setTypingMessageState] =
    useState<TypingMessageState>({
      scopeKey,
      socket,
      message: "",
    });

  // Reset the display when its subscription changes, including before a new
  // socket connects. Returning to the same Wave must not revive stale labels.
  if (typingMessageState.scopeKey !== scopeKey) {
    setTypingMessageState({ scopeKey, socket, message: "" });
  }

  const typersRef = useRef<Map<string, TypingEntry>>(new Map());

  useEffect(() => {
    typersRef.current.clear();
    const clearProfileTyping = () => {
      typersRef.current.clear();
      setTypingMessageState({ scopeKey, socket, message: "" });
    };
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, clearProfileTyping);
    return () => {
      globalThis.removeEventListener(
        PROFILE_SWITCHED_EVENT,
        clearProfileTyping
      );
    };
  }, [scopeKey, socket]);

  /* ----- 2. Handle incoming USER_IS_TYPING packets ----------------- */
  useEffect(() => {
    if (!shouldSubscribe || !socket) return;

    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const updateTypingMessage = () => {
      clearTimeout(expiryTimer);
      expiryTimer = undefined;
      const now = Date.now();
      let nextExpiry = Infinity;
      typersRef.current.forEach((entry, handle) => {
        const expiresAt = entry.lastTypingAt + TYPING_WINDOW_MS;
        if (expiresAt <= now) typersRef.current.delete(handle);
        else nextExpiry = Math.min(nextExpiry, expiresAt);
      });

      const message = buildTypingString(Array.from(typersRef.current.values()));
      setTypingMessageState((previous) =>
        previous.scopeKey === scopeKey &&
        previous.socket === socket &&
        previous.message === message
          ? previous
          : { scopeKey, socket, message }
      );
      // An idle Wave has no typing timer. Wake only when a typer expires.
      if (Number.isFinite(nextExpiry)) {
        expiryTimer = setTimeout(updateTypingMessage, nextExpiry - now);
      }
    };

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
          updateTypingMessage();
        }
      }
      if (
        isWsDropUpdateRefMessage(msg) &&
        msg.data.update_type === WsMessageType.DROP_UPDATE &&
        msg.data.wave_id === waveId
      ) {
        // Compact refs deliberately omit author data. Clear the subscribed
        // Wave's typing state so a completed large post cannot leave a stale
        // indicator behind.
        typersRef.current.clear();
        updateTypingMessage();
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
      updateTypingMessage();
    };

    const currentSocket = socket;
    updateTypingMessage();
    currentSocket.addEventListener("message", onMessage);
    return () => {
      clearTimeout(expiryTimer);
      currentSocket.removeEventListener("message", onMessage);
    };
  }, [socket, waveId, myHandle, shouldSubscribe, scopeKey]);

  return shouldSubscribe &&
    socket !== null &&
    typingMessageState.socket === socket &&
    typingMessageState.scopeKey === scopeKey
    ? typingMessageState.message
    : "";
}
