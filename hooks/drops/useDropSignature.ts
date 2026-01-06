"use client";

import { useState, useContext } from "react";
import { useSignMessage } from "wagmi";
import { UserRejectedRequestError } from "viem";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { DropHasher } from "@/utils/drop-hasher";
import { AuthContext } from "@/components/auth/Auth";

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
  }): Promise<{ success: boolean; signature?: string | undefined }> => {
    try {
      setIsLoading(true);

      // Create hash of drop data
      const dropHasher = new DropHasher();
      const hash = dropHasher.hash({
        drop,
        termsOfService,
      });

      // Request user to sign the hash
      const clientSignature = await getSignature({ message: hash });

      if (clientSignature.userRejected) {
        setToast({
          message: "Authentication rejected",
          type: "error",
        });
        return { success: false };
      }

      if (!clientSignature.signature) {
        setToast({
          message: "Error requesting authentication, please try again",
          type: "error",
        });
        return { success: false };
      }

      return { success: true, signature: clientSignature.signature };
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
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
        userRejected: e instanceof UserRejectedRequestError,
      };
    }
  };

  return {
    signDrop,
    isLoading,
  };
};
