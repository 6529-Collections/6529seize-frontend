import { useEffect, useRef, useState } from "react";
import { WsMessageType } from "../helpers/Types";

interface UseWaveWebSocketResult {
  socket: WebSocket | null;
  readyState: number;
  /**
   * Manually disconnects the WebSocket and prevents further reconnect attempts.
   */
  disconnect: () => void;
}

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 20;

/**
 * Custom hook to connect to a WebSocket for a given waveId.
 * Automatically reconnects on disconnect, up to MAX_RECONNECT_ATTEMPTS,
 * with a delay of RECONNECT_DELAY ms between attempts.
 * Sends a "hello world" message upon successful connection.
 */
export function useWaveWebSocket(waveId: string): UseWaveWebSocketResult {
  const socketRef = useRef<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  // flag controlling whether reconnection should be attempted
  const shouldReconnectRef = useRef<boolean>(true);

  useEffect(() => {
    // allow reconnection again on (re-)mount or waveId change
    shouldReconnectRef.current = true;
    // determine base URL from environment
    const url =
      process.env.WS_ENDPOINT ??
      process.env.API_ENDPOINT?.replace("https://api", "wss://ws") ??
      "wss://default-fallback-url";

    function connect() {
      const ws = new WebSocket(url);
      socketRef.current = ws;
      setReadyState(ws.readyState);

      ws.onopen = () => {
        setReadyState(ws.readyState);
        reconnectAttemptsRef.current = 0;
        ws.send(
          JSON.stringify({
            type: WsMessageType.SUBSCRIBE_TO_WAVE,
            wave_id: waveId,
          })
        );
      };

      ws.onclose = () => {
        setReadyState(WebSocket.CLOSED);
        // only reconnect if allowed
        if (
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(
            connect,
            RECONNECT_DELAY
          );
        }
      };

      ws.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    }

    connect();

    return () => {
      // disable future reconnects on cleanup
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current != null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [waveId]);

  // manual disconnect function
  const disconnect = () => {
    // disable future reconnects
    shouldReconnectRef.current = false;
    // stop any pending reconnect
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    // close existing socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setReadyState(WebSocket.CLOSED);
  };

  return { socket: socketRef.current, readyState, disconnect };
}
