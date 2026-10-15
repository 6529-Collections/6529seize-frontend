"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Re-read cadence while a freshly confirmed write reaches the read RPC. */
const POST_WRITE_POLL_INTERVAL_MS = 5_000;
/** How long to keep re-reading after a confirmed write before going idle. */
const POST_WRITE_POLL_WINDOW_MS = 30_000;

/**
 * Chain reads are fetched once (and again when the tab is shown); they only
 * poll for a short window after one of this wallet's writes is confirmed, so
 * the screen catches up with the new state and then stops.
 *
 * Pass `refetchInterval` to the read queries and call
 * `startPostWritePolling` when a write is confirmed. A later confirmation
 * restarts the window.
 */
export function usePostWritePolling() {
  const [isPolling, setIsPolling] = useState(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const startPostWritePolling = useCallback(() => {
    clearTimeout(stopTimerRef.current);
    setIsPolling(true);
    stopTimerRef.current = setTimeout(
      () => setIsPolling(false),
      POST_WRITE_POLL_WINDOW_MS
    );
  }, []);

  useEffect(() => () => clearTimeout(stopTimerRef.current), []);

  return {
    refetchInterval: isPolling ? POST_WRITE_POLL_INTERVAL_MS : false,
    startPostWritePolling,
  } as const;
}
