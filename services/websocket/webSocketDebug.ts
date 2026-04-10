import { publicEnv } from "@/config/env";

const WEBSOCKET_DEBUG_PREFIX = "[WebSocketResumeDebug]";

const isWebSocketDebugEnabled = (): boolean => {
  return publicEnv.NODE_ENV === "development";
};

export const logWebSocketDebug = (
  message: string,
  context?: Record<string, unknown>
): void => {
  if (!isWebSocketDebugEnabled()) {
    return;
  }

  if (context) {
    console.warn(`${WEBSOCKET_DEBUG_PREFIX} ${message}`, context);
    return;
  }

  console.warn(`${WEBSOCKET_DEBUG_PREFIX} ${message}`);
};
