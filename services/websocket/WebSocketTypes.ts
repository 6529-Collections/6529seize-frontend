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
 * Upper bound of the random delay applied to resyncs that fire when the socket
 * reconnects, so a deploy does not make every client refetch at the same moment.
 */
export const WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS = 3_000;

export const WEBSOCKET_RECOVERY_CAPABILITY = "resync_v1";

/**
 * Callback type for message subscribers
 */
/**
 * Per-frame fields the server sends next to `type` and `data`. Every field is
 * optional: older servers omit them.
 */
interface WebSocketFrameMetadata {
  readonly reason?: string | undefined;
  /** Epoch ms when the API received the request behind the frame. */
  readonly serverReceivedAt?: number | undefined;
  /** Epoch ms when the server handed the frame to the socket gateway. */
  readonly sentAt?: number | undefined;
  /** Epoch ms when this client started handling the frame. */
  readonly receivedAt: number;
  /**
   * The wave's previous surviving drop serial (WAVES-PLAN 1.5): null when the
   * drop is the wave's first, undefined when the server sent no gap marker.
   */
  readonly prevSerialNo?: number | null | undefined;
}

/** A subscriber gets each frame's data, and nothing else. */
export type MessageCallback<T = unknown> = (data: T) => void;

/**
 * A subscriber registered with `{ withMetadata: true }` also gets that
 * frame's own metadata as a second argument, which works for absent or
 * primitive data too (unlike `getWebSocketMessageReason`).
 */
export type FrameMetadataCallback<T = unknown> = (
  data: T,
  metadata: WebSocketFrameMetadata
) => void;

export interface SubscribeOptions {
  readonly withMetadata?: boolean | undefined;
}

/**
 * Registers a subscriber for one message type and returns its unsubscribe.
 * Only a `{ withMetadata: true }` registration may take the metadata
 * argument, so the callback type matches what the provider passes.
 */
export interface SubscribeFn {
  <T>(messageType: WsMessageType, callback: MessageCallback<T>): () => void;
  <T>(
    messageType: WsMessageType,
    callback: FrameMetadataCallback<T>,
    options: { readonly withMetadata: true }
  ): () => void;
}

/**
 * Map of message types to their callback sets
 */
export type SubscriberMap = Map<
  string,
  Set<MessageCallback | FrameMetadataCallback>
>;

/**
 * Config options for WebSocket connection
 */
export interface WebSocketConfig {
  url: string;
  reconnectDelay?: number | undefined;
  maxReconnectAttempts?: number | undefined;
}
