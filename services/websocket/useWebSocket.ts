import { useContext } from 'react';
import { WebSocketContext, WebSocketContextValue } from './WebSocketContext';

/**
 * Hook to access WebSocket functionality
 * 
 * Provides access to WebSocket connection and message subscription
 * 
 * @returns WebSocket context value with connection status and methods
 * @throws Error if used outside WebSocketProvider
 */
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  
  // Ensure the hook is used within a WebSocketProvider
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}

/**
 * Simplified useWebSocket that doesn't throw for SSR compatibility
 * 
 * @returns WebSocket context or undefined if not available
 */
function useOptionalWebSocket(): WebSocketContextValue | undefined {
  return useContext(WebSocketContext);
}