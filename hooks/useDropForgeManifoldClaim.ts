"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { MANIFOLD_LAZY_CLAIM_CONTRACT } from "@/constants/constants";
import {
  ManifoldClaimReadMethod,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";

interface UseDropForgeManifoldClaimOptions {
  onError?: () => void;
  readMethod?: ManifoldClaimReadMethod;
  contract?: string;
  chainId?: number;
}

export function useDropForgeManifoldClaim(
  tokenId: number,
  options?: UseDropForgeManifoldClaimOptions
) {
  const { chain, contract } = useDropForgeMintingConfig();
  const readMethod = options?.readMethod ?? "getClaim";
  const effectiveContract = options?.contract ?? contract;
  const effectiveChainId = options?.chainId ?? chain.id;

  return useManifoldClaim({
    chainId: effectiveChainId,
    contract: effectiveContract,
    proxy: MANIFOLD_LAZY_CLAIM_CONTRACT,
    abi: MEMES_MANIFOLD_PROXY_ABI,
    identifier: tokenId,
    ...(options?.onError ? { onError: options.onError } : {}),
    readMethod,
  });
}
