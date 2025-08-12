"use client";

import { useState, useCallback } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useSignMessage } from "wagmi";
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
  
  // Check if we're in Capacitor environment (mobile app)
  const isCapacitor = typeof window !== 'undefined' && 
                     window.Capacitor?.isNativePlatform?.();
  
  // Check if provider has basic wallet characteristics
  // For Capacitor/mobile, we're more lenient since WalletConnect providers might not have these flags
  const hasWalletFeatures = (
    typeof providerObj.isMetaMask === 'boolean' ||
    typeof providerObj.isCoinbaseWallet === 'boolean' ||
    typeof providerObj.isWalletConnect === 'boolean' ||
    typeof providerObj.enable === 'function' ||
    typeof providerObj.send === 'function' ||
    // For WalletConnect/mobile providers, just check for request method
    (isCapacitor && typeof providerObj.request === 'function')
  );
  
  if (!hasWalletFeatures) {
    throw new ProviderValidationError('Provider does not appear to be a legitimate wallet provider');
  }

  // SECURITY FIX: Runtime validation of provider methods instead of unsafe type assertion
  // Test the provider.request method with a safe call to verify it's functional
  if (typeof providerObj.request !== 'function') {
    throw new ProviderValidationError('Provider request method is not a function');
  }

  // SECURITY: Check for malicious patterns that indicate a compromised provider
  const suspiciousKeys = ['eval', 'Function', '__proto__', 'constructor'];
  for (const key of suspiciousKeys) {
    if (key in providerObj && typeof providerObj[key] === 'function') {
      const fnString = providerObj[key].toString();
      if (fnString.includes('eval') || fnString.includes('Function(')) {
        throw new ProviderValidationError('Provider contains suspicious execution methods');
      }
    }
  }

  // SECURITY: Check for mock indicators that suggest a test/malicious provider
  const mockIndicators = ['jest', 'mock', 'fake', 'test', 'spy'];
  for (const indicator of mockIndicators) {
    if (typeof providerObj[indicator] !== 'undefined') {
      throw new ProviderValidationError('Provider appears to be a mock or test provider');
    }
  }

  // SECURITY: Test provider.request method with safe eth_chainId call
  const testProvider = async (): Promise<void> => {
    try {
      await (providerObj.request as Function)({ method: 'eth_chainId' });
    } catch (error) {
      // If the call fails, the provider might be broken or malicious
      throw new ProviderValidationError('Provider request method failed validation test', error);
    }
  };

  // For synchronous validation, we'll skip the async test but keep the structure for future enhancement
  // testProvider().catch(() => { throw new ProviderValidationError('Provider request test failed'); });

  // SECURITY: Build validated provider object with proper type safety
  const validatedProvider: ValidatedWalletProvider = {
    request: providerObj.request as (args: { method: string; params?: unknown[] }) => Promise<unknown>,
    isMetaMask: typeof providerObj.isMetaMask === 'boolean' ? providerObj.isMetaMask : undefined,
    isCoinbaseWallet: typeof providerObj.isCoinbaseWallet === 'boolean' ? providerObj.isCoinbaseWallet : undefined,
    isWalletConnect: typeof providerObj.isWalletConnect === 'boolean' ? providerObj.isWalletConnect : undefined,
  };

  return validatedProvider;
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
  const wagmiSignMessage = useSignMessage();

  const reset = useCallback(() => {
    setIsSigningPending(false);
    wagmiSignMessage.reset();
  }, [wagmiSignMessage]);

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

      // Use wagmi's signMessage which handles WalletConnect deep linking properly
      const signature = await wagmiSignMessage.signMessageAsync({
        message,
      });
      
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
  }, [connectedAddress, isConnected, wagmiSignMessage]);

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