"use client";

import { useCallback } from "react";
import { useChainId, useSignTypedData } from "wagmi";
import { UserRejectedRequestError } from "viem";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type {
  ProfileCmsPublishTypedData,
  ProfileCmsSignTypedData,
  ProfileCmsSignTypedDataResult,
} from "@/lib/profile-cms/builder/publish";

type ProfileCmsPublishSigner = {
  readonly signTypedData: ProfileCmsSignTypedData;
  readonly chainId: number;
  readonly signerAddress: string | undefined;
  readonly isConnected: boolean;
  readonly isSafe: boolean;
};

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
 * Wallet signer for the Profile CMS publish EIP-712 typed data. Wraps wagmi's
 * useSignTypedData so the orchestration in lib/profile-cms/builder/publish.ts
 * stays wallet-agnostic and unit-testable. Reports Safe/contract wallets via
 * the existing SeizeConnect Safe detection so the publish request can set
 * is_safe_signature and, when known, verifyingContract.
 */
export function useProfileCmsPublishSign(): ProfileCmsPublishSigner {
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const { address, isConnected, isSafeWallet } = useSeizeConnectContext();

  const signTypedData = useCallback<ProfileCmsSignTypedData>(
    async (
      typedData: ProfileCmsPublishTypedData
    ): Promise<ProfileCmsSignTypedDataResult> => {
      try {
        // viem encodes EIP-712 uint256 fields as bigint and addresses as
        // `0x`-prefixed hex; ethers on the backend encodes the same numeric
        // values from plain numbers, so the signable hash is identical.
        const { message, domain } = typedData;
        const signature = await signTypedDataAsync({
          domain: {
            name: domain.name,
            version: domain.version,
            chainId: domain.chainId,
            ...(domain.verifyingContract
              ? {
                  verifyingContract: domain.verifyingContract as `0x${string}`,
                }
              : {}),
          },
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: {
            ...message,
            version: BigInt(message.version),
            deadline: BigInt(message.deadline),
          },
        });
        return { ok: true, signature };
      } catch (error) {
        return { ok: false, rejected: isUserRejectedSigningError(error) };
      }
    },
    [signTypedDataAsync]
  );

  return {
    signTypedData,
    chainId,
    signerAddress: address,
    isConnected,
    isSafe: isSafeWallet,
  };
}
