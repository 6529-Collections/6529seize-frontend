"use client";

import * as Sentry from "@sentry/nextjs";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { useCallback, useEffect, useRef } from "react";

type WaveAbortOwner = "feed" | "pagination";

export type WaveAbortTrigger =
  | "hook_unmounted"
  | "pagination_cancelled"
  | "profile_switched"
  | "request_replaced"
  | "wave_deactivated";

type WaveAbortRequestKind =
  | "background_sync"
  | "initial_visible"
  | "native_initial_backfill"
  | "pagination_around"
  | "pagination_next_page";

const getWaveAbortRequestKind = (
  owner: WaveAbortOwner,
  abortKey: string
): WaveAbortRequestKind => {
  if (abortKey.endsWith("-newest-sync")) {
    return "background_sync";
  }
  if (abortKey.endsWith("-initial-backfill")) {
    return "native_initial_backfill";
  }
  if (abortKey.endsWith("-around")) {
    return "pagination_around";
  }

  return owner === "pagination" ? "pagination_next_page" : "initial_visible";
};

const addWaveAbortBreadcrumb = (
  owner: WaveAbortOwner,
  abortKey: string,
  trigger: WaveAbortTrigger
): void => {
  try {
    Sentry.addBreadcrumb({
      category: "wave.request",
      level: "info",
      message: "wave_request_aborted",
      data: {
        request_kind: getWaveAbortRequestKind(owner, abortKey),
        trigger,
      },
    });
  } catch {
    // Diagnostic telemetry must never interfere with request cancellation.
  }
};

export function useWaveAbortController(owner: WaveAbortOwner) {
  // Track abort controllers for cancellation
  const abortControllers = useRef<Record<string, AbortController>>({});

  /**
   * Cancels an ongoing fetch for a specific wave
   */
  const cancelFetch = useCallback(
    (abortKey: string, trigger: WaveAbortTrigger) => {
      const controller = abortControllers.current[abortKey];
      if (!controller) {
        return;
      }

      addWaveAbortBreadcrumb(owner, abortKey, trigger);
      controller.abort();
      delete abortControllers.current[abortKey];
    },
    [owner]
  );

  /**
   * Sets up and returns an AbortController for the request
   */
  const createController = useCallback(
    (abortKey: string): AbortController => {
      // Cancel any existing request for this request slot.
      cancelFetch(abortKey, "request_replaced");

      // Create a new abort controller
      const controller = new AbortController();
      abortControllers.current[abortKey] = controller;

      return controller;
    },
    [cancelFetch]
  );

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
  const cancelAllFetches = useCallback(
    (trigger: WaveAbortTrigger = "hook_unmounted") => {
      Object.keys(abortControllers.current).forEach((abortKey) => {
        cancelFetch(abortKey, trigger);
      });
    },
    [cancelFetch]
  );

  // Authentication changes invalidate every in-flight private wave request.
  useEffect(() => {
    const handleProfileSwitch = () => cancelAllFetches("profile_switched");
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, handleProfileSwitch);

    return () => {
      globalThis.removeEventListener(
        PROFILE_SWITCHED_EVENT,
        handleProfileSwitch
      );
      cancelAllFetches();
    };
  }, [cancelAllFetches]);

  return {
    cancelFetch,
    createController,
    cleanupController,
    cancelAllFetches,
  };
}
