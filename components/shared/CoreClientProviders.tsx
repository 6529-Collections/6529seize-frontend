"use client";

import { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactQueryWrapper from '../react-query-wrapper/ReactQueryWrapper';
import { WagmiProvider, type Connector } from 'wagmi';
import type { Chain } from 'wagmi';
import { Capacitor } from '@capacitor/core';
import useCapacitor from '../../hooks/useCapacitor';
import { getChains, wagmiMetadata } from '../../utils/wagmiHelpers';
import { wagmiConfigWeb } from '../../wagmiConfig/wagmiConfigWeb';
import { wagmiConfigCapacitor } from '../../wagmiConfig/wagmiConfigCapacitor';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { CW_PROJECT_ID } from '../../constants';

// Imports for App Wallets Event Handler (Subtask 1.1)
import { appWalletsEventEmitter, type AppWallet } from '../app-wallets/AppWalletsContext';
import { useAppWalletPasswordModal } from '../../hooks/useAppWalletPasswordModal';
import { createAppWalletConnector, APP_WALLET_CONNECTOR_TYPE } from '../../wagmiConfig/wagmiAppWalletConnector';

interface CoreClientProvidersProps {
  readonly children: ReactNode;
}

const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

export default function CoreClientProviders({ children }: CoreClientProvidersProps) {
  const [queryClient] = useState(() => queryClientInstance);
  const capacitorHook = useCapacitor();
  const [currentWagmiConfig, setCurrentWagmiConfig] = useState<ReturnType<typeof wagmiConfigWeb> | ReturnType<typeof wagmiConfigCapacitor> | null>(null);
  const [isWeb3ModalCreated, setIsWeb3ModalCreated] = useState(false);

  // App Wallet Password Modal hook (Subtask 1.1)
  const appWalletPasswordModal = useAppWalletPasswordModal();

  useEffect(() => {
    const chains = getChains() as [Chain, ...Chain[]];
    const config = capacitorHook.isCapacitor
      ? wagmiConfigCapacitor(chains, wagmiMetadata)
      : wagmiConfigWeb(chains, wagmiMetadata);
    setCurrentWagmiConfig(config);
  }, [capacitorHook.isCapacitor]);

  useEffect(() => {
    if (currentWagmiConfig && !isWeb3ModalCreated) {
      createWeb3Modal({
        wagmiConfig: currentWagmiConfig,
        projectId: CW_PROJECT_ID,
        enableAnalytics: true,
        themeMode: "dark",
      });
      setIsWeb3ModalCreated(true);
    }
  }, [currentWagmiConfig, isWeb3ModalCreated]);

  // useEffect for appWalletsEventEmitter (Subtask 1.2)
  useEffect(() => {
    const createConnectorForAppWallet = (
      wallet: AppWallet,
      requestPasswordFn: (
        address: string,
        addressHashed: string
      ) => Promise<string>
    ): Connector | null => {
      try {
        return createAppWalletConnector({ appWallet: wallet }, () =>
          requestPasswordFn(wallet.address, wallet.address_hashed)
        ) as Connector;
      } catch (error) {
        console.error("Error creating app wallet connector:", error);
        return null;
      }
    };

    const appWalletsUpdateHandler = async (wallets: AppWallet[]) => {
      if (!currentWagmiConfig) {
        console.warn("Wagmi config not available for app wallet update.");
        return;
      }

      const newAppWalletConnectors = wallets
        .map((wallet) =>
          createConnectorForAppWallet(
            wallet,
            appWalletPasswordModal.requestPassword
          )
        )
        .filter((connector): connector is Connector => connector !== null);

      const otherConnectors = currentWagmiConfig.connectors.filter(
        (c) => c.type !== APP_WALLET_CONNECTOR_TYPE
      );
      
      const allConnectors = [...otherConnectors, ...newAppWalletConnectors];
      
      // Ensure no duplicate connectors by ID (address for app wallets)
      const uniqueConnectors = allConnectors.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [] as Connector[]);


      setCurrentWagmiConfig(prevConfig => {
        if (!prevConfig) return null;
        // Ensure the connectors array is new to trigger re-render if necessary
        if (JSON.stringify(prevConfig.connectors.map(c => c.id).sort()) === JSON.stringify(uniqueConnectors.map(c => c.id).sort())) {
          return prevConfig; // No actual change in connectors
        }
        return {
          ...prevConfig,
          connectors: uniqueConnectors as readonly Connector[],
        };
      });
    };

    appWalletsEventEmitter.on("update", appWalletsUpdateHandler);

    return () => {
      appWalletsEventEmitter.off("update", appWalletsUpdateHandler);
    };
  }, [currentWagmiConfig, appWalletPasswordModal.requestPassword]);

  useEffect(() => {
    if (capacitorHook.isCapacitor) {
      document.body.classList.add("capacitor-native");
    } else {
      document.body.classList.remove("capacitor-native");
    }
    return () => {
      document.body.classList.remove("capacitor-native");
    };
  }, [capacitorHook.isCapacitor]);

  if (!currentWagmiConfig || !isWeb3ModalCreated) {
    return null;
  }

  return (
    <WagmiProvider config={currentWagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryWrapper>
          {children}
        </ReactQueryWrapper>
      </QueryClientProvider>
      {/* Render App Wallet Password Modal JSX (Subtask 1.1) */}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
} 
