import type { WsMessageType } from "@/helpers/Types";

/**
 * WebSocket message structure for type-safe message handling
 */
export type WebSocketMessage<T = {}> = {
  type: WsMessageType;
} & T;

interface WebSocketMessageMetadata {
  readonly reason?: string | undefined;
}

const messageMetadataByPayload = new WeakMap<
  object,
  WebSocketMessageMetadata
>();

const isObjectPayload = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

export function setWebSocketMessageMetadata(
  payload: unknown,
  metadata: WebSocketMessageMetadata
): void {
  if (!isObjectPayload(payload)) {
    return;
  }

  messageMetadataByPayload.set(payload, metadata);
}

export function getWebSocketMessageReason(payload: unknown): string | null {
  if (!isObjectPayload(payload)) {
    return null;
  }

  const metadataReason = messageMetadataByPayload.get(payload)?.reason;
  if (typeof metadataReason === "string" && metadataReason.length > 0) {
    return metadataReason;
  }

  const inlineReason = (payload as { readonly reason?: unknown }).reason;
  return typeof inlineReason === "string" && inlineReason.length > 0
    ? inlineReason
    : null;
}

/**
 * Connection status for the WebSocket
 */
export enum WebSocketStatus {
  AUTHENTICATING = "authenticating",
  CONNECTED = "connected",
  CONNECTING = "connecting",
  DISCONNECTED = "disconnected",
}

/**
 * Callback type for message subscribers
 */
export type MessageCallback<T = unknown> = (data: T) => void;

/**
 * Map of message types to their callback sets
 */
export type SubscriberMap = Map<string, Set<MessageCallback>>;

/**
 * Config options for WebSocket connection
 */
export interface WebSocketConfig {
  url: string;
  reconnectDelay?: number | undefined;
  maxReconnectAttempts?: number | undefined;
}
