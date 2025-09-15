"use client";

import { useEffect, useRef } from "react";
import { getAuthJwt } from "../auth/auth.utils";
import { useWebSocket } from "./useWebSocket";
import { WebSocketStatus } from "./WebSocketTypes";

/**
 * WebSocket health monitoring hook
 * 
 * ARCHITECTURE:
 * - Immediate Health Checks: Triggered by status changes for responsive connection management
 * - Periodic Health Checks: Stable 10-second interval for ongoing monitoring
 * - Memory Safe: Single interval prevents leaks during status transitions
 * - Fresh References: Periodic checks use current WebSocket context to avoid stale closures
 */
export function useWebSocketHealth() {
  const webSocketState = useWebSocket();
  const { connect, disconnect, status } = webSocketState;
  const lastTokenRef = useRef<string | null>(null);
  const webSocketStateRef = useRef(webSocketState);
  
  // Keep ref updated with current WebSocket state
  webSocketStateRef.current = webSocketState;

  // Effect 1: Immediate health checks on status changes
  useEffect(() => {
    const currentToken = getAuthJwt();
    const previousToken = lastTokenRef.current;
    lastTokenRef.current = currentToken;
    
    // Atomic WebSocket health logic
    if (!currentToken && status !== WebSocketStatus.DISCONNECTED) {
      disconnect();
    } else if (currentToken && status === WebSocketStatus.DISCONNECTED) {
      connect(currentToken);
    } else if (currentToken && status !== WebSocketStatus.DISCONNECTED && currentToken !== previousToken) {
      connect(currentToken);
    }
  }, [connect, disconnect]); // FIXED: Removed status to prevent reactive behavior

  // Effect 2: Stable periodic monitoring
  useEffect(() => {
    const performPeriodicHealthCheck = () => {
      const currentToken = getAuthJwt();
      const previousToken = lastTokenRef.current;
      lastTokenRef.current = currentToken;
      
      // Get fresh references to avoid stale closures - FIXED: Use ref to access current state
      const currentWebSocketState = webSocketStateRef.current;
      const { status: currentStatus, connect: currentConnect, disconnect: currentDisconnect } = currentWebSocketState;
      
      // Same atomic logic with fresh references
      if (!currentToken && currentStatus !== WebSocketStatus.DISCONNECTED) {
        currentDisconnect();
      } else if (currentToken && currentStatus === WebSocketStatus.DISCONNECTED) {
        currentConnect(currentToken);
      } else if (currentToken && currentStatus !== WebSocketStatus.DISCONNECTED && currentToken !== previousToken) {
        currentConnect(currentToken);
      }
    };

    const healthCheck = setInterval(performPeriodicHealthCheck, 10000);
    return () => clearInterval(healthCheck);
  }, []); // STABLE: Empty dependency prevents interval recreation
}