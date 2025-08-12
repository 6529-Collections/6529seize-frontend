// Debug utility for Capacitor - safe to use in production
// This file provides debugging capabilities for Capacitor mobile apps where console access is limited

/**
 * Shows debug alert only in Capacitor environment
 * @param location - Where in the code this is called from
 * @param message - Main debug message
 * @param data - Optional data to display
 */
export const debugAlert = (location: string, message: string, data?: any) => {
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const dataStr = data ? `\n${JSON.stringify(data, null, 2).slice(0, 200)}` : '';
    alert(`[${timestamp}] ${location}\n${message}${dataStr}`);
  }
  // Also log to console for development
  console.log(`[CAPACITOR DEBUG ${location}]`, message, data);
};

/**
 * Checks the current Capacitor environment and wallet detection
 */
export const checkCapacitorEnvironment = () => {
  if (typeof window === 'undefined') return null;
  
  const env = {
    isCapacitor: !!window.Capacitor?.isNativePlatform?.(),
    platform: window.Capacitor?.getPlatform?.() || 'unknown',
    hasEthereum: !!window.ethereum,
    ethereumIsMetaMask: !!window.ethereum?.isMetaMask,
    hasWeb3: !!window.web3,
    userAgent: window.navigator?.userAgent?.slice(0, 100) || 'unknown',
    walletType: detectWalletType(),
    documentVisible: document.visibilityState,
    locationHref: window.location.href
  };
  
  return env;
};

/**
 * Detects the type of wallet provider available
 */
function detectWalletType(): string {
  if (typeof window === 'undefined') return 'none';
  
  if (window.ethereum?.isMetaMask) return 'MetaMask';
  if (window.ethereum?.isCoinbaseWallet) return 'Coinbase';
  if (window.ethereum?.isWalletConnect) return 'WalletConnect';
  if (window.ethereum) return 'Generic Web3';
  
  return 'none';
}

// Global window type extension for TypeScript
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
    web3?: any;
  }
}