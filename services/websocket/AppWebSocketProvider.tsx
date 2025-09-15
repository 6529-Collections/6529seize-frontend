"use client";

import React, { useEffect } from "react";
import { WebSocketProvider } from "./WebSocketProvider";
import { DEFAULT_WEBSOCKET_CONFIG, WebSocketConfig } from "./index";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketHealth } from "./useWebSocketHealth";

/**
 * WebSocket connection initializer with coordinated health monitoring
 *
 * EAGER INITIALIZATION PATTERN:
 * - Connects IMMEDIATELY on mount when auth token exists
 * - Delegates all connection management to useWebSocketHealth()
 * - Health monitoring detects auth token and connects during first render cycle
 * - Provides cleanup on unmount
 * 
 * This ensures immediate connectivity for authenticated users while
 * maintaining centralized connection management through health monitoring.
 */
function WebSocketInitializer() {
  const { disconnect } = useWebSocket();

  // EAGER INITIALIZATION: Health monitoring handles immediate connection
  // Health monitoring will check auth token and connect immediately if needed
  useWebSocketHealth();

  // Only handle cleanup on unmount - no initial connection logic
  useEffect(() => {
    // Disconnect on unmount
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return null; // This component doesn't render anything
}

/**
 * Application-level WebSocket provider
 *
 * Wraps the app with WebSocket provider and initializes connection
 */
export function AppWebSocketProvider({
  children,
  config = DEFAULT_WEBSOCKET_CONFIG,
}: {
  readonly children: React.ReactNode;
  readonly config?: WebSocketConfig;
}) {
  return (
    <WebSocketProvider config={config}>
      <WebSocketInitializer />
      {children}
    </WebSocketProvider>
  );
}
