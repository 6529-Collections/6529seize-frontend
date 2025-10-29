/**
 * WebSocket Module
 *
 * Provides a type-safe WebSocket connection system with:
 * - Connection management and reconnection
 * - Message filtering by type
 * - Authentication integration
 * - Typed message subscriptions
 */

import { publicEnv } from "@/config/env";

// Types
export * from "./WebSocketTypes";

// Context and Provider
// Hooks
export { useWebSocket } from "./useWebSocket";
// Default configuration
export const DEFAULT_WEBSOCKET_CONFIG = {
  url:
    publicEnv.WS_ENDPOINT ??
    publicEnv.API_ENDPOINT?.replace("https://api", "wss://ws") ??
    "wss://default-fallback-url",
  reconnectDelay: 2000,
  maxReconnectAttempts: 20,
};

/**
 * Example usage:
 *
 * 1. Set up the provider at the top level of your app:
 *
 * ```tsx
 * import { WebSocketProvider, DEFAULT_WEBSOCKET_CONFIG } from 'services/websocket';
 *
 * function App() {
 *   return (
 *     <WebSocketProvider config={DEFAULT_WEBSOCKET_CONFIG}>
 *       <YourApp />
 *     </WebSocketProvider>
 *   );
 * }
 * ```
 *
 * 2. Use the hooks in your components:
 *
 * ```tsx
 * import { useWebSocketMessage } from 'services/websocket';
 *
 * function UserNotifications() {
 *   const { data, isConnected } = useWebSocketMessage<UserNotification>('user-notification');
 *
 *   if (!isConnected) {
 *     return <div>Connecting...</div>;
 *   }
 *
 *   // Render notifications from data
 *   return (
 *     <div>
 *       {data && <NotificationBadge notification={data} />}
 *     </div>
 *   );
 * }
 * ```
 */
