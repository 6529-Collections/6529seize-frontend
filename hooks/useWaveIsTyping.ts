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

interface TypingEntry {
  profile: ApiProfileMin;
  lastTypingAt: number;
}

const TYPING_WINDOW_MS = 5000;
const CLEANUP_INTERVAL_MS = 1000;

function buildTypingString(entries: TypingEntry[]): string {
  if (entries.length === 0) return "";

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
  return `${names[0]}, ${names[1]} and ${names.length - 2} more people are typing`;
}

export function useWaveIsTyping(
  waveId: string,
  myHandle: string | null
): string {
  const { send, status } = useWebSocket();

  const [typingMessage, setTypingMessage] = useState("");

  const typersRef = useRef<Map<string, TypingEntry>>(new Map());

  const updateTypingString = useCallback(() => {
    const entries = Array.from(typersRef.current.values());
    const newMessage = buildTypingString(entries);

    setTypingMessage((prev) => (prev === newMessage ? prev : newMessage));
  }, []);

  useEffect(() => {
    typersRef.current.clear();
    updateTypingString();
  }, [waveId, updateTypingString]);

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

  useEffect(() => {
    if (status !== WebSocketStatus.CONNECTED) {
      typersRef.current.clear();
      updateTypingString();
    }
  }, [status, updateTypingString]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
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
