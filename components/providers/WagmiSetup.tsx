"use client";

import { WagmiProvider } from "wagmi";
import { useEffect, useState, useMemo, useRef } from "react";
import { 
  AppWallet,
  appWalletsEventEmitter,
} from "../app-wallets/AppWalletsContext";
import { useAppWalletPasswordModal } from "@/hooks/useAppWalletPasswordModal";
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { AppKitNetwork } from '@reown/appkit-common'
import { CW_PROJECT_ID } from "@/constants";
import { mainnet } from "viem/chains";
import { AppKitAdapterManager } from './AppKitAdapterManager';
import { AppKitAdapterCapacitor } from './AppKitAdapterCapacitor';
import { Capacitor } from '@capacitor/core';

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appKitInitialized, setAppKitInitialized] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isCapacitor = Capacitor.isNativePlatform();
  
  const adapterManager = useMemo(
    () => isCapacitor 
      ? new AppKitAdapterCapacitor(appWalletPasswordModal.requestPassword)
      : new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword, isCapacitor]
  );

  // Initialize AppKit with wallets
  const initializeAppKit = (wallets: AppWallet[]) => {
    try {
      console.log(`Initializing AppKit adapter (${isCapacitor ? 'mobile' : 'web'}) with`, wallets.length, 'AppWallets');
      
      const newAdapter = isCapacitor 
        ? (adapterManager as AppKitAdapterCapacitor).createAdapter(wallets)
        : (adapterManager as AppKitAdapterManager).createAdapterWithCache(wallets);
      
      // Only create AppKit once
      if (!appKitInitialized) {
        // Mobile-specific AppKit configuration
        const appKitConfig = isCapacitor ? {
          adapters: [newAdapter],
          networks: [mainnet] as [AppKitNetwork, ...AppKitNetwork[]],
          projectId: CW_PROJECT_ID,
          metadata: {
            name: "6529.io",
            description: "6529.io",
            url: process.env.BASE_ENDPOINT!,
            icons: [
              "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
            ],
          },
          // Mobile-specific settings
          enableWalletGuide: false,
          featuredWalletIds: ['coinbaseWallet', 'walletConnect'], // Mobile-first wallets
          allWallets: 'HIDE' as const, // Hide "All Wallets" on mobile for cleaner UX
          features: {
            analytics: true,
            email: false,
            socials: [],
            connectMethodsOrder: ['wallet' as const]
          }
        } : {
          adapters: [newAdapter],
          networks: [mainnet] as [AppKitNetwork, ...AppKitNetwork[]],
          projectId: CW_PROJECT_ID,
          metadata: {
            name: "6529.io",
            description: "6529.io",
            url: process.env.BASE_ENDPOINT!,
            icons: [
              "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
            ],
          },
          // Web-specific settings
          enableWalletGuide: false,
          featuredWalletIds: ['metamask', 'walletConnect'],
          allWallets: 'SHOW' as const,
          features: {
            analytics: true,
            email: false,
            socials: [],
            connectMethodsOrder: ['wallet' as const]
          }
        };
        
        createAppKit(appKitConfig);
        setAppKitInitialized(true);
        console.log('[WagmiSetup] AppKit initialized successfully');
      } else {
        console.log('[WagmiSetup] AppKit already initialized, only updating adapter');
      }
      
      setCurrentAdapter(newAdapter);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing AppKit:', error);
    }
  };

  const handleAppWalletUpdate = (wallets: AppWallet[]) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce updates
    timeoutRef.current = setTimeout(() => {
      const shouldRecreate = isCapacitor 
        ? (adapterManager as AppKitAdapterCapacitor).shouldRecreateAdapter(wallets)
        : (adapterManager as AppKitAdapterManager).shouldRecreateAdapter(wallets);
        
      if (shouldRecreate) {
        initializeAppKit(wallets);
      }
    }, 300);
  };

  // Initialize on mount
  useEffect(() => {
    initializeAppKit([]);
  }, []);

  // Listen for AppWallet changes
  useEffect(() => {
    appWalletsEventEmitter.on("update", handleAppWalletUpdate);
    
    return () => {
      appWalletsEventEmitter.off("update", handleAppWalletUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      adapterManager.cleanup();
    };
  }, [adapterManager]);

  if (!currentAdapter || !isInitialized) {
    console.log('[WagmiSetup] Waiting for AppKit initialization...', { 
      hasAdapter: !!currentAdapter, 
      isInitialized,
      isCapacitor 
    });
    return <div>Loading wallet connection...</div>;
  }

  return (
    <WagmiProvider config={currentAdapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
