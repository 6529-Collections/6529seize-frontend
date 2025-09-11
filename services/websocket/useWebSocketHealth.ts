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
      
      // Simple decision logic:
      if (currentToken && status === WebSocketStatus.DISCONNECTED) {
        // Have token but not connected -> connect
        connect(currentToken);
      } else if (currentToken && currentToken !== lastTokenRef.current) {
        // Token changed -> reconnect with new token
        connect(currentToken);
      } else if (!currentToken && status !== WebSocketStatus.DISCONNECTED) {
        // No token but connected -> disconnect
        disconnect();
      }
      
      lastTokenRef.current = currentToken;
    }, 10000); // 10 seconds - balanced frequency

    return () => clearInterval(healthCheck);
  }, [connect, disconnect, status]);
}