"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  WebSocketContextValue,
  WebSocketProviderProps,
} from "./WebSocketContext";
import { WebSocketContext } from "./WebSocketContext";
import type {
  FrameMetadataCallback,
  MessageCallback,
  SubscribeFn,
  SubscribeOptions,
  SubscriberMap,
  WebSocketMessage,
} from "./WebSocketTypes";
import {
  setWebSocketMessageMetadata,
  WebSocketStatus,
  WEBSOCKET_RECOVERY_CAPABILITY,
  type WebSocketConnectionInfo,
} from "./WebSocketTypes";
import { getSocketIdentityKey } from "./socketIdentity";
import { isPongFrame, isWsPingEnabled, SocketPinger } from "./socketPing";
import { publicEnv } from "@/config/env";
import { applyDelayJitter } from "@/helpers/jitter.helpers";
import { getClientBuildId } from "@/lib/version/versionPoll";
import { asNonEmptyString } from "@/lib/text/nonEmptyString";
import { ensureActiveSession } from "../auth/session-readiness";
import { getAuthJwt, isAuthJwtUsable } from "../auth/auth.utils";

// Default values for reconnection
const DEFAULT_RECONNECT_DELAY = 2000; // Start with 2 seconds
const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds, before jitter
const RECONNECT_JITTER_RATIO = 0.25; // +/-25% so reconnects do not synchronize
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 20; // Try up to 20 times before giving up
const AUTHENTICATION_TIMEOUT_MS = 8000;
const AUTHENTICATION_FAILED_CLOSE_CODE = 4008;
const AUTHENTICATION_TIMEOUT_CLOSE_CODE = 4011;

type WebSocketMessagePayload = {
  readonly type?: unknown;
  readonly data?: unknown;
  readonly reason?: unknown;
  readonly server_received_at?: unknown;
  readonly sent_at?: unknown;
  readonly prev_serial_no?: unknown;
  readonly message?: {
    readonly type?: unknown;
    readonly data?: unknown;
    readonly reason?: unknown;
  };
};

interface NormalizedIncomingMessage {
  readonly type: string;
  readonly data: unknown;
  readonly reason?: string;
  readonly serverReceivedAt?: number;
  readonly sentAt?: number;
  readonly prevSerialNo?: number | null;
}

const WEBSOCKET_AUTHENTICATE = "AUTHENTICATE";
const WEBSOCKET_AUTHENTICATED = "AUTHENTICATED";
const WEBSOCKET_AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED";
const WEBSOCKET_BATCH = "BATCH";

const asEpochMs = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;

const asPrevSerialNo = (value: unknown): number | null | undefined => {
  if (value === null) return null;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
};

const asWebSocketMessagePayload = (
  value: unknown
): WebSocketMessagePayload | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as WebSocketMessagePayload;
};

const normalizeIncomingMessage = (
  value: unknown
): NormalizedIncomingMessage | undefined => {
  const payload = asWebSocketMessagePayload(value);
  if (!payload) {
    return undefined;
  }

  const nestedPayload = asWebSocketMessagePayload(payload.message);
  const type =
    asNonEmptyString(payload.type) ?? asNonEmptyString(nestedPayload?.type);

  if (!type) {
    return undefined;
  }

  const reason =
    asNonEmptyString(payload.reason) ?? asNonEmptyString(nestedPayload?.reason);
  const serverReceivedAt = asEpochMs(payload.server_received_at);
  const sentAt = asEpochMs(payload.sent_at);
  const prevSerialNo = asPrevSerialNo(payload.prev_serial_no);

  return {
    type,
    data: payload.data ?? nestedPayload?.data,
    ...(reason ? { reason } : {}),
    ...(serverReceivedAt === undefined ? {} : { serverReceivedAt }),
    ...(sentAt === undefined ? {} : { sentAt }),
    ...(prevSerialNo === undefined ? {} : { prevSerialNo }),
  };
};

/**
 * The inner frames of a `BATCH` frame, in server order. A batch never holds
 * auth or sync frames, so those inner types are dropped rather than trusted.
 */
// A batch stays under 28 KiB, so far fewer frames than this fit in one.
const MAX_BATCHED_FRAMES = 500;

