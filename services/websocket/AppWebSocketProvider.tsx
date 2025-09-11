"use client";

import React, { useEffect } from "react";
import { WebSocketProvider } from "./WebSocketProvider";
import { DEFAULT_WEBSOCKET_CONFIG, WebSocketConfig } from "./index";
import { getAuthJwt } from "../auth/auth.utils";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketHealth } from "./useWebSocketHealth";

/**
 * WebSocket connection initializer with health monitoring
 *
 * Handles initial connection and continuous health monitoring
 */
function WebSocketInitializer() {
  const { connect, disconnect } = useWebSocket();

  // Initial connection on mount
  useEffect(() => {
    const authToken = getAuthJwt();
    if (authToken) {
      connect(authToken);
    }

    // Disconnect on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Continuous health monitoring
  useWebSocketHealth();

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
