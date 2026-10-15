"use client";

import { useCallback, useEffect, useRef } from "react";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { LoadingState } from "./types";

export function useWaveLoadingState() {
  // Keep track of loading states
  const loadingStates = useRef<Record<string, LoadingState>>({});

  useEffect(() => {
    const reset = () => {
      loadingStates.current = {};
    };
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, reset);
    return () => globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, reset);
  }, []);

  /**
   * Gets or initializes loading state for a wave
   */
  const getLoadingState = useCallback(
    (waveId: string): { state: LoadingState; shouldContinue: boolean } => {
      // Get or initialize loading state
      const loadingState = loadingStates.current[waveId] ?? {
        isLoading: false,
        promise: null,
      };
      loadingStates.current[waveId] = loadingState;

      // If already loading, we should not continue with a new fetch
      const shouldContinue = !(loadingState.isLoading && loadingState.promise);

      return { state: loadingState, shouldContinue };
    },
    []
  );

  /**
   * Sets loading state for a specific wave
   */
  const setLoadingState = useCallback((waveId: string, isLoading: boolean) => {
    if (loadingStates.current[waveId]) {
      loadingStates.current[waveId].isLoading = isLoading;
      if (!isLoading) {
        loadingStates.current[waveId].promise = null;
      }
    }
  }, []);

  /**
   * Sets the promise for a specific wave
   */
  const setPromise = useCallback(
    (waveId: string, promise: Promise<ApiDrop[] | null> | null) => {
      if (loadingStates.current[waveId]) {
        loadingStates.current[waveId].promise = promise;
      }
    },
    []
  );

  /**
   * Forgets the loading state of a wave; its next load starts a fresh one
   */
  const clearLoadingState = useCallback((waveId: string) => {
    delete loadingStates.current[waveId];
  }, []);

  return {
    getLoadingState,
    setLoadingState,
    setPromise,
    clearLoadingState,
    loadingStates,
  };
}
