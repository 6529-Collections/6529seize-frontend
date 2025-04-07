import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { WebSocketStatus } from './WebSocketTypes';
import { getAuthJwt } from '../auth/auth.utils';
import { WALLET_AUTH_COOKIE } from '../../constants';

/**
 * Hook for automatic WebSocket authentication
 * 
 * Manages WebSocket connection based on auth state:
 * - Connects automatically when JWT is available
 * - Disconnects when JWT is removed
 * - Reconnects when JWT changes
 * 
 * @returns
 *   - isAuthenticated: Whether the WebSocket is connected with auth
 *   - status: Current WebSocket connection status
 *   - disconnect: Function to manually disconnect
 */
export function useWebSocketAuth() {
  const { connect, disconnect, status } = useWebSocket();
  const [authToken, setAuthToken] = useState<string | null>(getAuthJwt());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check for auth token changes
  useEffect(() => {
    // Function to check if token has changed
    const checkAuthToken = () => {
      const currentToken = getAuthJwt();
      if (currentToken !== authToken) {
        console.log('Auth token changed, updating WebSocket connection');
        setAuthToken(currentToken);
      }
    };
    
    // Poll for token changes
    const intervalId = setInterval(checkAuthToken, 1000);
    
    // Listen for storage events (cookie changes)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === WALLET_AUTH_COOKIE) {
        checkAuthToken();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [authToken]);
  
  // Connect/disconnect based on auth token
  useEffect(() => {
    if (authToken) {
      // Connect with token
      connect(authToken);
    } else if (status !== WebSocketStatus.DISCONNECTED) {
      // Disconnect if no token
      disconnect();
      setIsAuthenticated(false);
    }
  }, [authToken, connect, disconnect, status]);
  
  // Update authenticated state based on connection status
  useEffect(() => {
    setIsAuthenticated(status === WebSocketStatus.CONNECTED && !!authToken);
  }, [status, authToken]);
  
  return {
    isAuthenticated,
    status,
    disconnect
  };
}
