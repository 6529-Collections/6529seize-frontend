/**
 * Wallet Detection Utilities
 * 
 * Simple, reliable wallet type detection that works with Reown AppKit.
 * Avoids the bugs in useWalletInfo while providing the same functionality.
 */

export interface WalletInfo {
  name: string;
  isSafe: boolean;
}

const DEFAULT_WALLET_INFO: WalletInfo = {
  name: 'Unknown Wallet',
  isSafe: false,
};

/**
 * Detects the connected wallet type using window.ethereum inspection.
 * This is more reliable than useWalletInfo and handles edge cases properly.
 */
export function detectConnectedWallet(): WalletInfo {
  // Server-side or no ethereum object
  if (typeof window === 'undefined' || !window.ethereum) {
    return DEFAULT_WALLET_INFO;
  }

  const ethereum = window.ethereum as any;

  try {
    // Handle multiple providers (EIP-6963 compliant wallets)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      // Use the first provider that's actually connected
      const connectedProvider = ethereum.providers.find((provider: any) => {
        return provider.selectedAddress || provider.accounts?.length > 0;
      }) || ethereum.providers[0];

      return detectSingleProvider(connectedProvider);
    }

    // Single provider detection
    return detectSingleProvider(ethereum);
  } catch (error) {
    // Fail gracefully - log error but return default
    console.warn('Wallet detection failed:', error);
    return DEFAULT_WALLET_INFO;
  }
}

/**
 * Detects wallet type from a single ethereum provider object
 */
function detectSingleProvider(provider: any): WalletInfo {
  if (!provider) {
    return DEFAULT_WALLET_INFO;
  }

  // Safe Wallet Detection (highest priority - most specific)
  if (detectSafeWallet(provider)) {
    return {
      name: 'Safe Wallet',
      isSafe: true,
    };
  }

  // MetaMask Detection
  if (provider.isMetaMask && !provider.isBraveWallet && !provider.isRabby) {
    return {
      name: 'MetaMask',
      isSafe: false,
    };
  }

  // Coinbase Wallet Detection
  if (provider.isCoinbaseWallet || provider.isWalletLink) {
    return {
      name: 'Coinbase Wallet',
      isSafe: false,
    };
  }

  // Trust Wallet Detection
  if (provider.isTrust || provider.isTrustWallet) {
    return {
      name: 'Trust Wallet',
      isSafe: false,
    };
  }

  // Brave Wallet Detection
  if (provider.isBraveWallet) {
    return {
      name: 'Brave Wallet',
      isSafe: false,
    };
  }

  // Rabby Wallet Detection
  if (provider.isRabby) {
    return {
      name: 'Rabby Wallet',
      isSafe: false,
    };
  }

  // Rainbow Wallet Detection
  if (provider.isRainbow) {
    return {
      name: 'Rainbow Wallet',
      isSafe: false,
    };
  }

  // WalletConnect Detection (fallback for mobile wallets)
  if (provider.isWalletConnect || provider.connector?.id === 'walletConnect') {
    return {
      name: 'WalletConnect',
      isSafe: false,
    };
  }

  // Generic wallet (connected but unknown type)
  if (provider.selectedAddress || provider.accounts?.length > 0) {
    return {
      name: 'Connected Wallet',
      isSafe: false,
    };
  }

  return DEFAULT_WALLET_INFO;
}

/**
 * Specialized Safe Wallet detection
 * Safe requires special handling because it often runs in iframe contexts
 */
function detectSafeWallet(provider: any): boolean {
  // Check for Safe-specific properties
  if (provider.isSafe || provider._metamask?.isSafe) {
    return true;
  }

  // Check if running in Safe iframe context
  if (typeof window !== 'undefined') {
    try {
      // Safe app runs in iframe and has specific URL patterns
      // Use exact hostname matching to prevent bypass attacks
      const allowedSafeHosts = [
        'app.safe.global',
        'gnosis-safe.io',
        'safe.global'
      ];
      const isSafeIframe = window.parent !== window && 
        (allowedSafeHosts.includes(window.location.hostname) ||
         allowedSafeHosts.some(host => window.location.hostname.endsWith('.' + host)));

      if (isSafeIframe) {
        return true;
      }

      // Check for Safe's specific wallet properties
      if (provider.safe || provider._safe) {
        return true;
      }

      // Safe sometimes injects custom properties
      if (provider.constructor?.name === 'SafeProvider' || 
          provider.isSafeProvider) {
        return true;
      }

      // Check for Safe in user agent (some versions)
      if (navigator.userAgent.includes('Safe')) {
        return true;
      }

    } catch (error) {
      // Log iframe access errors but continue gracefully
      console.warn('Safe wallet detection failed (iframe context):', error);
    }
  }

  return false;
}

/**
 * Hook-compatible version for React components that need to use this
 * in useEffect or other React contexts
 */
export function useWalletDetection(isConnected: boolean): WalletInfo {
  if (!isConnected) {
    return DEFAULT_WALLET_INFO;
  }

  return detectConnectedWallet();
}