import { isDesktopShell } from "@/helpers/desktop-shell";
import { openDesktopConnectDialog } from "@/services/desktop/desktopConnectDialog";
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

type ConnectModalView =
  | "Connect"
  | "AllWallets"
  | "ConnectingWalletConnectBasic";

/**
 * The wallet modal's first view. 6529 Desktop has no browser extensions, so
 * its WalletConnect choice opens straight on the WalletConnect QR code ("Scan
 * this QR Code with your phone") instead of a wallet list whose entries look
 * like browser extensions. Elsewhere the modal opens as before.
 */
export const defaultConnectModalView = (): ConnectModalView =>
  isDesktopShell() ? "ConnectingWalletConnectBasic" : "Connect";

/**
 * The one way a connect entry point opens a wallet connection. In 6529
 * Desktop every entry point shows the desktop connect choice first
 * (a browser wallet through the browser connector, or WalletConnect);
 * elsewhere `openDefault` keeps that entry point's existing surface.
 * `openWebConnection` opens the wallet modal itself, for the WalletConnect
 * choice.
 */
async function openConnectEntryPoint({
  source,
  isSigningOutAll,
  openWebConnection,
  openDefault,
}: {
  readonly source: string;
  readonly isSigningOutAll: boolean;
  readonly openWebConnection: (source: string) => Promise<void>;
  readonly openDefault: (source: string) => Promise<void>;
}): Promise<void> {
  // Like the Capacitor options, this resolves once the choice is shown.
  if (!isSigningOutAll && isDesktopShell()) {
    logSecurityEvent(
      SecurityEventType.WALLET_CONNECTION_ATTEMPT,
      createConnectionEventContext(source)
    );
    openDesktopConnectDialog(() => openWebConnection(source));
    return;
  }
  await openDefault(source);
}

export function openUserConnectionSurfaceForRuntime({
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
  return openConnectEntryPoint({
    source,
    isSigningOutAll,
    openWebConnection,
    openDefault: (entrySource) =>
      openWebOrCapacitorConnection({
        source: entrySource,
        isCapacitor,
        isSigningOutAll,
        openWebConnection,
        setCapacitorView,
      }),
  });
}

async function openWebOrCapacitorConnection({
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

/**
 * `seizeConnect`: opens the wallet modal directly on the web and in the
 * native app, as before; in 6529 Desktop it shows the desktop connect choice
 * like every other entry point.
 */
export function useSeizeConnect(
  isSigningOutAllRef: { readonly current: boolean },
  openWebConnection: (source: string) => Promise<void>
): () => void {
  return useCallback((): void => {
    openConnectEntryPoint({
      source: "seizeConnect",
      isSigningOutAll: isSigningOutAllRef.current,
      openWebConnection,
      openDefault: openWebConnection,
    }).then(undefined, () => undefined);
  }, [isSigningOutAllRef, openWebConnection]);
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
