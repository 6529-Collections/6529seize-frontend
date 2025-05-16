"use client";

import { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactQueryWrapper from '../react-query-wrapper/ReactQueryWrapper';

// Wagmi and Capacitor specific imports
import { WagmiProvider, type Chain } from 'wagmi';
import { Capacitor } from '@capacitor/core';
import useCapacitor from '../../hooks/useCapacitor';
import { getChains, wagmiMetadata } from '../../utils/wagmiHelpers';
import { wagmiConfigWeb } from '../../wagmiConfig/wagmiConfigWeb';
import { wagmiConfigCapacitor } from '../../wagmiConfig/wagmiConfigCapacitor';

// Web3Modal and constants
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { CW_PROJECT_ID } from '../../constants'; // Path relative to components/shared/

interface CoreClientProvidersProps {
  readonly children: ReactNode;
}

// Initialize QueryClient outside the component or with useState as done previously
const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export default function CoreClientProviders({ children }: CoreClientProvidersProps) {
  // queryClient is already initialized using useState in the previous step for stability.
  // For this edit, I will reuse the existing queryClient from useState.
  const [queryClient] = useState(() => queryClientInstance); 

  const capacitorHook = useCapacitor();
  const [currentWagmiConfig, setCurrentWagmiConfig] = useState<ReturnType<typeof wagmiConfigWeb> | ReturnType<typeof wagmiConfigCapacitor> | null>(null);
  const [isWeb3ModalCreated, setIsWeb3ModalCreated] = useState(false);

  useEffect(() => {
    const chains = getChains() as [Chain, ...Chain[]];
    const config = capacitorHook.isCapacitor
      ? wagmiConfigCapacitor(chains, wagmiMetadata)
      : wagmiConfigWeb(chains, wagmiMetadata);
    setCurrentWagmiConfig(config);
  }, [capacitorHook.isCapacitor]); // Re-run if capacitor status changes

  useEffect(() => {
    if (currentWagmiConfig && !isWeb3ModalCreated) {
      createWeb3Modal({
        wagmiConfig: currentWagmiConfig,
        projectId: CW_PROJECT_ID,
        enableAnalytics: true,
        themeMode: "dark",
      });
      setIsWeb3ModalCreated(true); // Ensure it's only created once
    }
  }, [currentWagmiConfig, isWeb3ModalCreated]);

  useEffect(() => {
    if (capacitorHook.isCapacitor) {
      document.body.classList.add("capacitor-native");
    } else {
      document.body.classList.remove("capacitor-native");
    }
    // Cleanup function to remove the class if the component unmounts
    // or if capacitor status changes from true to false during component lifecycle.
    return () => {
      document.body.classList.remove("capacitor-native");
    };
  }, [capacitorHook.isCapacitor]);

  // Updated condition: wait for both wagmiConfig and Web3Modal creation
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
    </WagmiProvider>
  );
} 
