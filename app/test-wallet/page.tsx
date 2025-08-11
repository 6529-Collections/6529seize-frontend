"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount, useAppKit, useWalletInfo } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { Capacitor } from "@capacitor/core";

export default function TestWalletPage() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const walletInfo = useWalletInfo();
  const wagmiAccount = useAccount();
  
  const [platform, setPlatform] = useState<string>("");
  const [userAgent, setUserAgent] = useState<string>("");
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  
  useEffect(() => {
    // Detect platform
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    setPlatform(`${platform} (Native: ${isNative})`);
    setUserAgent(navigator.userAgent);
    
    // Log initial state
    addLog("Page loaded");
    addLog(`Platform: ${platform}, Native: ${isNative}`);
  }, []);
  
  useEffect(() => {
    if (isConnected) {
      addLog(`✅ Connected to: ${address}`);
      if (walletInfo?.walletInfo) {
        addLog(`Wallet: ${walletInfo.walletInfo.name}`);
      }
    }
  }, [isConnected, address, walletInfo]);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };
  
  const testMetaMaskConnection = async () => {
    try {
      addLog("🔄 Opening wallet modal for MetaMask...");
      await open({ view: 'Connect' });
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const testAllWallets = async () => {
    try {
      addLog("🔄 Opening all wallets view...");
      await open({ view: 'AllWallets' });
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      addLog("🔄 Disconnecting...");
      await disconnect();
      addLog("✅ Disconnected");
    } catch (error) {
      addLog(`❌ Disconnect error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const checkInjectedProvider = () => {
    const hasMetaMask = typeof window !== 'undefined' && window.ethereum?.isMetaMask;
    const hasEthereum = typeof window !== 'undefined' && !!window.ethereum;
    addLog(`Ethereum injected: ${hasEthereum}`);
    addLog(`MetaMask detected: ${hasMetaMask}`);
    
    if (window.ethereum) {
      addLog(`Provider: ${JSON.stringify({
        isMetaMask: window.ethereum.isMetaMask,
        isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
        isWalletConnect: window.ethereum.isWalletConnect,
      })}`);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Wallet Connection Test Page</h1>
      
      {/* Device Info */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Device Information</h2>
        <div className="text-sm space-y-1">
          <p><strong>Platform:</strong> {platform}</p>
          <p className="truncate"><strong>User Agent:</strong> {userAgent}</p>
          <p><strong>Window width:</strong> {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</p>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Connection Status</h2>
        <div className="space-y-2">
          <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
          {isConnected && (
            <>
              <p className="font-mono text-sm break-all"><strong>Address:</strong> {address}</p>
              <p><strong>Wallet:</strong> {walletInfo?.walletInfo?.name || 'Unknown'}</p>
              <p><strong>Wagmi Connected:</strong> {wagmiAccount.isConnected ? '✅' : '❌'}</p>
            </>
          )}
        </div>
      </div>
      
      {/* Test Actions */}
      <div className="space-y-3 mb-6">
        <h2 className="font-semibold">Test Actions</h2>
        
        <button
          onClick={testMetaMaskConnection}
          className="w-full bg-orange-500 text-white p-3 rounded hover:bg-orange-600 transition"
          disabled={isConnected}
        >
          🦊 Test MetaMask Connection
        </button>
        
        <button
          onClick={testAllWallets}
          className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition"
          disabled={isConnected}
        >
          📱 Open All Wallets Modal
        </button>
        
        <button
          onClick={checkInjectedProvider}
          className="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600 transition"
        >
          🔍 Check Injected Providers
        </button>
        
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-500 text-white p-3 rounded hover:bg-red-600 transition"
          >
            🔌 Disconnect Wallet
          </button>
        )}
      </div>
      
      {/* Connection Log */}
      <div className="bg-gray-900 text-green-400 p-4 rounded">
        <h2 className="font-semibold mb-2">Connection Log</h2>
        <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          {connectionLog.length === 0 ? (
            <p>No logs yet...</p>
          ) : (
            connectionLog.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">{log}</div>
            ))
          )}
        </div>
      </div>
      
      {/* Debug Info */}
      <details className="mt-6">
        <summary className="cursor-pointer font-semibold">Advanced Debug Info</summary>
        <pre className="bg-gray-100 p-4 rounded mt-2 text-xs overflow-x-auto">
{JSON.stringify({
  appKit: {
    isConnected,
    address,
    walletInfo: walletInfo?.walletInfo,
  },
  wagmi: {
    address: wagmiAccount.address,
    isConnected: wagmiAccount.isConnected,
    connector: wagmiAccount.connector?.name,
  },
  window: {
    hasEthereum: typeof window !== 'undefined' && !!window.ethereum,
    isMetaMask: typeof window !== 'undefined' && window.ethereum?.isMetaMask,
  }
}, null, 2)}
        </pre>
      </details>
    </div>
  );
}