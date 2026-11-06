"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { useWaveWebSocket } from "./useWaveWebSocket";
import { useMobileAppActivity } from "./useMobileAppActivity";
import type { WsTypingMessage } from "@/helpers/Types";
import { isWsDropUpdateRefData, WsMessageType } from "@/helpers/Types";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
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

/**
 * Which typers a drop frame on the app socket ends, for one wave:
 * - `DROP_UPDATE` carries the whole drop (`{ wave: { id }, author: { handle } }`)
 *   and ends its author's typing;
 * - `DROP_UPDATE_REF` for a new or edited drop carries only `wave_id` and no
 *   author, so it ends everyone's typing in that wave.
 * Anything else, or a frame for another wave, ends nobody's.
 */
type TypingDropSignal =
  | { readonly kind: "author"; readonly handle: string }
  | { readonly kind: "everyone" };

const getTypingDropSignal = (
  type: WsMessageType,
  data: unknown,
  waveId: string
): TypingDropSignal | null => {
  if (type === WsMessageType.DROP_UPDATE_REF) {
    return isWsDropUpdateRefData(data) &&
      data.update_type === WsMessageType.DROP_UPDATE &&
      data.wave_id === waveId
      ? { kind: "everyone" }
      : null;
  }
  if (type !== WsMessageType.DROP_UPDATE || !isRecord(data)) return null;
  const wave = data["wave"];
  const author = data["author"];
  if (!isRecord(wave) || wave["id"] !== waveId || !isRecord(author)) {
    return null;
  }
  const handle = author["handle"];
  return typeof handle === "string" && handle.length > 0
    ? { kind: "author", handle }
    : null;
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
  // Redraws the label; null while the typing socket connects or reconnects,
  // which redraws from typersRef when it opens.
  const refreshTypingRef = useRef<(() => void) | null>(null);
  // Socket callbacks can run after a render paused the hook; they read this.
  const shouldSubscribeRef = useRef(shouldSubscribe);
  useLayoutEffect(() => {
    shouldSubscribeRef.current = shouldSubscribe;
  }, [shouldSubscribe]);

  // A typer stops typing when their drop arrives. Drops come on the app
  // socket: the typing socket (purpose=typing) no longer receives them once
  // the server supports it, and with it each drop is parsed once, not twice.
  const onAppSocketDrop = (type: WsMessageType, data: unknown) => {
    if (!shouldSubscribeRef.current) return;
    const signal = getTypingDropSignal(type, data, waveId);
    if (signal === null) return;
    const changed =
      signal.kind === "author"
        ? typersRef.current.delete(signal.handle)
        : typersRef.current.size > 0;
    if (signal.kind === "everyone") typersRef.current.clear();
    if (changed) refreshTypingRef.current?.();
  };
  useWebSocketMessage<unknown>(WsMessageType.DROP_UPDATE, (data) =>
    onAppSocketDrop(WsMessageType.DROP_UPDATE, data)
  );
  useWebSocketMessage<unknown>(WsMessageType.DROP_UPDATE_REF, (data) =>
    onAppSocketDrop(WsMessageType.DROP_UPDATE_REF, data)
  );

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
      // A fast-path hint only: servers without typing-purpose sockets still
      // send every drop here, and a frame without the type name cannot be a
      // typing event. Frames that pass are still parsed and validated.
      const raw = String(event.data);
      if (!raw.includes(WsMessageType.USER_IS_TYPING)) return;
      let msg: unknown;
      try {
        msg = JSON.parse(raw) as unknown;
      } catch {
        return;
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
    refreshTypingRef.current = updateTypingMessage;
    currentSocket.addEventListener("message", onMessage);
    return () => {
      clearTimeout(expiryTimer);
      if (refreshTypingRef.current === updateTypingMessage) {
        refreshTypingRef.current = null;
      }
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
