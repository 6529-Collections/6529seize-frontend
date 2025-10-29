"use client";

import { useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";
import { WsMessageType } from "@/helpers/Types";

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

  // Memoize the callback to prevent unnecessary resubscriptions
  const stableCallback = useCallback(callback, [callback]);

  // Is the WebSocket connected?
  const isConnected = status === WebSocketStatus.CONNECTED;

  // Subscribe to the message type
  useEffect(() => {
    // Only subscribe if connected
    if (status !== WebSocketStatus.CONNECTED) {
      return;
    }

    // Subscribe and get unsubscribe function
    const unsubscribe = subscribe<T>(messageType, stableCallback);

    // Clean up subscription on unmount or type change
    return unsubscribe;
  }, [messageType, subscribe, status, stableCallback]);

  return {
    isConnected,
  };
}

export function useWebsocketStatus() {
  const { status } = useWebSocket();
  return status;
}
