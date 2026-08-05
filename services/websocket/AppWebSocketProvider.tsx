"use client";

import React, { useEffect } from "react";
import { WebSocketProvider } from "./WebSocketProvider";
import type { WebSocketConfig } from ".";
import { DEFAULT_WEBSOCKET_CONFIG } from ".";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketHealth } from "./useWebSocketHealth";
import { MarketplacePreviewWebSocketSync } from "./MarketplacePreviewWebSocketSync";
import { NotificationWebSocketSync } from "./NotificationWebSocketSync";

/**
 * WebSocket connection initializer with coordinated health monitoring
 *
 * EAGER INITIALIZATION PATTERN:
 * - Connects IMMEDIATELY on mount when auth token exists
 * - Delegates auth-driven desired connection state to useWebSocketHealth()
 * - WebSocketProvider owns socket lifecycle and replacement safety
 * - Health monitoring detects auth token and connects during first render cycle
 * - Provides cleanup on unmount
 *
 * This ensures immediate connectivity for authenticated users while
 * keeping socket lifecycle logic inside the provider.
 */
function WebSocketInitializer() {
  const { disconnect } = useWebSocket();

  // Health monitoring checks auth state and requests the desired connection state.
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
  readonly config?: WebSocketConfig | undefined;
}) {
  return (
    <WebSocketProvider config={config}>
      <WebSocketInitializer />
      <MarketplacePreviewWebSocketSync />
      <NotificationWebSocketSync />
      {children}
    </WebSocketProvider>
  );
}
