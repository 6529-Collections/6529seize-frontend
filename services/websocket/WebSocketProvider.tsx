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
import { WsMessageType } from "../../helpers/Types";

// Default values for reconnection
const DEFAULT_RECONNECT_DELAY = 2000; // Start with 2 seconds
const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 20; // Try up to 20 times before giving up

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

  /**
   * Parse and route incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      // Parse the message
      const message: WebSocketMessage<{ data: any }> = JSON.parse(event.data);

      // Get subscribers for this message type
      const subscribers = subscribersRef.current.get(message.type);

      // If there are subscribers, notify them with the message data
      if (subscribers) {
        subscribers.forEach((callback) => {
          try {
            callback(message.data);
          } catch (error) {
            console.error("Error in subscriber callback:", error);
          }
        });
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
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

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(
    (token?: string) => {
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
        };

        ws.onmessage = handleMessage;

        ws.onclose = (event) => {
          // Clean up WebSocket
          wsRef.current = null;
          setStatus(WebSocketStatus.DISCONNECTED);

          // Only attempt reconnect for unexpected closure (not code 1000)
          // and if this wasn't a manual disconnect
          if (event.code !== 1000 && !isManualDisconnectRef.current) {
            attemptReconnect();
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
