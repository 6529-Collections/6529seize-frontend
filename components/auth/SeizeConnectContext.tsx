"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  migrateCookiesToLocalStorage,
  getWalletAddress,
  removeAuthJwt,
} from "../../services/auth/auth.utils";
import { useAppKit, useAppKitAccount, useAppKitState, useDisconnect, useWalletInfo } from "@reown/appkit/react";

// Custom error types for better error handling
export class WalletConnectionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class WalletDisconnectionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'WalletDisconnectionError';
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

interface SeizeConnectContextType {
  /** Current connected wallet address, undefined if not connected */
  address: string | undefined;
  
  /** Name of the connected wallet (e.g. "MetaMask", "Trust Wallet") */
  walletName: string | undefined;
  
  /** Icon URL of the connected wallet */
  walletIcon: string | undefined;
  
  /** Whether the connected wallet is a Safe (Gnosis Safe) wallet */
  isSafeWallet: boolean;
  
  /** Opens the wallet connection modal */
  seizeConnect: () => void;
  
  /** 
   * Disconnects the current wallet connection
   * @throws {WalletDisconnectionError} When disconnection fails
   */
  seizeDisconnect: () => Promise<void>;
  
  /** 
   * Disconnects wallet and clears authentication state
   * @param reconnect - Whether to automatically reopen connection modal after logout
   * @throws {WalletDisconnectionError} When disconnection fails
   * @throws {AuthenticationError} When auth cleanup fails
   */
  seizeDisconnectAndLogout: (reconnect?: boolean) => Promise<void>;
  
  /** 
   * Manually set the connected address (for internal use)
   * @param address - The wallet address to set as connected
   */
  seizeAcceptConnection: (address: string) => void;
  
  /** Whether the connection modal is currently open */
  seizeConnectOpen: boolean;
  
  /** Whether a wallet is currently connected to the app */
  isConnected: boolean;
  
  /** Whether the user is authenticated with a wallet address */
  isAuthenticated: boolean;
  
  /** Current connection state for better timing control */
  connectionState: 'disconnected' | 'connecting' | 'connected';
}

const SeizeConnectContext = createContext<SeizeConnectContextType | undefined>(
  undefined
);

// Error handling utilities
const createWalletError = (
  ErrorClass: typeof WalletConnectionError | typeof WalletDisconnectionError,
  operation: string,
  originalError: unknown
): WalletConnectionError | WalletDisconnectionError => {
  const message = originalError instanceof Error 
    ? originalError.message 
    : `Unknown error during ${operation}`;
  
  return new ErrorClass(
    `Failed to ${operation}: ${message}`,
    originalError,
    originalError instanceof Error ? originalError.name : undefined
  );
};

const logError = (context: string, error: Error): void => {
  console.error(`[SeizeConnect] ${context}:`, {
    name: error.name,
    message: error.message,
    cause: error.cause
  });
};

// Type guard for validating wallet addresses with checksum validation
const isValidAddress = (address: unknown): address is string => {
  if (typeof address !== 'string' || 
      address.length !== 42 || 
      !address.startsWith('0x')) {
    return false;
  }
  
  // Basic hex validation
  const hexPattern = /^0x[0-9a-fA-F]{40}$/;
  return hexPattern.test(address);
};

export const SeizeConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const account = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const state = useAppKitState();
  const { walletInfo } = useWalletInfo();


  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(
    getWalletAddress() ?? undefined
  );
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    migrateCookiesToLocalStorage();
  }, []);

  // Use useCallback to prevent unnecessary re-renders and race conditions
  const updateConnectionState = useCallback((newAddress: string | undefined, newIsConnected: boolean, newStatus: string | undefined) => {
    console.log('[SeizeConnect] Account state changed:', {
      address: newAddress,
      isConnected: newIsConnected,
      status: newStatus,
      previousConnectionState: connectionState
    });

    // Debounce rapid state changes to prevent race conditions
    setTimeout(() => {
      if (newAddress && newIsConnected) {
        console.log('[SeizeConnect] AppKit connected:', newAddress);
        setConnectedAddress(newAddress);
        setConnectionState('connected');
      } else if (newIsConnected === false) {
        console.log('[SeizeConnect] AppKit disconnected');
        setConnectedAddress(getWalletAddress() ?? undefined);
        setConnectionState('disconnected');
      } else if (newStatus === 'connecting') {
        console.log('[SeizeConnect] Connection in progress...');
        setConnectionState('connecting');
      } else {
        // Default fallback
        console.log('[SeizeConnect] Unknown connection state, defaulting to disconnected');
        setConnectionState('disconnected');
      }
    }, 50); // Small delay to debounce rapid changes
  }, [connectionState]);

  useEffect(() => {
    updateConnectionState(account.address, account.isConnected, account.status);
  }, [account.address, account.isConnected, account.status, updateConnectionState]);

  const seizeConnect = useCallback((): void => {
    try {
      console.log('[SeizeConnect] Opening wallet connection modal');
      open({ view: "Connect" });
    } catch (error) {
      console.error('[SeizeConnect] Error opening connection modal:', error);
      const connectionError = new WalletConnectionError(
        'Failed to open wallet connection modal',
        error
      );
      logError('seizeConnect', connectionError);
      throw connectionError;
    }
  }, [open]);

  const seizeDisconnect = useCallback(async (): Promise<void> => {
    try {
      await disconnect();
    } catch (error: unknown) {
      const walletError = createWalletError(
        WalletDisconnectionError,
        'disconnect wallet',
        error
      );
      logError('seizeDisconnect', walletError);
      throw walletError;
    }
  }, [disconnect]);

  const seizeDisconnectAndLogout = useCallback(
    async (reconnect?: boolean): Promise<void> => {
      try {
        await disconnect();
      } catch (error: unknown) {
        const walletError = createWalletError(
          WalletDisconnectionError,
          'disconnect wallet during logout',
          error
        );
        logError('seizeDisconnectAndLogout', walletError);
        // Continue with cleanup even if disconnect fails
      }
      
      try {
        removeAuthJwt();
        setConnectedAddress(undefined);
        
        if (reconnect) {
          seizeConnect();
        }
      } catch (error: unknown) {
        const authError = new AuthenticationError(
          'Failed to clear authentication state',
          error
        );
        logError('seizeDisconnectAndLogout', authError);
        throw authError;
      }
    },
    [disconnect, seizeConnect]
  );

  const seizeAcceptConnection = useCallback((address: string): void => {
    if (!isValidAddress(address)) {
      const error = new AuthenticationError(
        `Invalid wallet address format: ${address}`
      );
      logError('seizeAcceptConnection', error);
      throw error;
    }
    setConnectedAddress(address);
  }, []);

  const contextValue = useMemo((): SeizeConnectContextType => ({
    address: connectedAddress,
    walletName: walletInfo?.name,
    walletIcon: walletInfo?.icon,
    isSafeWallet: walletInfo?.name === "Safe{Wallet}",
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
    seizeConnectOpen: state.open,
    isConnected: account.isConnected,
    isAuthenticated: !!connectedAddress,
    connectionState,
  }), [
    connectedAddress,
    walletInfo,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
    state.open,
    account.isConnected,
    connectionState,
  ]);

  return (
    <SeizeConnectContext.Provider value={contextValue}>
      {children}
    </SeizeConnectContext.Provider>
  );
};

export const useSeizeConnectContext = (): SeizeConnectContextType => {
  const context = useContext(SeizeConnectContext);
  if (!context) {
    throw new Error(
      "useSeizeConnectContext must be used within a SeizeConnectProvider"
    );
  }
  return context;
};
