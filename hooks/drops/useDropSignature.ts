"use client";

import { useState, useContext } from "react";
import { useSignMessage } from "wagmi";
import { UserRejectedRequestError } from "viem";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { DropHasher } from "@/utils/drop-hasher";
import { AuthContext } from "@/components/auth/Auth";
import {
  buildDropSignatureMessage,
  isStructuredSignaturesEnabled,
} from "@/services/wallet-signatures/structured-wallet-signatures";

const DROP_SIGNATURE_FAILED_MESSAGE =
  "Signature failed. Make sure your wallet is connected and unlocked, and that you are using the wallet linked to your 6529 account. If it still fails, log out of 6529 and log back in, then try again.";

const isUserRejectedSigningError = (error: unknown): boolean => {
  try {
    if (error instanceof UserRejectedRequestError) {
      return true;
    }
  } catch {
    // Fall through to shape-based checks for cross-realm wallet errors.
  }

  if (error === null || error === undefined || typeof error !== "object") {
    return false;
  }

  const errorObject = error as Record<string, unknown>;
  return (
    errorObject["name"] === "UserRejectedRequestError" ||
    errorObject["code"] === 4001 ||
    errorObject["code"] === "4001"
  );
};

/**
 * Hook for hashing drop data and requesting user signature
 * @returns Object with signDrop function and loading state
 */
export const useDropSignature = () => {
  const [isLoading, setIsLoading] = useState(false);
  const signMessage = useSignMessage();
  const { setToast } = useContext(AuthContext);

  /**
   * Hashes drop data and requests user signature
   * @param params - Object containing drop request and terms of service
   * @returns Object with success status and signature if successful
   */
  const signDrop = async ({
    drop,
    termsOfService,
  }: {
    drop: ApiCreateDropRequest;
    termsOfService: string | null;
  }): Promise<{
    success: boolean;
    signature?: string | undefined;
    signatureMessage?: string | undefined;
  }> => {
    try {
      setIsLoading(true);

      const dropHasher = new DropHasher();
      const hash = dropHasher.hash({
        drop,
        termsOfService,
      });
      if (isStructuredSignaturesEnabled() && !drop.signer_address) {
        setToast({
          message: DROP_SIGNATURE_FAILED_MESSAGE,
          type: "error",
        });
        return { success: false };
      }
      const structuredMessage =
        isStructuredSignaturesEnabled() && drop.signer_address
          ? buildDropSignatureMessage({
              address: drop.signer_address,
              drop,
              termsOfService,
            }).message
          : null;

      const clientSignature = await getSignature({
        message: structuredMessage ?? hash,
      });

      if (clientSignature.userRejected) {
        setToast({
          message: "Signature request was canceled in your wallet.",
          type: "error",
        });
        return { success: false };
      }

      if (!clientSignature.signature) {
        setToast({
          message: DROP_SIGNATURE_FAILED_MESSAGE,
          type: "error",
        });
        return { success: false };
      }

      return {
        success: true,
        signature: clientSignature.signature,
        ...(structuredMessage ? { signatureMessage: structuredMessage } : {}),
      };
    } catch (error) {
      setToast({
        type: "error",
        title: "Couldn't sign this drop.",
        description: "Check your wallet and try again.",
        details: getToastErrorDetails(error),
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper function to sign a message
   * @param params - Object containing the message to sign
   * @returns Object with signature and user rejection status
   */
  const getSignature = async ({
    message,
  }: {
    message: string;
  }): Promise<{
    signature: string | null;
    userRejected: boolean;
  }> => {
    try {
      const signedMessage = await signMessage.signMessageAsync({
        message,
      });
      return {
        signature: signedMessage,
        userRejected: false,
      };
    } catch (e) {
      return {
        signature: null,
        userRejected: isUserRejectedSigningError(e),
      };
    }
  };

  return {
    signDrop,
    isLoading,
  };
};
