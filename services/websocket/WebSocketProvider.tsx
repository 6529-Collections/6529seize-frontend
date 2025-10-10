"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  WebSocketContext,
  WebSocketContextValue,
  WebSocketProviderProps,
} from "./WebSocketContext";
import {
  MessageCallback,
  SubscriberMap,
  WebSocketMessage,
  WebSocketStatus,
} from "./WebSocketTypes";
import { WsMessageType } from "@/helpers/Types";
import { getAuthJwt } from "../auth/auth.utils";

// Default values for reconnection
const DEFAULT_RECONNECT_DELAY = 2000; // Start with 2 seconds
const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 20; // Try up to 20 times before giving up
const DEFAULT_HEARTBEAT_INTERVAL = 15000;
const DEFAULT_HEARTBEAT_TIMEOUT = 45000;
const HEARTBEAT_MONITOR_INTERVAL = 1000;
const HEARTBEAT_CLOSE_CODE = 4000;

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
  const heartbeatCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastActivityRef = useRef<number>(Date.now());
  const awaitingHeartbeatRef = useRef(false);
  const lastPingAtRef = useRef<number | null>(null);

  /**
   * Parse and route incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    const now = Date.now();
    const wasAwaitingHeartbeat = awaitingHeartbeatRef.current;
    const lastPingAt = lastPingAtRef.current;

    lastActivityRef.current = now;
    awaitingHeartbeatRef.current = false;
    lastPingAtRef.current = null;

    if (wasAwaitingHeartbeat) {
      const latency =
        typeof lastPingAt === "number" ? now - lastPingAt : undefined;
      console.log(
        latency !== undefined
          ? `[WebSocket] Heartbeat acknowledged after ${latency}ms`
          : "[WebSocket] Heartbeat acknowledged"
      );
    }

    let message: WebSocketMessage<{ data?: any }> | null = null;

    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
      return;
    }

    if (!message || typeof message.type !== "string") {
      console.warn("Received WebSocket message without a valid type:", message);
      return;
    }

    if (message.type === WsMessageType.PING) {
      console.log("[WebSocket] Received heartbeat ping from server");
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: WsMessageType.PONG }));
          console.log("[WebSocket] Responded with heartbeat pong");
        } catch (error) {
          console.error("Failed to send heartbeat pong:", error);
        }
      }
      return;
    }

    if (message.type === WsMessageType.PONG) {
      console.log("[WebSocket] Received heartbeat pong from server");
      return;
    }

    const subscribers = subscribersRef.current.get(message.type);

    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(message.data);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
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
  const attemptReconnect = useCallback(() => {
    // Clear any existing timer
    clearReconnectTimer();

    // Check if we've exceeded max attempts
    const maxAttempts =
      config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
    if (reconnectAttemptsRef.current >= maxAttempts) {
      console.warn(
        `WebSocket reconnect failed after ${reconnectAttemptsRef.current} attempts`
      );
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
      connect(reconnectTokenRef.current);
    }, delay);
  }, [config.maxReconnectAttempts, config.reconnectDelay]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatCheckTimerRef.current) {
      clearInterval(heartbeatCheckTimerRef.current);
      heartbeatCheckTimerRef.current = null;
      console.log("[WebSocket] Stopped heartbeat monitor");
    }
    awaitingHeartbeatRef.current = false;
    lastPingAtRef.current = null;
  }, []);

  const startHeartbeat = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    stopHeartbeat();
    lastActivityRef.current = Date.now();
    awaitingHeartbeatRef.current = false;
    lastPingAtRef.current = null;

    const pingInterval =
      config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL;
    const timeout = config.heartbeatTimeout ?? DEFAULT_HEARTBEAT_TIMEOUT;

    heartbeatCheckTimerRef.current = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (!awaitingHeartbeatRef.current && elapsed >= pingInterval) {
        try {
          ws.send(JSON.stringify({ type: WsMessageType.PING }));
          awaitingHeartbeatRef.current = true;
          lastPingAtRef.current = now;
          console.log(
            `[WebSocket] Sent heartbeat ping after ${elapsed}ms of inactivity`
          );
        } catch (error) {
          console.error("[WebSocket] Failed to send heartbeat ping:", error);
        }
      }

      if (awaitingHeartbeatRef.current && elapsed >= timeout) {
        console.warn(
          `[WebSocket] Heartbeat timeout (${elapsed}ms) — closing socket`
        );
        awaitingHeartbeatRef.current = false;
        lastPingAtRef.current = null;
        ws.close(HEARTBEAT_CLOSE_CODE, "Heartbeat timeout");
      }
    }, HEARTBEAT_MONITOR_INTERVAL);

    console.log("[WebSocket] Started heartbeat monitor");
  }, [
    config.heartbeatInterval,
    config.heartbeatTimeout,
    stopHeartbeat,
  ]);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(
    (token?: string) => {
      // Store token for potential reconnection
      reconnectTokenRef.current = token;

      // Reset manual disconnect flag
      isManualDisconnectRef.current = false;

      stopHeartbeat();

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
      if (token) {
        url += `?token=${encodeURIComponent(token)}`;
      }

      try {
        // Create new WebSocket connection
        const ws = new WebSocket(url);

        // Set up event handlers
        ws.onopen = () => {
          setStatus(WebSocketStatus.CONNECTED);

          // Reset reconnect attempts on successful connection
          reconnectAttemptsRef.current = 0;
          startHeartbeat();
        };

        ws.onmessage = handleMessage;

        ws.onclose = (event) => {
          stopHeartbeat();
          // Clean up WebSocket
          wsRef.current = null;
          setStatus(WebSocketStatus.DISCONNECTED);

          // Only attempt reconnect for unexpected closure (not code 1000)
          // and if this wasn't a manual disconnect
          if (event.code !== 1000 && !isManualDisconnectRef.current) {
            // Get fresh token before reconnecting
            const freshToken = getAuthJwt() || reconnectTokenRef.current;
            if (freshToken) {
              reconnectTokenRef.current = freshToken; // Update stored token
              attemptReconnect();
            }
          } else {
            // Reset reconnect attempts for intentional disconnects
            reconnectAttemptsRef.current = 0;
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          // State will be updated by onclose handler
        };

        // Store the WebSocket reference
        wsRef.current = ws;
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
        setStatus(WebSocketStatus.DISCONNECTED);

        // Schedule reconnect even for connection errors
        attemptReconnect();
      }
    },
    [
      config.url,
      handleMessage,
      clearReconnectTimer,
      attemptReconnect,
      startHeartbeat,
      stopHeartbeat,
    ]
  );

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    // Set flag to indicate this is intentional
    isManualDisconnectRef.current = true;

    // Clear any pending reconnect
    clearReconnectTimer();
    stopHeartbeat();

    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;

    // Close the connection
    if (wsRef.current) {
      wsRef.current.close(1000, "Intentional disconnect");
      wsRef.current = null;
      setStatus(WebSocketStatus.DISCONNECTED);
    }
  }, [clearReconnectTimer, stopHeartbeat]);

  /**
   * Subscribe to a specific message type
   */
  const subscribe = useCallback(
    <T,>(messageType: string, callback: MessageCallback<T>) => {
      // Get or create subscriber set for this message type
      if (!subscribersRef.current.has(messageType)) {
        subscribersRef.current.set(messageType, new Set());
      }

      // Add the callback to subscribers
      const subscribers = subscribersRef.current.get(messageType)!;
      subscribers.add(callback as MessageCallback);

      // Return unsubscribe function
      return () => {
        subscribers.delete(callback as MessageCallback);

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
  const send = useCallback(<T,>(messageType: WsMessageType, data: T) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    const message: WebSocketMessage<T> = { type: messageType, ...data };
    ws.send(JSON.stringify(message));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear any pending reconnect
      clearReconnectTimer();
      stopHeartbeat();

      // Close the connection
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [clearReconnectTimer, stopHeartbeat]);

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
