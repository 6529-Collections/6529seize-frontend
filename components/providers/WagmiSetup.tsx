"use client";

import { Connector, WagmiProvider } from "wagmi";
import { useEffect, useState } from "react";
// import {
//   AppWallet,
//   appWalletsEventEmitter,
// } from "../app-wallets/AppWalletsContext";
// import {
//   APP_WALLET_CONNECTOR_TYPE,
//   createAppWalletConnector,
// } from "@/wagmiConfig/wagmiAppWalletConnector";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

import { CW_PROJECT_ID } from "@/constants";
import { mainnet } from "viem/chains";

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();



  // useEffect(() => {
  //   if (!wagmiConfig) return;

  //   const createConnectorForWallet = (
  //     wallet: AppWallet,
  //     requestPassword: (
  //       address: string,
  //       addressHashed: string
  //     ) => Promise<string>
  //   ): Connector | null => {
  //     const connector = createAppWalletConnector(
  //       wagmiConfig.chains,
  //       { appWallet: wallet },
  //       () => requestPassword(wallet.address, wallet.address_hashed)
  //     );
  //     return wagmiConfig.config?._internal.connectors.setup(connector) ?? null;
  //   };

  //   const isConnectorNew = (
  //     connector: Connector,
  //     existingConnectors: Connector[]
  //   ): boolean => {
  //     return !existingConnectors.some(
  //       (existing) => existing.id === connector.id
  //     );
  //   };

  //   const getNewConnectors = (
  //     connectors: Connector[],
  //     existingConnectors: Connector[]
  //   ): Connector[] => {
  //     return connectors.filter((connector) =>
  //       isConnectorNew(connector, existingConnectors)
  //     );
  //   };

  //   const appWalletsEventEmitterHandler = async (wallets: AppWallet[]) => {
  //     const connectors = wallets
  //       .map((wallet) =>
  //         createConnectorForWallet(
  //           wallet,
  //           appWalletPasswordModal.requestPassword
  //         )
  //       )
  //       .filter((connector): connector is Connector => connector !== null);

  //     const existingConnectors =
  //       wagmiConfig.config?.connectors.filter(
  //         (c) => c.id !== APP_WALLET_CONNECTOR_TYPE
  //       ) ?? [];

  //     const newConnectors = getNewConnectors(connectors, existingConnectors);

  //     wagmiConfig.config?._internal.connectors.setState([
  //       ...newConnectors,
  //       ...existingConnectors,
  //     ]);
  //   };

  //   appWalletsEventEmitter.on("update", appWalletsEventEmitterHandler);

  //   return () => {
  //     appWalletsEventEmitter.off("update", appWalletsEventEmitterHandler);
  //   };
  // }, [wagmiConfig]);


  const networks = [mainnet]

  const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId: CW_PROJECT_ID,
    ssr: true
  })

  createAppKit({
    adapters: [wagmiAdapter],
    networks: [mainnet],
    projectId: CW_PROJECT_ID,
    metadata: {
      name: "6529.io",
      description: "6529.io",
      url: process.env.BASE_ENDPOINT!,
      icons: [
        "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
      ],
    },
    features: {
      analytics: true // Optional - defaults to your Cloud configuration
    }
  })

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
