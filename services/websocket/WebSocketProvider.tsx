"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  WebSocketContextValue,
  WebSocketProviderProps,
} from "./WebSocketContext";
import { WebSocketContext } from "./WebSocketContext";
import type {
  MessageCallback,
  SubscriberMap,
  WebSocketMessage,
} from "./WebSocketTypes";
import { setWebSocketMessageMetadata, WebSocketStatus } from "./WebSocketTypes";
import { asNonEmptyString } from "@/lib/text/nonEmptyString";
import { getAuthJwt } from "../auth/auth.utils";
import { isWalletAuthSessionV2Enabled } from "../auth/session-v2.utils";

// Default values for reconnection
const DEFAULT_RECONNECT_DELAY = 2000; // Start with 2 seconds
const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 20; // Try up to 20 times before giving up

type WebSocketMessagePayload = {
  readonly type?: unknown;
  readonly data?: unknown;
  readonly reason?: unknown;
  readonly message?: {
    readonly type?: unknown;
    readonly data?: unknown;
    readonly reason?: unknown;
  };
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
):
  | { readonly type: string; readonly data: unknown; readonly reason?: string }
  | undefined => {
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

  return {
    type,
    data: payload.data ?? nestedPayload?.data,
    ...(reason ? { reason } : {}),
  };
};

const WEBSOCKET_AUTHENTICATE = "AUTHENTICATE";
const WEBSOCKET_AUTHENTICATED = "AUTHENTICATED";
const WEBSOCKET_AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED";

const createCredentialMarker = (credential: string): string => {
  let primary = 0;
  let secondary = 5381;

  for (let index = 0; index < credential.length; index += 1) {
    const code = credential.charCodeAt(index);
    primary = (primary * 31 + code) % 2_147_483_647;
    secondary = (secondary * 33 + code) % 2_147_483_647;
  }

  return `${credential.length}:${primary}:${secondary}`;
};

/**
 * Calculate delay for exponential backoff
 */
function calculateReconnectDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number
): number {
  // Exponential backoff formula: initialDelay * 2^attempt (capped at maxDelay)
  const delay = initialDelay * Math.pow(1.5, attempt);
  return Math.min(delay, maxDelay);
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

  // WebSocket connection reference
  const wsRef = useRef<WebSocket | null>(null);

  // Subscriber map for message routing
  const subscribersRef = useRef<SubscriberMap>(new Map());

  // Reconnection tracking
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);
  const reconnectTokenRef = useRef<string | undefined>(undefined);
  const rejectedCredentialMarkerRef = useRef<string | null>(null);

  /**
   * Parse and route incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent<unknown>) => {
    if (typeof event.data !== "string") {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(event.data);
    } catch {
      return;
    }

    const message = normalizeIncomingMessage(parsed);
    if (!message) {
      return;
    }

    if (message.type === WEBSOCKET_AUTHENTICATED) {
      setStatus(WebSocketStatus.CONNECTED);
      reconnectAttemptsRef.current = 0;
      return;
    }

    if (message.type === WEBSOCKET_AUTHENTICATION_FAILED) {
      rejectedCredentialMarkerRef.current = reconnectTokenRef.current
        ? createCredentialMarker(reconnectTokenRef.current)
        : null;
      setStatus(WebSocketStatus.DISCONNECTED);
      isManualDisconnectRef.current = true;
      wsRef.current?.close(1008, "Authentication failed");
      return;
    }

    // Get subscribers for this message type
    const subscribers = subscribersRef.current.get(message.type);

    if (!subscribers) {
      return;
    }

    setWebSocketMessageMetadata(message.data, {
      reason: message.reason,
    });

    for (const subscriber of subscribers) {
      try {
        subscriber(message.data);
      } catch {
        // Keep one subscriber failure from blocking the remaining handlers.
      }
    }
  }, []);

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
      const useMessageAuth = !!token && isWalletAuthSessionV2Enabled();
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
        setStatus(WebSocketStatus.DISCONNECTED);
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
        wsRef.current.close();
        wsRef.current = null;
      }

      // Clear any pending reconnect
      clearReconnectTimer();

      // Update status to connecting
      setStatus(WebSocketStatus.CONNECTING);

      // Build URL with optional token
      let url = config.url;
      if (token && !useMessageAuth) {
        url += `?token=${encodeURIComponent(token)}`;
      }

      try {
        // Create new WebSocket connection
        const ws = new WebSocket(url);

        // Set up event handlers
        ws.onopen = () => {
          if (wsRef.current !== ws) {
            return;
          }

          if (useMessageAuth) {
            setStatus(WebSocketStatus.AUTHENTICATING);
            ws.send(
              JSON.stringify({
                type: WEBSOCKET_AUTHENTICATE,
                access_token: token,
              })
            );
            return;
          }

          setStatus(WebSocketStatus.CONNECTED);
          // Reset reconnect attempts on successful connection
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (wsRef.current !== ws) {
            return;
          }

          handleMessage(event);
        };

        ws.onclose = (event) => {
          if (wsRef.current !== ws) {
            return;
          }

          // Clean up WebSocket
          wsRef.current = null;
          setStatus(WebSocketStatus.DISCONNECTED);

          const shouldReconnect =
            event.code !== 1000 && !isManualDisconnectRef.current;
          const freshToken = shouldReconnect
            ? (getAuthJwt() ?? reconnectTokenRef.current)
            : undefined;

          // Only attempt reconnect for unexpected closure (not code 1000)
          // and if this wasn't a manual disconnect
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
        setStatus(WebSocketStatus.DISCONNECTED);

        // Schedule reconnect even for connection errors
        attemptReconnect(connectSocket);
      }
    },
    [config.url, handleMessage, clearReconnectTimer, attemptReconnect]
  );

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    // Set flag to indicate this is intentional
    isManualDisconnectRef.current = true;

    // Clear any pending reconnect
    clearReconnectTimer();

    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;

    // Close the connection
    if (wsRef.current) {
      wsRef.current.close(1000, "Intentional disconnect");
      wsRef.current = null;
      setStatus(WebSocketStatus.DISCONNECTED);
    }
  }, [clearReconnectTimer]);

  /**
   * Subscribe to a specific message type
   */
  const subscribe = useCallback(
    <T,>(messageType: string, subscriber: MessageCallback<T>) => {
      // Get or create subscriber set for this message type
      if (!subscribersRef.current.has(messageType)) {
        subscribersRef.current.set(messageType, new Set());
      }

      // Add the subscriber handler
      const subscribers = subscribersRef.current.get(messageType)!;
      subscribers.add(subscriber as MessageCallback);

      // Return unsubscribe function
      return () => {
        subscribers.delete(subscriber as MessageCallback);

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
    },
    []
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear any pending reconnect
      clearReconnectTimer();

      // Close the connection
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [clearReconnectTimer]);

  // Create context value
  const contextValue: WebSocketContextValue = useMemo(
    () => ({
      status,
      connect,
      disconnect,
      subscribe,
      send,
      config,
    }),
    [status, connect, disconnect, subscribe, send, config]
  );

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
