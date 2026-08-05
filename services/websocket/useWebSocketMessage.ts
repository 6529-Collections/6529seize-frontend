"use client";

import { useEffect, useEffectEvent } from "react";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";
import type { WsMessageType } from "@/helpers/Types";

/**
 * Hook to subscribe to a specific WebSocket message type using a callback pattern
 *
 * @template T - Type of the message data
 * @param messageType - The type of message to subscribe to
 * @param callback - Function to call when a message of this type is received
 * @returns
 *   - isConnected: Whether the WebSocket is connected
 */
export function useWebSocketMessage<T = any>(
  messageType: WsMessageType,
  callback: (messageData: T) => void
) {
  // Get WebSocket context
  const { subscribe, status } = useWebSocket();

  const onMessage = useEffectEvent(callback);

  // Is the WebSocket connected?
  const isConnected = status === WebSocketStatus.CONNECTED;

  useEffect(() => {
    return subscribe<T>(messageType, onMessage);
  }, [messageType, subscribe]);

  return {
    isConnected,
  };
}

export function useWebsocketStatus() {
  const { status } = useWebSocket();
  return status;
}
