"use client";

import { createContext } from "react";
import type {
  SubscribeFn,
  WebSocketConnectionInfo,
  WebSocketStatus,
  WebSocketConfig,
} from "./WebSocketTypes";
import type { WsMessageType } from "@/helpers/Types";

/**
 * Interface for the WebSocket context
 * Defines all methods and state available to consumers
 */
export interface WebSocketContextValue {
  // Connection state
  status: WebSocketStatus;
  /** The current authenticated session; null before the first one. */
  connection: WebSocketConnectionInfo | null;

  // Connection methods
  connect: (token?: string) => void;
  disconnect: () => void;
  /**
   * Sends a rotated token for the same identity on the open socket. Any
   * other case (another identity, no open session) replaces the socket.
   */
  reauthenticate: (token: string) => void;
  /**
   * Keeps an open session whose socket delivered a frame since `since`, and
   * replaces it otherwise.
   */
  ensureLive: (since: number) => void;

  // Subscription methods
  subscribe: SubscribeFn;

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
