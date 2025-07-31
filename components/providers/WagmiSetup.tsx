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
import { CW_PROJECT_ID } from "@/constants";
import { mainnet } from "viem/chains";
import { AppKitAdapterManager } from './AppKitAdapterManager';

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const adapterManager = useMemo(
    () => new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword]
  );

  // Initialize AppKit with wallets
  const initializeAppKit = (wallets: AppWallet[]) => {
    try {
      console.log('Initializing AppKit adapter with', wallets.length, 'AppWallets');
      
      const newAdapter = adapterManager.createAdapterWithCache(wallets);
      
      createAppKit({
        adapters: [newAdapter],
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
        // Customize what appears in modal
        enableWalletGuide: false, // Remove wallet guide text
        featuredWalletIds: ['metamask', 'walletConnect'], // Show these first
        allWallets: 'SHOW', // Keep "All Wallets" button
    
        features: {
          analytics: true,
          email: false, // Disable if you don't want email login
          socials: [], // Disable social logins
          connectMethodsOrder: ['wallet'] // Only show wallet tab
        }
      });
      
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
      if (adapterManager.shouldRecreateAdapter(wallets)) {
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
    return <div></div>;
  }

  return (
    <WagmiProvider config={currentAdapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
