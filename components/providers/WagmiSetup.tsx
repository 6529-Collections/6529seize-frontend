"use client";

import { Connector, WagmiProvider } from "wagmi";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { wagmiConfigCapacitor } from "@/wagmiConfig/wagmiConfigCapacitor";
import { wagmiConfigWeb } from "@/wagmiConfig/wagmiConfigWeb";
import { DELEGATION_CONTRACT, SUBSCRIPTIONS_CHAIN } from "@/constants";
import { MANIFOLD_NETWORK } from "@/hooks/useManifoldClaim";
import { Chain } from "viem";
import { mainnet, sepolia, goerli } from "viem/chains";
import { NEXTGEN_CHAIN_ID } from "../nextGen/nextgen_contracts";
import {
  AppWallet,
  appWalletsEventEmitter,
} from "../app-wallets/AppWalletsContext";
import {
  APP_WALLET_CONNECTOR_TYPE,
  createAppWalletConnector,
} from "@/wagmiConfig/wagmiAppWalletConnector";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { initWeb3Modal } from "./web3ModalSetup";

export function getChains() {
  const chains: Chain[] = [mainnet];
  if (
    DELEGATION_CONTRACT.chain_id === sepolia.id ||
    (NEXTGEN_CHAIN_ID as number) === sepolia.id ||
    SUBSCRIPTIONS_CHAIN.id.toString() === sepolia.id.toString() ||
    MANIFOLD_NETWORK.id.toString() === sepolia.id.toString()
  ) {
    chains.push(sepolia);
  }
  if (
    DELEGATION_CONTRACT.chain_id === goerli.id ||
    (NEXTGEN_CHAIN_ID as number) === goerli.id
  ) {
    chains.push(goerli);
  }
  return chains;
}

const isCapacitor = Capacitor.isNativePlatform();
const CONTRACT_CHAINS = getChains();
const chains = [...CONTRACT_CHAINS] as [Chain, ...Chain[]];

const wagmiMetadata = {
  name: "6529.io",
  description: "6529.io",
  url: process.env.BASE_ENDPOINT!,
  icons: [
    "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
  ],
};

const wagmiConfig = isCapacitor
  ? wagmiConfigCapacitor(chains, wagmiMetadata)
  : wagmiConfigWeb(chains, wagmiMetadata);

initWeb3Modal(wagmiConfig);

export default function WagmiSetup({
  children,
}: {
  children: React.ReactNode;
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
        chains,
        { appWallet: wallet },
        () => requestPassword(wallet.address, wallet.address_hashed)
      );
      return wagmiConfig?._internal.connectors.setup(connector) ?? null;
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
        wagmiConfig?.connectors.filter(
          (c) => c.id !== APP_WALLET_CONNECTOR_TYPE
        ) ?? [];

      const newConnectors = getNewConnectors(connectors, existingConnectors);

      wagmiConfig?._internal.connectors.setState([
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
    <WagmiProvider config={wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