const getBatchedMessages = (data: unknown): NormalizedIncomingMessage[] => {
  const batch = asWebSocketMessagePayload(data);
  const messages: unknown =
    batch === undefined ? undefined : Reflect.get(batch, "messages");
  if (!Array.isArray(messages)) return [];
  return messages.slice(0, MAX_BATCHED_FRAMES).flatMap((inner: unknown) => {
    const message = normalizeIncomingMessage(inner);
    return message &&
      message.type !== WEBSOCKET_BATCH &&
      message.type !== WEBSOCKET_AUTHENTICATED &&
      message.type !== WEBSOCKET_AUTHENTICATION_FAILED
      ? [message]
      : [];
  });
};

const createCredentialMarker = (credential: string): string => {
  let primary = 0;
  let secondary = 5381;

  for (let index = 0; index < credential.length; index += 1) {
    const code = credential.codePointAt(index) ?? 0;
    primary = (primary * 31 + code) % 2_147_483_647;
    secondary = (secondary * 33 + code) % 2_147_483_647;
  }

  return `${credential.length}:${primary}:${secondary}`;
};

type AnySubscriber = MessageCallback | FrameMetadataCallback;

const dispatchMessage = (
  subscriberMap: SubscriberMap,
  metadataSubscribers: WeakSet<AnySubscriber>,
  message: NormalizedIncomingMessage,
  receivedAt: number
): void => {
  const subscribers = subscriberMap.get(message.type);
  if (!subscribers) {
    return;
  }

  setWebSocketMessageMetadata(message.data, { reason: message.reason });
  const metadata = {
    reason: message.reason,
    serverReceivedAt: message.serverReceivedAt,
    sentAt: message.sentAt,
    receivedAt,
    ...(message.prevSerialNo === undefined
      ? {}
      : { prevSerialNo: message.prevSerialNo }),
  };
  for (const subscriber of subscribers) {
    try {
      if (metadataSubscribers.has(subscriber)) {
        (subscriber as FrameMetadataCallback)(message.data, metadata);
      } else {
        (subscriber as MessageCallback)(message.data);
      }
    } catch {
      // Keep one subscriber failure from blocking the remaining handlers.
    }
  }
};

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateReconnectDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number
): number {
  // Exponential backoff formula: initialDelay * 1.5^attempt (capped at maxDelay)
  const delay = Math.min(initialDelay * Math.pow(1.5, attempt), maxDelay);
  // Jitter is applied after the cap so clients that saturate at the maximum
  // delay still spread out instead of reconnecting together after a deploy.
  return applyDelayJitter(delay, RECONNECT_JITTER_RATIO);
}

/**
 * WebSocket Provider Component
 *
 * Manages WebSocket connection, message routing, and reconnection
 */
