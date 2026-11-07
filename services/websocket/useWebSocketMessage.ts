"use client";

import { useEffect, useEffectEvent } from "react";
import { useWebSocket } from "./useWebSocket";
import {
  WebSocketStatus,
  type FrameMetadataCallback,
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
 * @param options - `{ withMetadata: true }` also passes each frame's metadata
 * @returns
 *   - isConnected: Whether the WebSocket is connected
 */
export function useWebSocketMessage<T = any>(
  messageType: WsMessageType,
  callback: MessageCallback<T>
): { isConnected: boolean };
export function useWebSocketMessage<T = unknown>(
  messageType: WsMessageType,
  callback: FrameMetadataCallback<T>,
  options: { readonly withMetadata: true }
): { isConnected: boolean };
export function useWebSocketMessage<T = unknown>(
  messageType: WsMessageType,
  callback: MessageCallback<T> | FrameMetadataCallback<T>,
  options?: SubscribeOptions
): { isConnected: boolean } {
  // Get WebSocket context
  const { subscribe, status } = useWebSocket();

  const onMessage = useEffectEvent(
    (data: T, metadata?: Parameters<FrameMetadataCallback<T>>[1]) => {
      if (metadata === undefined) {
        (callback as MessageCallback<T>)(data);
      } else {
        (callback as FrameMetadataCallback<T>)(data, metadata);
      }
    }
  );

  // Is the WebSocket connected?
  const isConnected = status === WebSocketStatus.CONNECTED;

  const withMetadata = options?.withMetadata === true;
  useEffect(() => {
    return withMetadata
      ? subscribe<T>(messageType, onMessage, { withMetadata })
      : subscribe<T>(messageType, (data: T) => onMessage(data));
  }, [messageType, subscribe, withMetadata]);

  return {
    isConnected,
  };
}

export function useWebsocketStatus() {
  const { status } = useWebSocket();
  return status;
}
