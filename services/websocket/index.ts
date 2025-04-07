/**
 * WebSocket Module
 * 
 * Provides a type-safe WebSocket connection system with:
 * - Connection management and reconnection
 * - Message filtering by type
 * - Authentication integration
 * - Typed message subscriptions
 */

// Types
export * from './WebSocketTypes';

// Context and Provider
export { WebSocketContext, type WebSocketProviderProps } from './WebSocketContext';
export { WebSocketProvider } from './WebSocketProvider';

// Hooks
export { useWebSocket, useOptionalWebSocket } from './useWebSocket';
export { useWebSocketMessage, useWebSocketMessages } from './useWebSocketMessage';
export { useWebSocketAuth } from './useWebSocketAuth';

// Default configuration
export const DEFAULT_WEBSOCKET_CONFIG = {
  url: (process.env.API_ENDPOINT?.replace('https://api', 'wss://ws')) || 'wss://default-fallback-url',
  reconnectDelay: 2000,
  maxReconnectAttempts: 20
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
 * 
 * 3. For multiple message types:
 * 
 * ```tsx
 * import { useWebSocketMessages } from 'services/websocket';
 * 
 * interface MessageTypes {
 *   'price-update': PriceData;
 *   'user-activity': ActivityData;
 * }
 * 
 * function Dashboard() {
 *   const { dataMap } = useWebSocketMessages<MessageTypes>(['price-update', 'user-activity']);
 *   
 *   return (
 *     <div>
 *       {dataMap['price-update'] && <PriceChart data={dataMap['price-update']} />}
 *       {dataMap['user-activity'] && <ActivityFeed data={dataMap['user-activity']} />}
 *     </div>
 *   );
 * }
 * ```
 */
