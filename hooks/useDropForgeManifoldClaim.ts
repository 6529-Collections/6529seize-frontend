"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { MANIFOLD_LAZY_CLAIM_CONTRACT } from "@/constants/constants";
import { useManifoldClaim } from "@/hooks/useManifoldClaim";

export function useDropForgeManifoldClaim(tokenId: number) {
  const { chain, contract } = useDropForgeMintingConfig();

  return useManifoldClaim({
    chainId: chain.id,
    contract,
    proxy: MANIFOLD_LAZY_CLAIM_CONTRACT,
    abi: MEMES_MANIFOLD_PROXY_ABI,
    identifier: tokenId,
  });
}