export function WebSocketProvider({
  children,
  config,
}: WebSocketProviderProps) {
  // Connection state tracking
  const [status, setStatus] = useState<WebSocketStatus>(
    WebSocketStatus.DISCONNECTED
  );
  const [connection, setConnection] = useState<WebSocketConnectionInfo | null>(
    null
  );
  const statusRef = useRef(WebSocketStatus.DISCONNECTED);
  // The identity of the last authenticated session, null before the first.
  const sessionIdentityRef = useRef<string | null>(null);
  // When the current socket opened or last delivered a frame.
  const lastFrameAtRef = useRef(0);
  // Keepalive and liveness checks for the current socket, when enabled.
  const pingerRef = useRef<SocketPinger | null>(null);

  // WebSocket connection reference
  const wsRef = useRef<WebSocket | null>(null);

  // Subscriber map for message routing
  const subscribersRef = useRef<SubscriberMap>(new Map());
  // Subscribers that asked for each frame's metadata as a second argument
  const metadataSubscribersRef = useRef(new WeakSet<AnySubscriber>());

  // Reconnection tracking
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const authenticationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);
  const connectionRequestRef = useRef(0);
  const reconnectTokenRef = useRef<string | undefined>(undefined);
  const rejectedCredentialMarkerRef = useRef<string | null>(null);

  const clearAuthenticationTimer = useCallback(() => {
    if (authenticationTimerRef.current) {
      clearTimeout(authenticationTimerRef.current);
      authenticationTimerRef.current = null;
    }
  }, []);

  const stopPinger = useCallback(() => {
    pingerRef.current?.stop();
    pingerRef.current = null;
  }, []);

  const updateStatus = useCallback((next: WebSocketStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  /** Records an authenticated session and how it came about. */
  const markAuthenticated = useCallback(() => {
    let kind: WebSocketConnectionInfo["kind"] = "reconnect";
    if (statusRef.current === WebSocketStatus.CONNECTED) {
      kind = "reauthenticated";
    } else if (sessionIdentityRef.current === null) {
      kind = "initial";
    }
    sessionIdentityRef.current = getSocketIdentityKey(
      reconnectTokenRef.current
    );
    reconnectAttemptsRef.current = 0;
    updateStatus(WebSocketStatus.CONNECTED);
    setConnection((previous) => ({
      revision: (previous?.revision ?? 0) + 1,
      kind,
    }));
  }, [updateStatus]);

  /**
   * Parse and route incoming WebSocket messages
   */
  const handleMessage = useCallback(
    (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "string") {
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }

      // A PONG only proves the socket is alive; receiving it did that.
      if (isPongFrame(parsed)) return;
      const message = normalizeIncomingMessage(parsed);
      if (!message) {
        return;
      }

      if (message.type === WEBSOCKET_AUTHENTICATED) {
        clearAuthenticationTimer();
        markAuthenticated();
        return;
      }

      if (message.type === WEBSOCKET_AUTHENTICATION_FAILED) {
        clearAuthenticationTimer();
        rejectedCredentialMarkerRef.current = reconnectTokenRef.current
          ? createCredentialMarker(reconnectTokenRef.current)
          : null;
        updateStatus(WebSocketStatus.DISCONNECTED);
        isManualDisconnectRef.current = true;
        wsRef.current?.close(
          AUTHENTICATION_FAILED_CLOSE_CODE,
          "Authentication failed"
        );
        return;
      }

      const receivedAt = Date.now();
      // A batch carries whole frames in server order; each is handled as if
      // it had arrived on its own.
      const messages =
        message.type === WEBSOCKET_BATCH
          ? getBatchedMessages(message.data)
          : [message];
      for (const routed of messages) {
        dispatchMessage(
          subscribersRef.current,
          metadataSubscribersRef.current,
          routed,
          receivedAt
        );
      }
    },
    [clearAuthenticationTimer, markAuthenticated, updateStatus]
  );

  /**
   * Clear any pending reconnection timer
   */
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  /**
   * Attempt reconnection with exponential backoff
   */
  const attemptReconnect = useCallback(
    (connectSocket: (token?: string) => void) => {
      // Clear any existing timer
      clearReconnectTimer();

      // Check if we've exceeded max attempts
      const maxAttempts =
        config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
      if (reconnectAttemptsRef.current >= maxAttempts) {
        return;
      }

      // Calculate delay based on attempts
      const baseDelay = config.reconnectDelay ?? DEFAULT_RECONNECT_DELAY;
      const delay = calculateReconnectDelay(
        reconnectAttemptsRef.current,
        baseDelay,
        MAX_RECONNECT_DELAY
      );
      // Schedule reconnection
      reconnectTimerRef.current = setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        // Attempt reconnection with the stored token
        connectSocket(reconnectTokenRef.current);
      }, delay);
    },
    [clearReconnectTimer, config.maxReconnectAttempts, config.reconnectDelay]
  );

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(
    function connectSocket(token?: string) {
      const connectionRequest = ++connectionRequestRef.current;
      if (token && !isAuthJwtUsable(token)) {
        const rejectedToken = token;
        void ensureActiveSession()
          .then((freshToken) => {
            if (
              connectionRequestRef.current === connectionRequest &&
              freshToken &&
              freshToken !== rejectedToken &&
              isAuthJwtUsable(freshToken) &&
              getAuthJwt() === freshToken
            ) {
              connectSocket(freshToken);
            }
          })
          .catch(() => undefined);
        return;
      }
      const useMessageAuth = !!token;
      const credentialMarker = token ? createCredentialMarker(token) : null;

      if (
        useMessageAuth &&
        credentialMarker !== null &&
        rejectedCredentialMarkerRef.current === credentialMarker
      ) {
        reconnectTokenRef.current = token;
        isManualDisconnectRef.current = true;
        clearReconnectTimer();
        reconnectAttemptsRef.current = 0;
        updateStatus(WebSocketStatus.DISCONNECTED);
        return;
      }

      if (credentialMarker !== rejectedCredentialMarkerRef.current) {
        rejectedCredentialMarkerRef.current = null;
      }

      // Store token for potential reconnection
      reconnectTokenRef.current = token;

      // Reset manual disconnect flag
      isManualDisconnectRef.current = false;

      // Close existing connection if any
      if (wsRef.current) {
        clearAuthenticationTimer();
        stopPinger();
        wsRef.current.close();
        wsRef.current = null;
      }

      // Clear any pending reconnect
      clearReconnectTimer();

      // Update status to connecting
      updateStatus(WebSocketStatus.CONNECTING);

      try {
        // Advertise reconnect safety on every connection, including anonymous sessions.
        const url = new URL(config.url);
        url.searchParams.set(
          "recovery_capability",
          WEBSOCKET_RECOVERY_CAPABILITY
        );
        if (token && !useMessageAuth) {
          url.searchParams.set("token", token);
        }
        // Adoption telemetry: the page's build, as reported to /api/version.
        const clientVersion = getClientBuildId(publicEnv.VERSION);
        if (clientVersion) {
          url.searchParams.set("client_version", clientVersion);
        }
        // Create new WebSocket connection
        const ws = new WebSocket(url.toString());

        // Set up event handlers
        ws.onopen = () => {
          if (wsRef.current !== ws) {
            return;
          }
          lastFrameAtRef.current = Date.now();
          if (isWsPingEnabled()) {
            // A socket that stops answering PINGs is replaced: a new
            // session, with the reconnect resync that follows one.
            pingerRef.current = new SocketPinger(ws, () => {
              if (wsRef.current === ws) {
                connectSocket(getAuthJwt() ?? reconnectTokenRef.current);
              }
            });
          }

          if (useMessageAuth) {
            updateStatus(WebSocketStatus.AUTHENTICATING);
            ws.send(
              JSON.stringify({
                type: WEBSOCKET_AUTHENTICATE,
                access_token: token,
              })
            );
            authenticationTimerRef.current = setTimeout(() => {
              if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
                isManualDisconnectRef.current = true;
                ws.close(
                  AUTHENTICATION_TIMEOUT_CLOSE_CODE,
                  "Authentication timeout"
                );
              }
            }, AUTHENTICATION_TIMEOUT_MS);
            return;
          }

          markAuthenticated();
        };

        ws.onmessage = (event) => {
          if (wsRef.current !== ws) {
            return;
          }

          lastFrameAtRef.current = Date.now();
          pingerRef.current?.noteReceived();
          handleMessage(event);
        };

        ws.onclose = () => {
          if (wsRef.current !== ws) {
            return;
          }

          // Clean up WebSocket
          clearAuthenticationTimer();
          stopPinger();
          wsRef.current = null;
          updateStatus(WebSocketStatus.DISCONNECTED);

          // API Gateway may close a slow listener with code 1000. Only a local
          // intentional disconnect should suppress normal authenticated recovery.
          const shouldReconnect = !isManualDisconnectRef.current;
          const freshToken = shouldReconnect
            ? (getAuthJwt() ?? reconnectTokenRef.current)
            : undefined;

          // Reconnect server-initiated closures, including normal transport closes.
          if (shouldReconnect) {
            // Get fresh token before reconnecting
            if (freshToken) {
              reconnectTokenRef.current = freshToken; // Update stored token
              attemptReconnect(connectSocket);
            }
          } else {
            // Reset reconnect attempts for intentional disconnects
            reconnectAttemptsRef.current = 0;
          }
        };

        // Store the WebSocket reference
        wsRef.current = ws;
      } catch {
        clearAuthenticationTimer();
        updateStatus(WebSocketStatus.DISCONNECTED);

        // Schedule reconnect even for connection errors
        attemptReconnect(connectSocket);
      }
    },
    [
      config.url,
      handleMessage,
      clearReconnectTimer,
      clearAuthenticationTimer,
      stopPinger,
      attemptReconnect,
      markAuthenticated,
      updateStatus,
    ]
  );

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    connectionRequestRef.current += 1;
    // Set flag to indicate this is intentional
    isManualDisconnectRef.current = true;

    // Clear any pending reconnect
    clearReconnectTimer();
    clearAuthenticationTimer();
    stopPinger();

    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;

    // Close the connection
    if (wsRef.current) {
      wsRef.current.close(1000, "Intentional disconnect");
      wsRef.current = null;
      updateStatus(WebSocketStatus.DISCONNECTED);
    }
  }, [clearReconnectTimer, clearAuthenticationTimer, stopPinger, updateStatus]);

  /** Replaces a socket that stopped answering, unless it was replaced already. */
  const replaceUnresponsiveSocket = useCallback(
    (ws: WebSocket) => {
      if (wsRef.current === ws) {
        connect(getAuthJwt() ?? reconnectTokenRef.current);
      }
    },
    [connect]
  );

  const reauthenticate = useCallback(
    (token: string) => {
      const ws = wsRef.current;
      const isOpenSession =
        statusRef.current === WebSocketStatus.CONNECTED &&
        ws?.readyState === WebSocket.OPEN;
      if (isOpenSession && token === reconnectTokenRef.current) {
        return;
      }
      if (
        !ws ||
        !isOpenSession ||
        authenticationTimerRef.current !== null ||
        sessionIdentityRef.current !== getSocketIdentityKey(token) ||
        !isAuthJwtUsable(token)
      ) {
        // Another identity, or no settled session to update: start over.
        connect(token);
        return;
      }
      // The server swaps the token on this connection and keeps its open
      // wave and delivery state, so nothing is missed.
      reconnectTokenRef.current = token;
      rejectedCredentialMarkerRef.current = null;
      ws.send(
        JSON.stringify({ type: WEBSOCKET_AUTHENTICATE, access_token: token })
      );
      authenticationTimerRef.current = setTimeout(() => {
        authenticationTimerRef.current = null;
        replaceUnresponsiveSocket(ws);
      }, AUTHENTICATION_TIMEOUT_MS);
    },
    [connect, replaceUnresponsiveSocket]
  );

  // A socket that delivered a frame since `since` is alive. A quiet one may
  // have died silently: with PING enabled it is asked and replaced only if it
  // does not answer; without, it is replaced.
  const ensureLive = useCallback(
    (since: number) => {
      const ws = wsRef.current;
      if (
        ws &&
        statusRef.current === WebSocketStatus.CONNECTED &&
        authenticationTimerRef.current === null &&
        (ws.readyState !== WebSocket.OPEN || lastFrameAtRef.current < since)
      ) {
        const pinger = pingerRef.current;
        if (ws.readyState === WebSocket.OPEN && pinger?.ws === ws) {
          pinger.probe();
        } else {
          replaceUnresponsiveSocket(ws);
        }
      }
    },
    [replaceUnresponsiveSocket]
  );

  /**
   * Subscribe to a specific message type
   */
  const subscribe = useCallback<SubscribeFn>(
    <T,>(
      messageType: string,
      subscriber: MessageCallback<T> | FrameMetadataCallback<T>,
      options?: SubscribeOptions
    ) => {
      const registered = subscriber as AnySubscriber;
      if (options?.withMetadata) {
        metadataSubscribersRef.current.add(registered);
      }
      // Get or create subscriber set for this message type
      if (!subscribersRef.current.has(messageType)) {
        subscribersRef.current.set(messageType, new Set());
      }

      // Add the subscriber handler
      const subscribers = subscribersRef.current.get(messageType)!;
      subscribers.add(registered);

      // Return unsubscribe function
      return () => {
        subscribers.delete(registered);

        // Clean up empty subscriber sets
        if (subscribers.size === 0) {
          subscribersRef.current.delete(messageType);
        }
      };
    },
    []
  );

  /**
   * Send a message through the WebSocket
   * @param messageType - Type identifier for the message
   * @param data - Payload for the message
   */
  const send: WebSocketContextValue["send"] = useCallback(
    (messageType, data) => {
      const ws = wsRef.current;
      if (ws?.readyState !== WebSocket.OPEN) {
        return;
      }
      const message: WebSocketMessage<typeof data> = {
        type: messageType,
        ...data,
      };
      ws.send(JSON.stringify(message));
      pingerRef.current?.noteSent();
    },
    []
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      connectionRequestRef.current += 1;
      // Clear any pending reconnect
      clearReconnectTimer();
      clearAuthenticationTimer();
      stopPinger();

      // Close the connection
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [clearReconnectTimer, clearAuthenticationTimer, stopPinger]);

  // Create context value
  const contextValue: WebSocketContextValue = useMemo(
    () => ({
      status,
      connection,
      connect,
      disconnect,
      reauthenticate,
      ensureLive,
      subscribe,
      send,
      config,
    }),
    [
      status,
      connection,
      connect,
      disconnect,
      reauthenticate,
      ensureLive,
      subscribe,
      send,
      config,
    ]
  );

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
