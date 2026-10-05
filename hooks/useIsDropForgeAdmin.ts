"use client";

import { useReadContract } from "wagmi";
import { CREATOR_ADMIN_ABI } from "@/components/drop-forge/contract-admins/creator-admin-abi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { areEqualAddresses } from "@/helpers/Helpers";

export function useIsDropForgeAdmin(): {
  isDropForgeAdmin: boolean;
  isDropForgeOwner: boolean;
  isFetching: boolean;
} {
  const { address } = useSeizeConnectContext();
  const { contract, chain } = useDropForgeMintingConfig();

  const readResult = useReadContract({
    address: contract as `0x${string}`,
    chainId: chain.id,
    abi: CREATOR_ADMIN_ABI,
    functionName: "owner",
    query: {
      enabled: !!address,
      staleTime: 0,
      refetchInterval: 15000,
    },
  });

  const adminResult = useReadContract({
    address: contract as `0x${string}`,
    chainId: chain.id,
    abi: CREATOR_ADMIN_ABI,
    functionName: "isAdmin",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, staleTime: 0, refetchInterval: 15000 },
  });

  const isOwner =
    Boolean(address) &&
    !readResult.isError &&
    Boolean(readResult.data) &&
    areEqualAddresses(readResult.data, address);

  return {
    isDropForgeAdmin:
      isOwner ||
      (Boolean(address) && !adminResult.isError && adminResult.data === true),
    isDropForgeOwner: isOwner,
    isFetching:
      Boolean(address) && (readResult.isPending || adminResult.isPending),
  };
}
