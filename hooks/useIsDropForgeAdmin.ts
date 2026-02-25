"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useReadContract } from "wagmi";

export function useIsDropForgeAdmin(): {
  isDropForgeAdmin: boolean;
  isFetching: boolean;
} {
  const { address } = useSeizeConnectContext();
  const { contract, chain } = useDropForgeMintingConfig();

  const readResult = useReadContract({
    address: contract as `0x${string}`,
    chainId: chain.id,
    abi: MEMES_MANIFOLD_PROXY_ABI,
    functionName: "owner",
    query: {
      enabled: !!address,
    },
  });

  return {
    isDropForgeAdmin: areEqualAddresses(readResult.data, address),
    isFetching: Boolean(address) && (readResult.isLoading || readResult.isFetching),
  };
}
