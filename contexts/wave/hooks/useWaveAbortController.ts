import { useCallback, useRef, useEffect } from "react";

export function useWaveAbortController() {
  // Track abort controllers for cancellation
  const abortControllers = useRef<Record<string, AbortController>>({});

  /**
   * Cancels an ongoing fetch for a specific wave
   */
  const cancelFetch = useCallback((waveId: string) => {
    if (abortControllers.current[waveId]) {
      abortControllers.current[waveId].abort();
      delete abortControllers.current[waveId];
    }
  }, []);

  /**
   * Sets up and returns an AbortController for the request
   */
  const createController = useCallback((waveId: string): AbortController => {
    // Cancel any existing request for this wave
    cancelFetch(waveId);

    // Create a new abort controller
    const controller = new AbortController();
    abortControllers.current[waveId] = controller;
    
    return controller;
  }, [cancelFetch]);

  /**
   * Cleanup function to be called after fetch completes
   */
  const cleanupController = useCallback(
    (waveId: string, controller: AbortController) => {
      // Clean up abort controller reference
      if (abortControllers.current[waveId] === controller) {
        delete abortControllers.current[waveId];
      }
    },
    []
  );

  /**
   * Cancels all ongoing fetches
   */
  const cancelAllFetches = useCallback(() => {
    Object.keys(abortControllers.current).forEach((waveId) => {
      cancelFetch(waveId);
    });
  }, [cancelFetch]);

  // Clean up all pending requests when the hook unmounts
  useEffect(() => {
    return cancelAllFetches;
  }, [cancelAllFetches]);

  return {
    cancelFetch,
    createController,
    cleanupController,
    cancelAllFetches,
  };
}