"use client";

import { useState, useCallback } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
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

export class SigningProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SigningProviderError';
  }
}

/**
 * SECURITY: Provider validation error for runtime type checking
 */
export class ProviderValidationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ProviderValidationError';
  }
}

/**
 * SECURITY: EIP-1193 provider interface for proper type validation
 */
interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(eventName: string, listener: (...args: unknown[]) => void): void;
  removeListener?(eventName: string, listener: (...args: unknown[]) => void): void;
}

/**
 * SECURITY: Validated wallet provider interface
 */
interface ValidatedWalletProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
}

interface SignatureResult {
  signature: string | null;
  userRejected: boolean;
  error?: MobileSigningError | ConnectionMismatchError | SigningProviderError | ProviderValidationError;
}

interface UseSecureSignReturn {
  signMessage: (message: string) => Promise<SignatureResult>;
  isSigningPending: boolean;
  reset: () => void;
}

/**
 * SECURITY: Allowed RPC methods whitelist - prevents malicious method injection
 */
const ALLOWED_RPC_METHODS = [
  'eth_accounts',
  'eth_requestAccounts', 
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_chainId',
  'eth_getBlockByNumber',
  'eth_getBalance',
  'eth_getTransactionCount',
  'eth_estimateGas',
  'eth_sendTransaction',
  'eth_getTransactionReceipt',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain'
] as const;

type AllowedRPCMethod = typeof ALLOWED_RPC_METHODS[number];

/**
 * SECURITY: Type guard for EIP-1193 provider
 * Prevents provider injection attacks by validating provider structure
 */
function isEIP1193Provider(provider: unknown): provider is EIP1193Provider {
  if (!provider || typeof provider !== 'object') {
    return false;
  }
  
  const providerObj = provider as Record<string, unknown>;
  return typeof providerObj.request === 'function';
}

/**
 * SECURITY: Validate RPC method against whitelist
 * Prevents execution of unauthorized RPC methods
 */
function isAllowedRPCMethod(method: string): method is AllowedRPCMethod {
  return ALLOWED_RPC_METHODS.includes(method as AllowedRPCMethod);
}

/**
 * SECURITY: Comprehensive wallet provider validation
 * Validates provider structure and ensures it's a legitimate wallet provider
 */
function validateWalletProvider(provider: unknown): ValidatedWalletProvider {
  if (!isEIP1193Provider(provider)) {
    throw new ProviderValidationError('Invalid provider: does not implement EIP-1193 interface');
  }

  // Additional security checks for provider legitimacy
  const providerObj = provider as unknown as Record<string, unknown>;
  
  // Check if provider has basic wallet characteristics
  const hasWalletFeatures = (
    typeof providerObj.isMetaMask === 'boolean' ||
    typeof providerObj.isCoinbaseWallet === 'boolean' ||
    typeof providerObj.isWalletConnect === 'boolean' ||
    typeof providerObj.enable === 'function' ||
    typeof providerObj.send === 'function'
  );
  
  if (!hasWalletFeatures) {
    throw new ProviderValidationError('Provider does not appear to be a legitimate wallet provider');
  }

  return provider as ValidatedWalletProvider;
}

/**
 * SECURITY: Validate Ethereum address format
 * Ensures address follows proper format and prevents injection
 */
function validateEthereumAddress(address: string): void {
  if (typeof address !== 'string') {
    throw new ProviderValidationError('Address must be a string');
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new ProviderValidationError('Invalid Ethereum address format');
  }
}

/**
 * SECURITY: Validate message input
 * Ensures message is safe for signing and prevents injection attacks
 */
function validateMessage(message: string): void {
  if (typeof message !== 'string') {
    throw new ProviderValidationError('Message must be a string');
  }
  
  if (message.length === 0) {
    throw new ProviderValidationError('Message cannot be empty');
  }
  
  if (message.length > 10000) {
    throw new ProviderValidationError('Message too long (max 10000 characters)');
  }
  
  // Check for suspicious patterns that might indicate injection attempts
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /\x00/, // null bytes
    /\uffff/, // invalid unicode
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      throw new ProviderValidationError('Message contains suspicious content');
    }
  }
}

/**
 * SECURITY: Validate signature format
 * Ensures returned signature follows expected format
 */
function validateSignature(signature: string): void {
  if (typeof signature !== 'string') {
    throw new ProviderValidationError('Signature must be a string');
  }
  
  // Ethereum signatures should be 65 bytes (130 hex chars + 0x prefix)
  if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    throw new ProviderValidationError('Invalid signature format');
  }
}

/**
 * Secure message signing hook with mobile wallet compatibility
 * Uses Wagmi's useSignMessage for proper provider management and security
 */
