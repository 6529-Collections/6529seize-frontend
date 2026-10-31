"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useLayoutEffect, useRef } from "react";
import type { Address, Hex } from "viem";
import { usePublicClient, useSignTypedData } from "wagmi";
import { WsMessageType } from "@/helpers/Types";
import type { E2eeApiClient } from "@/lib/e2ee/api";
import type { E2eeEngineDeps } from "@/lib/e2ee/types";
import { useWebSocket } from "@/services/websocket/useWebSocket";
import {
  createE2eeSignatureRejectedError,
  isE2eeSignatureRejection,
} from "./e2eeErrors";
import { getE2eeDeviceLabel } from "./e2eeDeviceLabel";
import { detectE2eePlatform, getE2eeGrantOrigin } from "./e2eePlatform";
import { resolveE2eeProfiles } from "./e2eeProfiles";
import { getE2eeTestSigner } from "./e2eeTestSigner";

/** Content-free wake hints the engine listens to (contract 5). */
export const E2EE_WAKE_MESSAGE_TYPES: readonly WsMessageType[] = [
  WsMessageType.E2EE_GROUP_EVENT,
  WsMessageType.E2EE_WELCOME,
  WsMessageType.E2EE_DEVICE_ADDED,
  WsMessageType.E2EE_DEVICE_REVOKED,
  WsMessageType.E2EE_ROSTER_CHANGED,
];

type SignTypedDataAsync = ReturnType<
  typeof useSignTypedData
>["signTypedDataAsync"];
type SignTypedDataRequest = Parameters<SignTypedDataAsync>[0];
type WebSocketSubscribe = ReturnType<typeof useWebSocket>["subscribe"];
type PublicClient = ReturnType<typeof usePublicClient>;

type TypedDataInput = Parameters<E2eeEngineDeps["signTypedData"]>[0];
type WakeListener = Parameters<NonNullable<E2eeEngineDeps["onWake"]>>[0];

export async function signE2eeTypedData(
  signTypedDataAsync: SignTypedDataAsync,
  typedData: TypedDataInput
): Promise<string> {
  // Local multi-user browser tests only; null outside dev auth on localhost.
  const testSigner = getE2eeTestSigner();
  if (testSigner) {
    return await testSigner(typedData);
  }
  try {
    // The engine builds the exact EIP-712 grant (contract 2.1); pass it
    // through unchanged so the signed digest is the grant id.
    return await signTypedDataAsync({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    } as SignTypedDataRequest);
  } catch (error) {
    if (isE2eeSignatureRejection(error)) {
      throw createE2eeSignatureRejectedError(error);
    }
    throw error;
  }
}

export function subscribeE2eeWakes(
  subscribe: WebSocketSubscribe,
  listener: WakeListener
): () => void {
  const unsubscribers = E2EE_WAKE_MESSAGE_TYPES.map((type) =>
    subscribe<unknown>(type, (data) => {
      listener({ type, data });
    })
  );
  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}

export async function verifyE2eeContractSignature(
  publicClient: PublicClient,
  wallet: string,
  hash: string,
  signature: string
): Promise<boolean> {
  if (!publicClient) {
    // No mainnet RPC: the engine falls back to the server's verified_via.
    throw new Error("E2EE_NO_RPC");
  }
  return await publicClient.verifyHash({
    address: wallet as Address,
    hash: hash as Hex,
    signature: signature as Hex,
  });
}

interface E2eeEngineDepsInput {
  readonly profileId: string;
  readonly wallet: string;
  readonly api: E2eeApiClient;
}

/**
 * Builds the engine's dependencies (contract 12). The returned builder is
 * stable; the functions it hands to the engine always call the latest wallet
 * signer, RPC client, query cache and socket.
 */
export function useE2eeEngineDeps(): (
  input: E2eeEngineDepsInput
) => E2eeEngineDeps {
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient({ chainId: 1 });
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const latest = useRef({
    signTypedDataAsync,
    publicClient,
    queryClient,
    subscribe,
  });

  useLayoutEffect(() => {
    latest.current = {
      signTypedDataAsync,
      publicClient,
      queryClient,
      subscribe,
    };
  }, [signTypedDataAsync, publicClient, queryClient, subscribe]);

  return useCallback(({ profileId, wallet, api }: E2eeEngineDepsInput) => {
    const platform = detectE2eePlatform();
    return {
      profileId,
      wallet,
      origin: getE2eeGrantOrigin(platform),
      platform,
      deviceLabel: getE2eeDeviceLabel(platform),
      api,
      signTypedData: (typedData) =>
        signE2eeTypedData(latest.current.signTypedDataAsync, typedData),
      resolveProfiles: (profileIds) =>
        resolveE2eeProfiles(latest.current.queryClient, profileIds),
      verifyContractSignature: (contractWallet, hash, signature) =>
        verifyE2eeContractSignature(
          latest.current.publicClient,
          contractWallet,
          hash,
          signature
        ),
      onWake: (listener) =>
        subscribeE2eeWakes(latest.current.subscribe, listener),
    };
  }, []);
}
