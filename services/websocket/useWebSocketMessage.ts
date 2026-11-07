"use client";

import { useEffect, useEffectEvent } from "react";
import { useWebSocket } from "./useWebSocket";
import {
  WebSocketStatus,
  type MessageCallback,
  type SubscribeOptions,
} from "./WebSocketTypes";
import type { WsMessageType } from "@/helpers/Types";

/**
 * Hook to subscribe to a specific WebSocket message type using a callback pattern
 *
 * @template T - Type of the message data
 * @param messageType - The type of message to subscribe to
 * @param callback - Function to call when a message of this type is received
 * @param options - `withMetadata` also passes each frame's own metadata
 * @returns
 *   - isConnected: Whether the WebSocket is connected
 */
export function useWebSocketMessage<T = any>(
  messageType: WsMessageType,
  callback: MessageCallback<T>,
  options?: SubscribeOptions
) {
  // Get WebSocket context
  const { subscribe, status } = useWebSocket();

  const onMessage = useEffectEvent(callback);

  // Is the WebSocket connected?
  const isConnected = status === WebSocketStatus.CONNECTED;

  const withMetadata = options?.withMetadata === true;
  useEffect(() => {
    return withMetadata
      ? subscribe<T>(messageType, onMessage, { withMetadata })
      : subscribe<T>(messageType, onMessage);
  }, [messageType, subscribe, withMetadata]);

  return {
    isConnected,
  };
}

export function useWebsocketStatus() {
  const { status } = useWebSocket();
  return status;
}
