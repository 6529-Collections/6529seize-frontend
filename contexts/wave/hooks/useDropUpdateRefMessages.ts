"use client";

import type { WsDropUpdateRefData } from "@/helpers/Types";
import { isWsDropUpdateRefData, WsMessageType } from "@/helpers/Types";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { useCallback, useEffect, useRef } from "react";
import {
  getIncomingWaveId,
  ProcessIncomingDropType,
  reportBackgroundTaskError,
  type ProcessIncomingDropFn,
} from "./useWaveRealtimeUpdater.helpers";

const RETRY_DELAYS_MS = [250, 750, 1500, 3000] as const;

interface CompactRefSyncState {
  readonly dropId: string;
  readonly waveId: string;
  readonly updateType: WsDropUpdateRefData["update_type"];
  isRunning: boolean;
  needsRerun: boolean;
}

interface RetryWaiter {
  readonly timer: ReturnType<typeof setTimeout>;
  readonly resolve: (shouldContinue: boolean) => void;
}

type AttemptResult =
  | { readonly status: "cancelled" | "succeeded" }
  | { readonly error: unknown; readonly status: "failed" };

const getProcessType = (
  updateType: WsDropUpdateRefData["update_type"]
): ProcessIncomingDropType => {
  switch (updateType) {
    case WsMessageType.DROP_RATING_UPDATE:
      return ProcessIncomingDropType.DROP_RATING_UPDATE;
    case WsMessageType.DROP_REACTION_UPDATE:
      return ProcessIncomingDropType.DROP_REACTION_UPDATE;
    case WsMessageType.DROP_UPDATE:
      return ProcessIncomingDropType.DROP_INSERT;
  }
};

// The canonical refetch always returns the latest drop. Serial number is
// therefore observability metadata, not part of the coalescing identity.
const getStateKey = (data: WsDropUpdateRefData): string =>
  JSON.stringify([data.wave_id, data.drop_id, data.update_type]);

const fetchAndApplyCanonicalDrop = async ({
  isActive,
  processIncomingDrop,
  state,
}: {
  readonly isActive: () => boolean;
  readonly processIncomingDrop: ProcessIncomingDropFn;
  readonly state: CompactRefSyncState;
}): Promise<AttemptResult> => {
  try {
    const canonicalDrop = await fetchDropByIdBatched(state.dropId);
    if (!isActive()) return { status: "cancelled" };
    if (getIncomingWaveId(canonicalDrop) !== state.waveId) {
      throw new Error(
        `Compact drop ref returned an invalid wave for ${state.dropId}`
      );
    }

    await processIncomingDrop(canonicalDrop, getProcessType(state.updateType), {
      preferExistingPollVote: true,
      ...(state.updateType !== WsMessageType.DROP_UPDATE
        ? { canonicalDrop }
        : {}),
    });
    return isActive() ? { status: "succeeded" } : { status: "cancelled" };
  } catch (error) {
    return { error, status: "failed" };
  }
};

const resolveWithRetries = async ({
  isActive,
  processIncomingDrop,
  state,
  stateKey,
  waitBeforeRetry,
}: {
  readonly isActive: () => boolean;
  readonly processIncomingDrop: ProcessIncomingDropFn;
  readonly state: CompactRefSyncState;
  readonly stateKey: string;
  readonly waitBeforeRetry: (
    stateKey: string,
    delayMs: number
  ) => Promise<boolean>;
}): Promise<AttemptResult> => {
  let lastError: unknown = new Error(
    `Compact drop ref did not resolve for ${state.dropId}`
  );

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    if (!isActive()) return { status: "cancelled" };
    if (
      attempt > 0 &&
      !(await waitBeforeRetry(stateKey, RETRY_DELAYS_MS[attempt - 1]!))
    ) {
      return { status: "cancelled" };
    }

    const result = await fetchAndApplyCanonicalDrop({
      isActive,
      processIncomingDrop,
      state,
    });
    if (result.status !== "failed") return result;
    lastError = result.error;
  }

  return { error: lastError, status: "failed" };
};

const useRetryWaiters = (): {
  readonly isActive: () => boolean;
  readonly waitBeforeRetry: (
    stateKey: string,
    delayMs: number
  ) => Promise<boolean>;
} => {
  const waitersRef = useRef<Record<string, RetryWaiter | undefined>>({});
  const isMountedRef = useRef(true);

  const isActive = useCallback(() => isMountedRef.current, []);
  const waitBeforeRetry = useCallback(
    (stateKey: string, delayMs: number): Promise<boolean> =>
      new Promise((resolve) => {
        const previousWaiter = waitersRef.current[stateKey];
        if (previousWaiter) {
          clearTimeout(previousWaiter.timer);
          previousWaiter.resolve(false);
        }
        const timer = setTimeout(() => {
          delete waitersRef.current[stateKey];
          resolve(isMountedRef.current);
        }, delayMs);
        waitersRef.current[stateKey] = { resolve, timer };
      }),
    []
  );

  useEffect(() => {
    const waiters = waitersRef.current;
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      for (const waiter of Object.values(waiters)) {
        if (!waiter) continue;
        clearTimeout(waiter.timer);
        waiter.resolve(false);
      }
    };
  }, []);

  return { isActive, waitBeforeRetry };
};

export const useDropUpdateRefMessages = ({
  processIncomingDrop,
}: {
  readonly processIncomingDrop: ProcessIncomingDropFn;
}): ((messageData: unknown) => void) => {
  const statesRef = useRef<Record<string, CompactRefSyncState>>({});
  const { isActive, waitBeforeRetry } = useRetryWaiters();

  const runSync = useCallback(
    async (stateKey: string, state: CompactRefSyncState): Promise<void> => {
      while (isActive()) {
        const result = await resolveWithRetries({
          isActive,
          processIncomingDrop,
          state,
          stateKey,
          waitBeforeRetry,
        });
        if (result.status === "cancelled") return;
        if (result.status === "failed" && !state.needsRerun) {
          reportBackgroundTaskError(
            `Failed to resolve compact drop ${state.dropId} after retries:`,
            result.error
          );
          return;
        }
        if (!state.needsRerun) return;
        state.needsRerun = false;
      }
    },
    [isActive, processIncomingDrop, waitBeforeRetry]
  );

  const startSync = useCallback(
    function startCompactRefSync(
      stateKey: string,
      state: CompactRefSyncState
    ): void {
      state.isRunning = true;
      const execute = async (): Promise<void> => {
        try {
          await runSync(stateKey, state);
        } catch (error) {
          reportBackgroundTaskError(
            "Failed to resolve compact drop update:",
            error
          );
        } finally {
          const currentState = statesRef.current[stateKey];
          if (currentState !== state) return;
          currentState.isRunning = false;
          if (currentState.needsRerun && isActive()) {
            currentState.needsRerun = false;
            startCompactRefSync(stateKey, currentState);
          } else {
            delete statesRef.current[stateKey];
          }
        }
      };
      void execute();
    },
    [isActive, runSync]
  );

  return useCallback(
    (messageData: unknown) => {
      if (!isWsDropUpdateRefData(messageData)) return;
      const stateKey = getStateKey(messageData);
      const state =
        statesRef.current[stateKey] ??
        (statesRef.current[stateKey] = {
          dropId: messageData.drop_id,
          updateType: messageData.update_type,
          waveId: messageData.wave_id,
          isRunning: false,
          needsRerun: false,
        });
      if (state.isRunning) {
        state.needsRerun = true;
      } else {
        startSync(stateKey, state);
      }
    },
    [startSync]
  );
};
