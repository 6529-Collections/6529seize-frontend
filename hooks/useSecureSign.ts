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
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "MobileSigningError";
  }
}

export class ConnectionMismatchError extends Error {
  constructor(expectedAddress: string, actualAddress?: string) {
    super(
      `Address mismatch: expected ${expectedAddress}, got ${actualAddress || "none"}`
    );
    this.name = "ConnectionMismatchError";
  }
}

export class SigningProviderError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "SigningProviderError";
  }
}

/**
 * SECURITY: Provider validation error for runtime type checking
 */
class ProviderValidationError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "ProviderValidationError";
  }
}

interface SignatureResult {
  signature: string | null;
  userRejected: boolean;
  error?:
    | MobileSigningError
    | ConnectionMismatchError
    | SigningProviderError
    | ProviderValidationError
    | undefined;
}

interface UseSecureSignReturn {
  signMessage: (message: string) => Promise<SignatureResult>;
  isSigningPending: boolean;
  reset: () => void;
}
/**
 * SECURITY: Validate Ethereum address format
 * Ensures address follows proper format and prevents injection
 */
function validateEthereumAddress(address: string): void {
  if (typeof address !== "string") {
    throw new ProviderValidationError("Address must be a string");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new ProviderValidationError("Invalid Ethereum address format");
  }
}

/**
 * SECURITY: Validate message input
 * Ensures message is safe for signing and prevents injection attacks
 */
function validateMessage(message: string): void {
  if (typeof message !== "string") {
    throw new ProviderValidationError("Message must be a string");
  }

  if (message.length === 0) {
    throw new ProviderValidationError("Message cannot be empty");
  }

  if (message.length > 10000) {
    throw new ProviderValidationError(
      "Message too long (max 10000 characters)"
    );
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
      throw new ProviderValidationError("Message contains suspicious content");
    }
  }
}

/**
 * SECURITY: Validate signature format
 * Ensures returned signature follows expected format
 */
function validateSignature(signature: string): void {
  if (typeof signature !== "string") {
    throw new ProviderValidationError("Signature must be a string");
  }

  // Ethereum signatures should be 65 bytes (130 hex chars + 0x prefix)
  if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    throw new ProviderValidationError("Invalid signature format");
  }
}

/**
 * Secure message signing hook with mobile wallet compatibility
 * Uses Wagmi's useSignMessage for proper provider management and security
 * This approach works with all connector types including custom AppWallet connectors
 */
export const useSecureSign = (): UseSecureSignReturn => {
  const [isSigningPending, setIsSigningPending] = useState(false);
  const { address: connectedAddress, isConnected } = useAppKitAccount();
  const wagmiSignMessage = useSignMessage();

  const reset = useCallback(() => {
    setIsSigningPending(false);
  }, []);

  const signMessage = useCallback(
    async (message: string): Promise<SignatureResult> => {
      setIsSigningPending(true);

      try {
        // SECURITY: Input validation - validate message before any processing
        validateMessage(message);

        // Validate connection state before attempting to sign
        validateSigningContext(isConnected, connectedAddress);

        // Execute the signature operation using Wagmi
        return await executeWagmiSignature(wagmiSignMessage, message);
      } catch (error: unknown) {
        return classifySigningError(error);
      } finally {
        setIsSigningPending(false);
      }
    },
    [connectedAddress, isConnected, wagmiSignMessage]
  );

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
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    if ("code" in errorObj) {
      const code = errorObj["code"];
      if (typeof code === "string" || typeof code === "number") {
        return code;
      }
    }
    if ("name" in errorObj && typeof errorObj["name"] === "string") {
      return errorObj["name"];
    }
  }
  return undefined;
};

/**
 * Validates the signing context (connection state and address)
 * Wagmi handles provider management internally
 */
const validateSigningContext = (
  isConnected: boolean,
  connectedAddress: string | undefined
): void => {
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

  validateEthereumAddress(connectedAddress);
};

