"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { publicEnv } from "@/config/env";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import { useManifoldClaim } from "@/hooks/useManifoldClaim";
import { useMemo } from "react";
import { mainnet, sepolia } from "wagmi/chains";

export const DROP_CONTROL_TESTNET_CONTRACT =
  "0xb491971ba9d757d1b16feba1a019b60d6b74dc20";

export enum DropControlMintingMode {
  MAINNET = "MAINNET",
  TESTNET = "TESTNET",
}

export function useDropControlMintingConfig(): {
  mode: DropControlMintingMode;
  chainId: number;
  contract: string;
} {
  return useMemo(() => {
    const isTestnet = publicEnv.DROP_CONTROL_TESTNET === true;

    if (isTestnet) {
      return {
        mode: DropControlMintingMode.TESTNET,
        chainId: sepolia.id,
        contract: DROP_CONTROL_TESTNET_CONTRACT,
      };
    }

    return {
      mode: DropControlMintingMode.MAINNET,
      chainId: mainnet.id,
      contract: MEMES_CONTRACT,
    };
  }, []);
}

export function useDropControlManifoldClaim(
  tokenId: number,
  onError?: () => void
) {
  const { chainId, contract } = useDropControlMintingConfig();

  return useManifoldClaim(
    contract,
    MANIFOLD_LAZY_CLAIM_CONTRACT,
    MEMES_MANIFOLD_PROXY_ABI,
    tokenId,
    onError,
    chainId,
    "getClaim"
  );
}
