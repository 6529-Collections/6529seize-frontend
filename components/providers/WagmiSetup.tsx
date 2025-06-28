"use client";

import { Connector, WagmiProvider } from "wagmi";
import { useEffect, useState } from "react";
import {
  AppWallet,
  appWalletsEventEmitter,
} from "../app-wallets/AppWalletsContext";
import {
  APP_WALLET_CONNECTOR_TYPE,
  createAppWalletConnector,
} from "@/wagmiConfig/wagmiAppWalletConnector";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { getWagmiConfig, WagmiConfig } from "@/wagmiConfig/wagmiConfig";
import { initWeb3Modal } from "./web3ModalSetup";

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const [wagmiConfig, setWagmiConfig] = useState<WagmiConfig>();
  useEffect(() => {
    const wagmiConfig = getWagmiConfig();
    initWeb3Modal(wagmiConfig.config);
    setWagmiConfig(wagmiConfig);
  }, []);

  useEffect(() => {
    if (!wagmiConfig) return;

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
  }, [wagmiConfig]);

  if (!wagmiConfig) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig.config}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
