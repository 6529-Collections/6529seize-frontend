"use client";

import { useCallback, useEffect, useState } from "react";
import { getAddress, isAddress } from "viem";
import { getWalletAddress, removeAuthJwt } from "@/services/auth/auth.utils";
import { WalletInitializationError } from "@/errors/wallet";
import { SecurityEventType } from "@/types/security";
import {
  createValidationEventContext,
  logError,
  logSecurityEvent,
} from "@/utils/security-logger";
import type { WalletState } from "./seizeConnectTypes";

interface AddressValidationResult {
  isValid: boolean;
  normalizedAddress?: string | undefined;
  errorContext?:
    | {
        length: number;
        format: "hex_prefixed" | "other";
        debugAddress: string;
      }
    | undefined;
}

export const normalizeAddress = (address: string): string =>
  address.toLowerCase();

export const ADD_FLOW_CANCEL_GRACE_MS: number = 5000;
export const CONNECT_AFTER_DISCONNECT_DELAY_MS: number = 100;
export const CONNECT_INTENT_HANDOFF_GRACE_MS: number = 1000;

const validateStoredAddress = (
  storedAddress: string
): AddressValidationResult => {
  if (isAddress(storedAddress)) {
    return {
      isValid: true,
      normalizedAddress: getAddress(storedAddress),
    };
  }

  const addressLength = storedAddress.length;
  const addressFormat = storedAddress.startsWith("0x")
    ? "hex_prefixed"
    : "other";
  const debugAddress =
    storedAddress.length >= 10
      ? storedAddress.slice(0, 10) + "..."
      : storedAddress;

  return {
    isValid: false,
    errorContext: {
      length: addressLength,
      format: addressFormat,
      debugAddress,
    },
  };
};

const clearInvalidStoredAuthState = async (): Promise<void> => {
  try {
    await removeAuthJwt();
  } catch (cleanupError) {
    logError(
      "auth_cleanup_during_init",
      new Error(`Failed to clear invalid auth state: ${cleanupError}`)
    );
  }
};

const handleInitializationError = (
  error: unknown,
  errorContext?: AddressValidationResult["errorContext"]
): WalletInitializationError => {
  if (errorContext) {
    logSecurityEvent(
      SecurityEventType.INVALID_ADDRESS_DETECTED,
      createValidationEventContext(
        "wallet_initialization",
        false,
        errorContext.length,
        errorContext.format
      )
    );

    void clearInvalidStoredAuthState();

    const initError = new WalletInitializationError(
      "Invalid wallet address found in storage during initialization. This indicates potential data corruption or security breach.",
      undefined,
      errorContext.debugAddress
    );
    logError("wallet_initialization", initError);
    return initError;
  }

  const initError = new WalletInitializationError(
    "Unexpected error during wallet initialization",
    error
  );
  logError("wallet_initialization", initError);
  return initError;
};

export const useConsolidatedWalletState = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    status: "initializing",
  });

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const storedAddress: string | null = getWalletAddress();

        if (!storedAddress) {
          setWalletState({ status: "disconnected" });
          return;
        }

        const validationResult = validateStoredAddress(storedAddress);

        if (validationResult.isValid && validationResult.normalizedAddress) {
          setWalletState({
            status: "connected",
            address: validationResult.normalizedAddress,
          });
        } else {
          const error = handleInitializationError(
            undefined,
            validationResult.errorContext
          );
          setWalletState({ status: "error", error });
        }
      } catch (error) {
        const initError = handleInitializationError(error);
        setWalletState({ status: "error", error: initError });
      }
    };

    initializeWallet();
  }, []);

  const setConnecting = useCallback(() => {
    setWalletState({ status: "connecting" });
  }, []);

  const setConnected = useCallback((address: string) => {
    setWalletState({ status: "connected", address });
  }, []);

  const setDisconnected = useCallback(() => {
    setWalletState({ status: "disconnected" });
  }, []);

  const connectedAddress =
    walletState.status === "connected" ? walletState.address : undefined;
  const hasInitializationError = walletState.status === "error";
  const initializationError =
    walletState.status === "error" ? walletState.error : undefined;
  const isInitialized = walletState.status !== "initializing";

  return {
    walletState,
    connectedAddress,
    setConnecting,
    setConnected,
    setDisconnected,
    hasInitializationError,
    initializationError,
    isInitialized,
  };
};
