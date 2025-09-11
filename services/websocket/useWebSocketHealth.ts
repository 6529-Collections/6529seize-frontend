"use client";

import { useEffect, useRef } from "react";
import { getAuthJwt } from "../auth/auth.utils";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";

/**
 * WebSocket health monitoring hook
 * 
 * Monitors connection health every 10 seconds and ensures:
 * - Connects when token is available but disconnected
 * - Reconnects when token changes
 * - Disconnects when no token is available
 */
export function useWebSocketHealth() {
  const { connect, disconnect, status } = useWebSocket();
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Check connection health every 10 seconds
    const healthCheck = setInterval(() => {
      const currentToken = getAuthJwt();
      
      // ATOMIC REFERENCE UPDATE: Capture previous value before any logic
      const previousToken = lastTokenRef.current;
      lastTokenRef.current = currentToken;
      
      /**
       * ATOMIC WEBSOCKET HEALTH LOGIC
       * Each health check performs exactly ONE action to prevent redundant connections:
       * Priority 1: Disconnect when no token (clean state)
       * Priority 2: Connect when token exists but disconnected
       * Priority 3: Reconnect when token changes while connected
       */
      if (!currentToken && status !== WebSocketStatus.DISCONNECTED) {
        // Priority 1: No token but connected -> disconnect
        disconnect();
      } else if (currentToken && status === WebSocketStatus.DISCONNECTED) {
        // Priority 2: Have token but disconnected -> connect
        connect(currentToken);
      } else if (currentToken && status !== WebSocketStatus.DISCONNECTED && currentToken !== previousToken) {
        // Priority 3: Token changed while connected -> reconnect
        connect(currentToken);
      }
    }, 10000); // 10 seconds - balanced frequency

    return () => clearInterval(healthCheck);
  }, [connect, disconnect, status]);
}