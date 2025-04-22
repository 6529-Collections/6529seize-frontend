import { useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";
import { WsMessageType } from "../../helpers/Types";

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

/**
 * Hook to subscribe to multiple WebSocket message types using a callback pattern
 *
 * @template T - Type of the message data map
 * @param subscriptions - Object mapping message types to callback functions
 * @returns
 *   - isConnected: Whether the WebSocket is connected
 */
function useWebSocketMessages<
  T extends Record<WsMessageType, any>
>(subscriptions: {
  [K in keyof T]?: (data: T[K]) => void;
}) {
  // Get WebSocket context
  const { subscribe, status } = useWebSocket();

  // Is the WebSocket connected?
  const isConnected = status === WebSocketStatus.CONNECTED;

  // Subscribe to all message types
  useEffect(() => {
    // Only subscribe if connected
    if (status !== WebSocketStatus.CONNECTED) {
      return;
    }

    // Create unsubscribe functions for each type
    const unsubscribers: (() => void)[] = [];

    // Subscribe to each message type with a callback
    Object.entries(subscriptions).forEach(([type, callback]) => {
      if (!callback) return;

      // Subscribe and store unsubscribe function
      const unsubscribe = subscribe(type as WsMessageType, callback);
      unsubscribers.push(unsubscribe);
    });

    // Clean up all subscriptions
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [subscriptions, subscribe, status]);

  return {
    isConnected,
  };
}

export function useWebsocketStatus() {
  const { status } = useWebSocket();
  return status;
}
