import { WsMessageType } from "@/helpers/Types";

/**
 * WebSocket message structure for type-safe message handling
 */
export type WebSocketMessage<T = {}> = {
  type: WsMessageType;
} & T;

/**
 * Connection status for the WebSocket
 */
export enum WebSocketStatus {
  CONNECTED = "connected",
  CONNECTING = "connecting",
  DISCONNECTED = "disconnected",
}

/**
 * Callback type for message subscribers
 */
export type MessageCallback<T = any> = (data: T) => void;

/**
 * Map of message types to their callback sets
 */
export type SubscriberMap = Map<string, Set<MessageCallback>>;

/**
 * Config options for WebSocket connection
 */
export interface WebSocketConfig {
  url: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  /**
   * Optional jitter factor (0-1) applied to each reconnect delay to avoid herd behaviour.
   * Represents the maximum percentage variance applied around the base delay.
   */
  reconnectJitter?: number;
}
