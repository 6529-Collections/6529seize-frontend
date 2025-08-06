"use client";

import { useState, useCallback } from "react";
import { useSignMessage, useAccount } from "wagmi";
import { UserRejectedRequestError } from "viem";

/**
 * Enhanced mobile-compatible signing errors
 */
export class MobileSigningError extends Error {
  constructor(
    message: string,
    public readonly code?: string | number,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'MobileSigningError';
  }
}

export class ConnectionMismatchError extends Error {
  constructor(expectedAddress: string, actualAddress?: string) {
    super(`Address mismatch: expected ${expectedAddress}, got ${actualAddress || 'none'}`);
    this.name = 'ConnectionMismatchError';
  }
}

interface SignatureResult {
  signature: string | null;
  userRejected: boolean;
  error?: MobileSigningError | ConnectionMismatchError;
}

interface UseSecureSignReturn {
  signMessage: (message: string) => Promise<SignatureResult>;
  isSigningPending: boolean;
  reset: () => void;
}

/**
 * Secure message signing hook with mobile wallet compatibility
 * Uses Wagmi's useSignMessage for proper provider management and security
 */
export const useSecureSign = (): UseSecureSignReturn => {
  const [isSigningPending, setIsSigningPending] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const { address: connectedAddress, isConnected } = useAccount();

  const reset = useCallback(() => {
    setIsSigningPending(false);
  }, []);

  const signMessage = useCallback(async (
    message: string
  ): Promise<SignatureResult> => {
    setIsSigningPending(true);

    try {
      // Validate connection state before attempting to sign
      if (!isConnected) {
        throw new MobileSigningError(
          "Wallet not connected. Please connect your wallet and try again.",
          "WALLET_NOT_CONNECTED"
        );
      }

      if (!connectedAddress) {
        throw new MobileSigningError(
          "No wallet address detected. Please reconnect your wallet.",
          "NO_ADDRESS"
        );
      }

      // Additional mobile-specific validation
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Type the ethereum provider properly
          const provider = window.ethereum as {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
          };
          
          // Verify the provider is still available (important for mobile apps)
          const accounts = await provider.request({ 
            method: 'eth_accounts' 
          });
          
          if (!accounts || accounts.length === 0) {
            throw new MobileSigningError(
              "Wallet connection lost. Please reconnect and try again.",
              "CONNECTION_LOST"
            );
          }

          // Verify the connected address matches
          const providerAddress = accounts[0]?.toLowerCase();
          const expectedAddress = connectedAddress.toLowerCase();
          
          if (providerAddress !== expectedAddress) {
            throw new ConnectionMismatchError(expectedAddress, providerAddress);
          }
        } catch (providerError: any) {
          // Handle mobile wallet provider errors gracefully
          if (providerError instanceof ConnectionMismatchError) {
            throw providerError;
          }
          
          console.warn('Provider validation failed, continuing with Wagmi signing:', providerError);
          // Continue with signing if provider validation fails but connection state is good
        }
      }

      // Use Wagmi's secure signing method
      const signature = await signMessageAsync({ message });

      return {
        signature,
        userRejected: false,
      };

    } catch (error: any) {
      // Handle user rejection (most common case)
      if (error instanceof UserRejectedRequestError) {
        return {
          signature: null,
          userRejected: true,
        };
      }

      // Handle custom errors we've defined
      if (error instanceof MobileSigningError || error instanceof ConnectionMismatchError) {
        return {
          signature: null,
          userRejected: false,
          error,
        };
      }

      // Handle mobile-specific wallet errors
      if (error?.code === 4001) {
        return {
          signature: null,
          userRejected: true,
        };
      }

      // Handle common mobile wallet errors
      const mobileSigningError = new MobileSigningError(
        getMobileErrorMessage(error),
        error?.code || error?.name,
        error
      );

      return {
        signature: null,
        userRejected: false,
        error: mobileSigningError,
      };

    } finally {
      setIsSigningPending(false);
    }
  }, [signMessageAsync, connectedAddress, isConnected]);

  return {
    signMessage,
    isSigningPending,
    reset,
  };
};

/**
 * Get user-friendly error messages for mobile wallet issues
 */
const getMobileErrorMessage = (error: any): string => {
  console.log('error', error);
  const message = error?.message || error?.toString() || 'Unknown error';
  
  // Common mobile wallet error patterns
  if (message.includes('connection') || message.includes('provider')) {
    return 'Connection issue with your wallet. Please check your connection and try again.';
  }
  
  if (message.includes('network') || message.includes('chain')) {
    return 'Network issue detected. Please check your wallet network settings.';
  }
  
  if (message.includes('timeout') || message.includes('time out')) {
    return 'Request timed out. Please try again with a stable connection.';
  }
  
  if (message.includes('unsupported') || message.includes('not supported')) {
    return 'This operation is not supported by your current wallet app.';
  }

  // Default fallback for mobile
  return 'Signing failed. Please try again or switch to a different wallet app if the issue persists.';
};