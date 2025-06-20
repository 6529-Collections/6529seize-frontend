"use client";

import React, { useEffect } from "react";
import { WebSocketProvider } from "./WebSocketProvider";
import { DEFAULT_WEBSOCKET_CONFIG, WebSocketConfig } from "./index";
import { getAuthJwt } from "../auth/auth.utils";
import { useWebSocket } from "./useWebSocket";

/**
 * WebSocket connection initializer component
 *
 * Connects to WebSocket using auth token when available
 */
function WebSocketInitializer() {
  const { connect, disconnect } = useWebSocket();

  // Connect on mount with auth token if available
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
