"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { MANIFOLD_LAZY_CLAIM_CONTRACT } from "@/constants/constants";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useReadContract } from "wagmi";

export function useIsMemesAdmin(): boolean {
  const { address } = useSeizeConnectContext();
  const { data } = useReadContract({
    address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
    abi: MEMES_MANIFOLD_PROXY_ABI,
    functionName: "isAdmin",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });
  return data === true;
}
