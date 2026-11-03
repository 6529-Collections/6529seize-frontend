"use client";

import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { useEffect } from "react";
import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { noteWalletChunkFailure } from "@/components/providers/walletChunkRecovery";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import {
  logErrorSecurely,
  sanitizeErrorForUser,
} from "@/utils/error-sanitizer";
import { validateWalletSafely } from "@/utils/wallet-validation.utils";
import { APP_WALLET_CONNECTOR_TYPE } from "@/wagmiConfig/appWalletConnectorType";
import type { createAppWalletConnector as CreateAppWalletConnector } from "@/wagmiConfig/wagmiAppWalletConnector";

/** The long-lived WagmiSetup state that connector injection reads and updates. */
export interface AppWalletConnectorHost {
  /** Addresses whose connectors are installed; survives WagmiSetup remounts. */
  readonly processedWallets: { current: Set<string> };
  readonly requestPassword: (
    address: string,
    addressHashed: string
  ) => Promise<string>;
  readonly showToast: (toast: AppToastInput) => void;
}

type InjectAppWalletConnectorsInput = {
  readonly currentAdapter: WagmiAdapter;
  readonly appWallets: readonly AppWallet[];
  readonly createAppWalletConnector: typeof CreateAppWalletConnector;
  readonly host: AppWalletConnectorHost;
};

// App wallets exist only in the Capacitor app. Their connector (viem account
// signing) loads when there is an app-wallet change to apply.
const loadAppWalletConnector = () =>
  import("@/wagmiConfig/wagmiAppWalletConnector");

function haveAppWalletsChanged(
  processedWallets: AppWalletConnectorHost["processedWallets"],
  appWallets: readonly AppWallet[]
): boolean {
  const currentAddresses = new Set(appWallets.map((w) => w.address));
  return !(
    processedWallets.current.size === currentAddresses.size &&
    Array.from(processedWallets.current).every((addr) =>
      currentAddresses.has(addr)
    )
  );
}

function injectAppWalletConnectors({
  currentAdapter,
  appWallets,
  createAppWalletConnector,
  host,
}: InjectAppWalletConnectorsInput): void {
  const { processedWallets } = host;

  // Checked again after the async import: another WagmiSetup mount may have
  // installed the same wallet set while the connector chunk was loading.
  if (!haveAppWalletsChanged(processedWallets, appWallets)) {
    return;
  }

  const currentAddresses = new Set(appWallets.map((w) => w.address));

  try {
    // Create connectors for current wallets
    const connectors = appWallets.flatMap((wallet) => {
      try {
        validateWalletSafely(wallet);
        const connector = createAppWalletConnector(
          Array.from(currentAdapter.wagmiConfig.chains),
          { appWallet: wallet },
          () => host.requestPassword(wallet.address, wallet.address_hashed)
        );
        const setupConnector =
          currentAdapter.wagmiConfig._internal.connectors.setup(connector);
        return [setupConnector];
      } catch (error) {
        logErrorSecurely(
          "[WagmiSetup] Skipping invalid app-wallet connector",
          error
        );
        return [];
      }
    });

    // Get existing non-app-wallet connectors
    const existingConnectors = currentAdapter.wagmiConfig.connectors.filter(
      (c) => c.id !== APP_WALLET_CONNECTOR_TYPE
    );

    // Update connector state with fail-fast approach
    currentAdapter.wagmiConfig._internal.connectors.setState([
      ...connectors,
      ...existingConnectors,
    ]);

    // Update processed wallets tracking
    processedWallets.current = currentAddresses;
  } catch (error) {
    logErrorSecurely("[WagmiSetup] Connector injection failed", error);
    const userMessage = sanitizeErrorForUser(error);
    host.showToast({
      message: userMessage,
      type: "error",
    });
    // Don't throw here - let the component continue but notify the user
  }
}

/**
 * Installs one wagmi connector per Capacitor app wallet on the wallet-stack
 * adapter, and replaces them when the wallet set changes. The connector
 * module is imported only when an adapter exists and the set has changed.
 */
export function useAppWalletConnectors(
  currentAdapter: WagmiAdapter | null,
  appWallets: readonly AppWallet[],
  host: AppWalletConnectorHost
): void {
  useEffect(() => {
    if (
      currentAdapter === null ||
      !haveAppWalletsChanged(host.processedWallets, appWallets)
    ) {
      return;
    }

    let cancelled = false;
    const injectLoadedConnectors = async () => {
      let connectorModule: Awaited<ReturnType<typeof loadAppWalletConnector>>;
      try {
        connectorModule = await loadAppWalletConnector();
      } catch (error: unknown) {
        noteWalletChunkFailure(error);
        logErrorSecurely(
          "[WagmiSetup] App-wallet connector failed to load",
          error
        );
        return;
      }
      if (cancelled) {
        return;
      }
      injectAppWalletConnectors({
        currentAdapter,
        appWallets,
        createAppWalletConnector: connectorModule.createAppWalletConnector,
        host,
      });
    };
    void injectLoadedConnectors();

    return () => {
      cancelled = true;
    };
  }, [currentAdapter, appWallets, host]);
}
