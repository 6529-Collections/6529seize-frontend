import { useCallback } from "react";
import { getAddress, isAddress } from "viem";
import { SecurityEventType } from "@/types/security";
import {
  createConnectionEventContext,
  logError,
  logSecurityEvent,
} from "@/utils/security-logger";
import {
  createWalletError,
  WalletDisconnectionError,
} from "./seizeConnectErrors";
import { CONNECT_AFTER_DISCONNECT_DELAY_MS } from "./seizeConnectWalletState";
import type { CapacitorConnectDialogView } from "./CapacitorConnectDialog";

export async function openUserConnectionSurfaceForRuntime({
  source,
  isCapacitor,
  isSigningOutAll,
  openWebConnection,
  setCapacitorView,
}: {
  readonly source: string;
  readonly isCapacitor: boolean;
  readonly isSigningOutAll: boolean;
  readonly openWebConnection: (source: string) => Promise<void>;
  readonly setCapacitorView: (view: CapacitorConnectDialogView) => void;
}): Promise<void> {
  if (!isCapacitor) {
    await openWebConnection(source);
    return;
  }

  if (isSigningOutAll) {
    return;
  }

  logSecurityEvent(
    SecurityEventType.WALLET_CONNECTION_ATTEMPT,
    createConnectionEventContext(source)
  );
  setCapacitorView("options");
}

export async function openFreshUserConnection({
  address,
  isConnected,
  isCapacitor,
  isActiveAppWalletConnector,
  isSigningOutAll,
  disconnect,
  getSignOutAllGeneration,
  hasSignOutAllGenerationChanged,
  isMounted,
  openUserConnectionSurface,
}: {
  readonly address?: string | undefined;
  readonly isConnected: boolean;
  readonly isCapacitor: boolean;
  readonly isActiveAppWalletConnector: boolean;
  readonly isSigningOutAll: boolean;
  readonly disconnect: () => Promise<unknown>;
  readonly getSignOutAllGeneration: () => number;
  readonly hasSignOutAllGenerationChanged: (generation: number) => boolean;
  readonly isMounted: () => boolean;
  readonly openUserConnectionSurface: (source: string) => Promise<void>;
}): Promise<void> {
  if (isSigningOutAll) {
    return;
  }

  if (isCapacitor) {
    await openUserConnectionSurface("seizeConnectFresh");
    return;
  }

  const signOutGeneration = getSignOutAllGeneration();
  const liveConnectedWallet =
    address && isConnected && isAddress(address) ? getAddress(address) : null;

  if (!liveConnectedWallet || isActiveAppWalletConnector) {
    await openUserConnectionSurface("seizeConnectFresh");
    return;
  }

  try {
    await disconnect();
  } catch (error: unknown) {
    const walletError = createWalletError(
      WalletDisconnectionError,
      "disconnect wallet before opening connection modal",
      error
    );
    logError("seizeConnectFresh", walletError);
    throw walletError;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, CONNECT_AFTER_DISCONNECT_DELAY_MS);
  });

  if (!isMounted() || hasSignOutAllGenerationChanged(signOutGeneration)) {
    return;
  }

  await openUserConnectionSurface("seizeConnectFresh");
}

export function useDisconnectExternalWalletBeforeSelection({
  address,
  isConnected,
  isActiveAppWalletConnector,
  disconnect,
}: {
  readonly address?: string | undefined;
  readonly isConnected: boolean;
  readonly isActiveAppWalletConnector: boolean;
  readonly disconnect: () => Promise<unknown>;
}): () => Promise<void> {
  return useCallback(async () => {
    if (
      !address ||
      !isConnected ||
      !isAddress(address) ||
      isActiveAppWalletConnector
    ) {
      return;
    }

    await disconnect();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, CONNECT_AFTER_DISCONNECT_DELAY_MS);
    });
  }, [address, disconnect, isActiveAppWalletConnector, isConnected]);
}
