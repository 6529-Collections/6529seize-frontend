"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount, useWalletInfo } from "@reown/appkit/react";
import { Capacitor } from "@capacitor/core";

export function MobileWalletDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { address, isConnected } = useAppKitAccount();
  const walletInfo = useWalletInfo();
  
  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
    
    // Collect debug info
    const info = {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      wallet: {
        connected: isConnected,
        address: address?.slice(0, 10) + '...',
        name: walletInfo?.walletInfo?.name,
      },
      providers: {
        ethereum: !!window.ethereum,
        metamask: window.ethereum?.isMetaMask,
      },
      userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    };
    
    setDebugInfo(info);
  }, [isConnected, address, walletInfo]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 right-0 m-4 p-3 bg-black/80 text-white text-xs rounded-lg max-w-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Wallet Debug</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        <div>Platform: {debugInfo.platform} {debugInfo.isNative && '(Native)'}</div>
        <div>Screen: {debugInfo.viewport?.width}x{debugInfo.viewport?.height}</div>
        <div>Wallet: {debugInfo.wallet?.connected ? `✅ ${debugInfo.wallet.name}` : '❌ Not connected'}</div>
        <div>MetaMask: {debugInfo.providers?.metamask ? '✅' : '❌'}</div>
        <div>Mode: {debugInfo.userAgent}</div>
      </div>
    </div>
  );
}