import { createContext } from "react";
import {
  MessageCallback,
  WebSocketStatus,
  WebSocketConfig,
} from "./WebSocketTypes";
import { WsMessageType } from "../../helpers/Types";

/**
 * Interface for the WebSocket context
 * Defines all methods and state available to consumers
 */
export interface WebSocketContextValue {
  // Connection state
  status: WebSocketStatus;

  // Connection methods
  connect: (token?: string) => void;
  disconnect: () => void;

  // Subscription methods
  subscribe: <T>(
    messageType: WsMessageType,
    callback: MessageCallback<T>
  ) => () => void;

  // Send method for dispatching messages
  send: <T>(messageType: WsMessageType, data: T) => void;

  // Configuration
  config: WebSocketConfig;
}

/**
 * Create the context with undefined default value
 * Will be populated by the provider
 */
export const WebSocketContext = createContext<
  WebSocketContextValue | undefined
>(undefined);

/**
 * Props for the WebSocket provider component
 */
export interface WebSocketProviderProps {
  readonly children: React.ReactNode;
  readonly config: WebSocketConfig;
}
