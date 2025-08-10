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
import { CW_PROJECT_ID, VALIDATED_BASE_ENDPOINT } from "@/constants";
import { mainnet } from "viem/chains";
import { AppKitAdapterManager } from './AppKitAdapterManager';
import { AppKitAdapterCapacitor } from './AppKitAdapterCapacitor';
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '@/src/errors/adapter';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../auth/Auth';
import { sanitizeErrorForUser, logErrorSecurely } from '@/utils/error-sanitizer';

export default function WagmiSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const { setToast } = useAuth();
  const [currentAdapter, setCurrentAdapter] = useState<WagmiAdapter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appKitInitialized, setAppKitInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize platform detection to avoid repeated calls
  const isCapacitor = useMemo(() => Capacitor.isNativePlatform(), []);

  // Handle client-side mounting for App Router
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const adapterManager = useMemo(
    () => isCapacitor 
      ? new AppKitAdapterCapacitor(appWalletPasswordModal.requestPassword)
      : new AppKitAdapterManager(appWalletPasswordModal.requestPassword),
    [appWalletPasswordModal.requestPassword, isCapacitor]
  );

  // Initialize AppKit with wallets
  const initializeAppKit = (wallets: AppWallet[]) => {
    try {
      // Initialize AppKit adapter for platform-specific wallet management
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WagmiSetup] Initializing AppKit adapter (${isCapacitor ? 'mobile' : 'web'}) with`, wallets.length, 'AppWallets');
      }
      
      let newAdapter: WagmiAdapter;
      try {
        newAdapter = isCapacitor 
          ? (adapterManager as AppKitAdapterCapacitor).createAdapter(wallets)
          : (adapterManager as AppKitAdapterManager).createAdapterWithCache(wallets);
      } catch (error) {
        if (error instanceof AdapterError || error instanceof AdapterCacheError) {
          logErrorSecurely('[WagmiSetup] Adapter creation failed', error);
          const userMessage = sanitizeErrorForUser(error);
          setToast({
            message: userMessage,
            type: "error",
          });
          throw new Error(`Wallet adapter setup failed: ${error.message}. Please refresh the page and try again.`);
        }
        logErrorSecurely('[WagmiSetup] Adapter creation failed with unexpected error', error);
        const userMessage = sanitizeErrorForUser(error);
        setToast({
          message: userMessage,
          type: "error",
        });
        throw new Error('Failed to initialize wallet connection. Please refresh the page and try again.');
      }
      
      // Only create AppKit once
      if (!appKitInitialized) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WagmiSetup] Creating AppKit instance for the first time');
        }
        // Mobile-specific AppKit configuration
        const appKitConfig = isCapacitor ? {
          adapters: [newAdapter],
          networks: [mainnet] as [AppKitNetwork, ...AppKitNetwork[]],
          projectId: CW_PROJECT_ID,
          metadata: {
            name: "6529.io",
            description: "6529.io",
            url: VALIDATED_BASE_ENDPOINT,
            icons: [
              "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
            ],
          },
          // Mobile-specific settings
          enableWalletGuide: false,
          featuredWalletIds: ['metamask', 'coinbaseWallet', 'walletConnect'], // Include MetaMask for mobile
          allWallets: 'SHOW' as const, // Show "All Wallets" on mobile to ensure MetaMask is accessible
          features: {
            analytics: true,
            email: false,
            socials: [],
            connectMethodsOrder: ['wallet' as const]
          },
          enableOnramp: false, // Disable for mobile
          enableSwaps: false   // Disable for mobile
        } : {
          adapters: [newAdapter],
          networks: [mainnet] as [AppKitNetwork, ...AppKitNetwork[]],
          projectId: CW_PROJECT_ID,
          metadata: {
            name: "6529.io",
            description: "6529.io",
            url: VALIDATED_BASE_ENDPOINT,
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
          },
          enableOnramp: false, // Keep disabled for now
          enableSwaps: false   // Keep disabled for now
        };
        
        try {
          createAppKit(appKitConfig);
          setAppKitInitialized(true);
          if (process.env.NODE_ENV === 'development') {
            console.log('[WagmiSetup] AppKit initialized successfully');
          }
        } catch (appKitError) {
          console.error('[WagmiSetup] Failed to create AppKit:', appKitError);
          // Set a flag to prevent infinite retry loops
          setAppKitInitialized(true); // Prevent retries
          throw new Error(`AppKit initialization failed: ${appKitError instanceof Error ? appKitError.message : String(appKitError)}`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WagmiSetup] AppKit already initialized, only updating adapter');
        }
      }
      
      setCurrentAdapter(newAdapter);
      setIsInitialized(true);
    } catch (error) {
      logErrorSecurely('[WagmiSetup] Error initializing AppKit', error);
      // Show user-friendly error message
      const userMessage = sanitizeErrorForUser(error);
      setToast({
        message: userMessage,
        type: "error",
      });
      throw error; // Re-throw to prevent app from continuing in broken state
    }
  };

  const handleAppWalletUpdate = (wallets: AppWallet[]) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce updates
    timeoutRef.current = setTimeout(() => {
      try {
        const shouldRecreate = isCapacitor 
          ? (adapterManager as AppKitAdapterCapacitor).shouldRecreateAdapter(wallets)
          : (adapterManager as AppKitAdapterManager).shouldRecreateAdapter(wallets);
          
        if (shouldRecreate) {
          initializeAppKit(wallets);
        }
      } catch (error) {
        logErrorSecurely('[WagmiSetup] Error during wallet update', error);
        // Show user-friendly error message
        const userMessage = sanitizeErrorForUser(error);
        setToast({
          message: userMessage,
          type: "error",
        });
        throw error;
      }
    }, 300);
  };

  // Initialize only after mounting to avoid SSR issues
  useEffect(() => {
    if (isMounted) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WagmiSetup] Client-side mounted, initializing AppKit');
      }
      initializeAppKit([]);
    }
  }, [isMounted]);

  // Listen for AppWallet changes
  useEffect(() => {
    appWalletsEventEmitter.on("update", handleAppWalletUpdate);
    
    return () => {
      appWalletsEventEmitter.off("update", handleAppWalletUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      try {
        adapterManager.cleanup();
      } catch (error) {
        logErrorSecurely('[WagmiSetup] Error during cleanup', error);
        if (error instanceof AdapterCleanupError) {
          logErrorSecurely('[WagmiSetup] Adapter cleanup failed', error);
          // Don't throw here as this is in cleanup - just log the error
        }
      }
    };
  }, [adapterManager]);

  // Don't render anything until mounted (fixes SSR issues)
  if (!isMounted) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <div className="mt-2">Initializing...</div>
        </div>
      </div>
    );
  }

  if (!currentAdapter || !isInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WagmiSetup] Waiting for AppKit initialization...', { 
        hasAdapter: !!currentAdapter, 
        isInitialized,
        isCapacitor,
        isMounted
      });
    }
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <div className="mt-2">
            Connecting to {isCapacitor ? 'mobile' : 'web'} wallet service...
          </div>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={currentAdapter.wagmiConfig}>
      {children}
      {appWalletPasswordModal.modal}
    </WagmiProvider>
  );
}
