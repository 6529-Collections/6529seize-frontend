import { useCallback, useRef, type RefObject } from "react";
import {
  hasWalletChunkLoadFailed,
  reloadToRetryWalletChunks,
} from "@/components/providers/walletChunkRecovery";
import { SecurityEventType } from "@/types/security";
import {
  createConnectionEventContext,
  logError,
  logSecurityEvent,
} from "@/utils/security-logger";
import type { AppKitModalBridgeStore } from "./AppKitModalBridge";
import { defaultConnectModalView } from "./capacitorConnectController";
import { WalletConnectionError } from "./seizeConnectErrors";

const APPKIT_MODAL_TRANSITION_TIMEOUT_MS = 30_000;

async function waitForModalTransition(
  transition: Promise<void>,
  signal: AbortSignal | undefined
): Promise<"finished" | "aborted" | "timed-out"> {
  if (signal?.aborted) return "aborted";
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  const interrupted = new Promise<"aborted" | "timed-out">((resolve) => {
    abort = () => resolve("aborted");
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(
      () => resolve("timed-out"),
      APPKIT_MODAL_TRANSITION_TIMEOUT_MS
    );
  });
  try {
    return await Promise.race([
      transition.then(() => "finished" as const),
      interrupted,
    ]);
  } finally {
    clearTimeout(timer);
    if (abort) signal?.removeEventListener("abort", abort);
  }
}

interface OpenConnectModalOptions {
  readonly appKitModalBridgeStore: AppKitModalBridgeStore;
  readonly clearConnectIntentHandoffTimeout: () => void;
  readonly clearConnectIntentWaitingForAppKit: () => void;
  readonly getSignOutAllGeneration: () => number;
  readonly hasSignOutAllGenerationChanged: (generation: number) => boolean;
  readonly isAppKitReady: boolean;
  readonly isMountedRef: RefObject<boolean>;
  readonly isSigningOutAllRef: RefObject<boolean>;
  readonly scheduleConnectIntentHandoffFallback: () => void;
  readonly setIsConnectIntentWaitingForAppKit: (waiting: boolean) => void;
  readonly waitForAppKitReady: () => Promise<unknown>;
}

export function useOpenConnectModal({
  appKitModalBridgeStore,
  clearConnectIntentHandoffTimeout,
  clearConnectIntentWaitingForAppKit,
  getSignOutAllGeneration,
  hasSignOutAllGenerationChanged,
  isAppKitReady,
  isMountedRef,
  isSigningOutAllRef,
  scheduleConnectIntentHandoffFallback,
  setIsConnectIntentWaitingForAppKit,
  waitForAppKitReady,
}: OpenConnectModalOptions) {
  const latestIntent = useRef<symbol | null>(null);
  const modalTransition = useRef<Promise<void> | null>(null);

  return useCallback(
    async (
      source: string,
      view = defaultConnectModalView(),
      signal?: AbortSignal
    ): Promise<void> => {
      if (isSigningOutAllRef.current || signal?.aborted) return;
      const intent = Symbol("connect modal");
      latestIntent.current = intent;
      const signOutGeneration = getSignOutAllGeneration();
      let timedOut = false;
      const ownsModal = () =>
        latestIntent.current === intent && isMountedRef.current;
      const shouldStop = () => {
        if (!ownsModal()) return true;
        if (
          signal?.aborted ||
          timedOut ||
          hasSignOutAllGenerationChanged(signOutGeneration)
        ) {
          clearConnectIntentWaitingForAppKit();
          return true;
        }
        return false;
      };
      const waitForTransition = async (transition: Promise<void> | null) => {
        if (!transition) return true;
        const outcome = await waitForModalTransition(transition, signal);
        if (shouldStop()) return false;
        if (outcome === "timed-out") {
          // The SDK open cannot be cancelled. A reload gives the next
          // connection a fresh SDK without racing the stuck modal.
          timedOut = true;
          reloadToRetryWalletChunks();
          throw new Error("Timed out opening the wallet connection modal");
        }
        return outcome === "finished";
      };

      try {
        clearConnectIntentHandoffTimeout();
        setIsConnectIntentWaitingForAppKit(true);
        // A failed wallet chunk requires reloading even if the stack looks ready.
        if (
          (!isAppKitReady || hasWalletChunkLoadFailed()) &&
          !(await waitForTransition(waitForAppKitReady().then(() => undefined)))
        )
          return;
        if (shouldStop()) return;
        const openAppKit = await appKitModalBridgeStore.waitForOpen();
        if (
          !(await waitForTransition(modalTransition.current)) ||
          shouldStop()
        ) {
          return;
        }

        // Opening and cleanup share one transition. A newer intent waits
        // while this one closes the modal it opened after being superseded.
        const completion = Promise.withResolvers<boolean>();
        const opening = (async () => {
          await openAppKit({ view });
        })();
        const transition = opening.finally(async () => {
          if (!(await completion.promise) && isMountedRef.current) {
            await appKitModalBridgeStore.close();
          }
        });
        const settled = transition
          .catch(() => undefined)
          .finally(() => {
            if (modalTransition.current === settled)
              modalTransition.current = null;
          });
        modalTransition.current = settled;
        try {
          if (!(await waitForTransition(opening))) return;
          if (shouldStop()) return;
          logSecurityEvent(
            SecurityEventType.WALLET_MODAL_OPENED,
            createConnectionEventContext(source)
          );
          scheduleConnectIntentHandoffFallback();
          completion.resolve(true);
        } finally {
          completion.resolve(false);
        }
      } catch (error) {
        if (latestIntent.current !== intent) return;
        if (signal?.aborted) {
          if (ownsModal()) clearConnectIntentWaitingForAppKit();
          return;
        }
        clearConnectIntentWaitingForAppKit();
        const connectionError = new WalletConnectionError(
          "Failed to open wallet connection modal",
          error
        );
        logError(source, connectionError);
        throw connectionError;
      }
    },
    [
      appKitModalBridgeStore,
      clearConnectIntentHandoffTimeout,
      clearConnectIntentWaitingForAppKit,
      getSignOutAllGeneration,
      hasSignOutAllGenerationChanged,
      isAppKitReady,
      isMountedRef,
      isSigningOutAllRef,
      scheduleConnectIntentHandoffFallback,
      setIsConnectIntentWaitingForAppKit,
      waitForAppKitReady,
    ]
  );
}
