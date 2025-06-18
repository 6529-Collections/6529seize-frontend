"use client";

import { Connector, WagmiProvider } from "wagmi";
import { useEffect } from "react";
import {
  AppWallet,
  appWalletsEventEmitter,
} from "../app-wallets/AppWalletsContext";
import {
  APP_WALLET_CONNECTOR_TYPE,
  createAppWalletConnector,
} from "@/wagmiConfig/wagmiAppWalletConnector";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { WagmiConfig } from "@/wagmiConfig/wagmiConfig";

export default function WagmiSetup({
  wagmiConfig,
  children,
}: {
  readonly wagmiConfig: WagmiConfig;
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();

  useEffect(() => {
    const createConnectorForWallet = (
      wallet: AppWallet,
      requestPassword: (
        address: string,
        addressHashed: string
      ) => Promise<string>
    ): Connector | null => {
      const connector = createAppWalletConnector(
        wagmiConfig.chains,
        { appWallet: wallet },
        () => requestPassword(wallet.address, wallet.address_hashed)
      );
      return wagmiConfig.config?._internal.connectors.setup(connector) ?? null;
    };

    const isConnectorNew = (
      connector: Connector,
      existingConnectors: Connector[]
    ): boolean => {
      return !existingConnectors.some(
        (existing) => existing.id === connector.id
      );
    };

    const getNewConnectors = (
      connectors: Connector[],
      existingConnectors: Connector[]
    ): Connector[] => {
      return connectors.filter((connector) =>
        isConnectorNew(connector, existingConnectors)
      );
    };

    const appWalletsEventEmitterHandler = async (wallets: AppWallet[]) => {
      const connectors = wallets
        .map((wallet) =>
          createConnectorForWallet(
            wallet,
            appWalletPasswordModal.requestPassword
          )
        )
        .filter((connector): connector is Connector => connector !== null);

      const existingConnectors =
        wagmiConfig.config?.connectors.filter(
          (c) => c.id !== APP_WALLET_CONNECTOR_TYPE
        ) ?? [];

      const newConnectors = getNewConnectors(connectors, existingConnectors);

      wagmiConfig.config?._internal.connectors.setState([
        ...newConnectors,
        ...existingConnectors,
      ]);
    };

    appWalletsEventEmitter.on("update", appWalletsEventEmitterHandler);

    return () => {
      appWalletsEventEmitter.off("update", appWalletsEventEmitterHandler);
    };
  }, []);

  return (
    <WagmiProvider config={wagmiConfig.config}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