/**
 * Executes the signature operation using Wagmi's useSignMessage
 * This approach works with all connector types including custom AppWallet connectors
 */
const executeWagmiSignature = async (
  wagmiSignMessage: ReturnType<typeof useSignMessage>,
  message: string
): Promise<SignatureResult> => {
  try {
    const signature = await wagmiSignMessage.signMessageAsync({ message });

    // Clear sensitive data from memory
    message = "";

    // SECURITY: Validate signature format before returning
    validateSignature(signature);

    return {
      signature,
      userRejected: false,
    };
  } catch (error) {
    // Handle user rejection specifically
    // Use multiple detection methods for robustness across different environments
    try {
      if (
        (typeof UserRejectedRequestError !== "undefined" &&
          error instanceof UserRejectedRequestError) ||
        (error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "UserRejectedRequestError")
      ) {
        return {
          signature: null,
          userRejected: true,
        };
      }
    } catch {
      // If instanceof check fails, fall back to name-based detection
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "UserRejectedRequestError"
      ) {
        return {
          signature: null,
          userRejected: true,
        };
      }
    }
    throw error; // Re-throw for general error handling
  }
};

/**
 * Classifies and handles different types of signing errors
 */
const classifySigningError = (error: unknown): SignatureResult => {
  // Handle user rejection (most common case)
  // Use multiple detection methods for robustness across different environments
  try {
    if (
      (typeof UserRejectedRequestError !== "undefined" &&
        error instanceof UserRejectedRequestError) ||
      (error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "UserRejectedRequestError")
    ) {
      return {
        signature: null,
        userRejected: true,
      };
    }
  } catch {
    // If instanceof check fails, fall back to name-based detection
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "UserRejectedRequestError"
    ) {
      return {
        signature: null,
        userRejected: true,
      };
    }
  }

  // Handle custom errors we've defined (use name check for Jest compatibility)
  if (error && typeof error === "object" && "name" in error) {
    const errorName = (error as Error).name;
    if (
      errorName === "MobileSigningError" ||
      errorName === "ConnectionMismatchError" ||
      errorName === "SigningProviderError" ||
      errorName === "ProviderValidationError"
    ) {
      return {
        signature: null,
        userRejected: false,
        error: error as
          | MobileSigningError
          | ConnectionMismatchError
          | SigningProviderError
          | ProviderValidationError,
      };
    }
  }

  // Handle mobile-specific wallet errors with proper type checking
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 4001
  ) {
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
};

/**
 * SECURITY: Get user-friendly error messages with proper type checking
 */
const getMobileErrorMessage = (error: unknown): string => {
  let message: string;

  // SECURITY: Safe message extraction without unsafe casting
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object") {
    // For plain objects, try to get a meaningful representation
    try {
      // Check if it has Object.prototype.toString (plain object)
      if (error.toString === Object.prototype.toString) {
        // Use JSON stringification for plain objects
        message = JSON.stringify(error);
      } else {
        // Use custom toString method (verified above to not be Object.prototype.toString)
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        message = String(error);
      }
    } catch {
      message = "Unknown error";
    }
  } else {
    message = "Unknown error";
  }

  // Sanitize message to prevent any potential injection
  message = message.substring(0, 1000); // Limit length

  // Common mobile wallet error patterns
  if (message.includes("connection") || message.includes("provider")) {
    return "Connection issue with your wallet. Please check your connection and try again.";
  }

  if (message.includes("network") || message.includes("chain")) {
    return "Network issue detected. Please check your wallet network settings.";
  }

  if (message.includes("timeout") || message.includes("time out")) {
    return "Request timed out. Please try again with a stable connection.";
  }

  if (message.includes("unsupported") || message.includes("not supported")) {
    return "This operation is not supported by your current wallet app.";
  }

  // Default fallback for mobile
  return "Signing failed. Please try again or switch to a different wallet app if the issue persists.";
};
