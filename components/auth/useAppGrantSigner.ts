"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { useSignTypedData } from "wagmi";
import { isE2eeSignatureRejection } from "@/components/e2ee/e2eeErrors";
import type { SignAppGrant } from "./authAppSignedMessagesGrant";

type SignTypedDataAsync = ReturnType<
  typeof useSignTypedData
>["signTypedDataAsync"];
type SignTypedDataRequest = Parameters<SignTypedDataAsync>[0];

/**
 * The connected wallet's EIP-712 signature for an app grant (6529 Mobile and
 * Desktop): an app wallet signs locally, WalletConnect wallets get an
 * eth_signTypedData_v4 request. Never throws. Stable across renders.
 */
export function useAppGrantSigner(): SignAppGrant {
  const { signTypedDataAsync } = useSignTypedData();
  const latest = useRef(signTypedDataAsync);

  useLayoutEffect(() => {
    latest.current = signTypedDataAsync;
  }, [signTypedDataAsync]);

  return useCallback<SignAppGrant>(async (typedData) => {
    try {
      // Passed through unchanged so the signed digest is the grant id.
      const signature = await latest.current({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      } as SignTypedDataRequest);
      return { signature };
    } catch (error) {
      return isE2eeSignatureRejection(error)
        ? { userRejected: true }
        : { error };
    }
  }, []);
}
