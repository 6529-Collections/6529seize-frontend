"use client";

import { MEMES_CONTRACT } from "@/constants/constants";
import { useMemo } from "react";
import { useChainId } from "wagmi";
import { Chain, mainnet, sepolia } from "wagmi/chains";

export const DROP_FORGE_TESTNET_CONTRACT =
  "0xb491971ba9d757d1b16feba1a019b60d6b74dc20";

export enum DropForgeMintingMode {
  MAINNET = "MAINNET",
  TESTNET = "TESTNET",
}

export function useDropForgeMintingConfig(): {
  mode: DropForgeMintingMode;
  chain: Chain;
  contract: string;
} {
  const chainId = useChainId();
  const isTestnet = chainId === sepolia.id;

  return useMemo(() => {
    if (isTestnet) {
      return {
        mode: DropForgeMintingMode.TESTNET,
        chain: sepolia,
        contract: DROP_FORGE_TESTNET_CONTRACT,
      };
    }

    return {
      mode: DropForgeMintingMode.MAINNET,
      chain: mainnet,
      contract: MEMES_CONTRACT,
    };
  }, [isTestnet]);
}