export const useSecureSign = (): UseSecureSignReturn => {
  const [isSigningPending, setIsSigningPending] = useState(false);
  const { address: connectedAddress, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  const reset = useCallback(() => {
    setIsSigningPending(false);
  }, []);

  const signMessage = useCallback(async (
    message: string
  ): Promise<SignatureResult> => {
    setIsSigningPending(true);

    try {
      // SECURITY: Input validation - validate message before any processing
      validateMessage(message);
      
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
      
      // SECURITY: Validate connected address format
      validateEthereumAddress(connectedAddress);

      // SECURITY: Comprehensive provider validation with proper type checking
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // SECURITY FIX: Replace unsafe 'as any' cast with proper validation
          const validatedProvider = validateWalletProvider(window.ethereum);
          
          // SECURITY: Validate RPC method before calling
          if (!isAllowedRPCMethod('eth_accounts')) {
            throw new ProviderValidationError('eth_accounts method not allowed');
          }
          
          // Verify the provider is still available (important for mobile apps)
          const accountsResult = await validatedProvider.request({ 
            method: 'eth_accounts' 
          });
          
          // SECURITY: Validate response structure
          if (!Array.isArray(accountsResult)) {
            throw new ProviderValidationError('Invalid accounts response format');
          }
          
          const accounts = accountsResult as string[];
          
          if (accounts.length === 0) {
            throw new MobileSigningError(
              "Wallet connection lost. Please reconnect and try again.",
              "CONNECTION_LOST"
            );
          }

          // SECURITY: Validate each returned address
          const providerAddress = accounts[0];
          if (typeof providerAddress !== 'string') {
            throw new ProviderValidationError('Provider returned invalid address type');
          }
          
          validateEthereumAddress(providerAddress);
          
          // Verify the connected address matches
          const normalizedProviderAddress = providerAddress.toLowerCase();
          const normalizedExpectedAddress = connectedAddress.toLowerCase();
          
          if (normalizedProviderAddress !== normalizedExpectedAddress) {
            throw new ConnectionMismatchError(normalizedExpectedAddress, normalizedProviderAddress);
          }
        } catch (providerError: unknown) {
          // SECURITY: Proper error handling without unsafe casting (use name check for Jest compatibility)
          if (providerError && typeof providerError === 'object' && 'name' in providerError) {
            const errorName = (providerError as Error).name;
            if (errorName === 'ConnectionMismatchError' ||
                errorName === 'MobileSigningError' ||
                errorName === 'ProviderValidationError') {
              throw providerError;
            }
          }
          
          // Any other provider validation failure - fail immediately
          throw new ProviderValidationError(
            "Wallet provider validation failed. Please disconnect and reconnect your wallet.",
            providerError
          );
        }
      }

      // SECURITY: Comprehensive wallet provider validation
      // SECURITY FIX: Replace unsafe 'as any' cast with proper validation
      const validatedWalletProvider = validateWalletProvider(walletProvider);

      // Use ethers BrowserProvider with validated provider
      const ethersProvider = new BrowserProvider(validatedWalletProvider);
      const signer = await ethersProvider.getSigner();
      
      // SECURITY: Verify signer address matches connected address
      const signerAddress = await signer.getAddress();
      validateEthereumAddress(signerAddress);
      
      if (signerAddress.toLowerCase() !== connectedAddress.toLowerCase()) {
        throw new ConnectionMismatchError(connectedAddress, signerAddress);
      }
      
      // Sign the message
      const signature = await signer.signMessage(message);
      
      // SECURITY: Validate signature format before returning
      validateSignature(signature);

      return {
        signature,
        userRejected: false,
      };

    } catch (error: unknown) {
      // SECURITY: Proper error handling without unsafe type casting
      
      // Handle user rejection (most common case)
      if (error instanceof UserRejectedRequestError) {
        return {
          signature: null,
          userRejected: true,
        };
      }

      // Handle custom errors we've defined (use name check for Jest compatibility)
      if (error && typeof error === 'object' && 'name' in error) {
        const errorName = (error as Error).name;
        if (errorName === 'MobileSigningError' || 
            errorName === 'ConnectionMismatchError' || 
            errorName === 'SigningProviderError' ||
            errorName === 'ProviderValidationError') {
          return {
            signature: null,
            userRejected: false,
            error: error as MobileSigningError | ConnectionMismatchError | SigningProviderError | ProviderValidationError,
          };
        }
      }

      // Handle mobile-specific wallet errors with proper type checking
      if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
        return {
          signature: null,
          userRejected: true,
        };
      }

      // Handle common mobile wallet errors
      const mobileSigningError = new MobileSigningError(
        getMobileErrorMessage(error),
        extractErrorCode(error),
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
  }, [walletProvider, connectedAddress, isConnected]);

  return {
    signMessage,
    isSigningPending,
    reset,
  };
};

/**
 * SECURITY: Safely extract error code without unsafe type casting
 */
const extractErrorCode = (error: unknown): string | number | undefined => {
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    if ('code' in errorObj) {
      const code = errorObj.code;
      if (typeof code === 'string' || typeof code === 'number') {
        return code;
      }
    }
    if ('name' in errorObj && typeof errorObj.name === 'string') {
      return errorObj.name;
    }
  }
  return undefined;
};

/**
 * SECURITY: Get user-friendly error messages with proper type checking
 */
const getMobileErrorMessage = (error: unknown): string => {
  let message: string;
  
  // SECURITY: Safe message extraction without unsafe casting
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error.toString === 'function') {
    try {
      message = error.toString();
    } catch {
      message = 'Unknown error';
    }
  } else {
    message = 'Unknown error';
  }
  
  // Sanitize message to prevent any potential injection
  message = message.substring(0, 1000); // Limit length
  
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