import { useCallback, useRef, type RefObject } from "react";
import { hasWalletChunkLoadFailed } from "@/components/providers/walletChunkRecovery";
import { SecurityEventType } from "@/types/security";
import {
  createConnectionEventContext,
  logError,
  logSecurityEvent,
} from "@/utils/security-logger";
import type { AppKitModalBridgeStore } from "./AppKitModalBridge";
import { defaultConnectModalView } from "./capacitorConnectController";
import { WalletConnectionError } from "./seizeConnectErrors";

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
      const ownsModal = () =>
        latestIntent.current === intent && isMountedRef.current;
      const shouldStop = () => {
        if (!ownsModal()) return true;
        if (
          signal?.aborted ||
          hasSignOutAllGenerationChanged(signOutGeneration)
        ) {
          clearConnectIntentWaitingForAppKit();
          return true;
        }
        return false;
      };

      try {
        clearConnectIntentHandoffTimeout();
        setIsConnectIntentWaitingForAppKit(true);
        // A failed wallet chunk requires reloading even if the stack looks ready.
        if (!isAppKitReady || hasWalletChunkLoadFailed()) {
          await waitForAppKitReady();
        }
        if (shouldStop()) return;
        const openAppKit = await appKitModalBridgeStore.waitForOpen();
        await modalTransition.current;
        if (shouldStop()) return;

        // Opening and cleanup share one transition. A newer intent waits
        // while this one closes the modal it opened after being superseded.
        const transition = (async () => {
          try {
            await openAppKit({ view });
          } finally {
            if (shouldStop() && isMountedRef.current) {
              await appKitModalBridgeStore.close();
            }
          }
        })();
        modalTransition.current = transition.catch(() => undefined);
        await transition;
        if (shouldStop()) return;

        logSecurityEvent(
          SecurityEventType.WALLET_MODAL_OPENED,
          createConnectionEventContext(source)
        );
        scheduleConnectIntentHandoffFallback();
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
