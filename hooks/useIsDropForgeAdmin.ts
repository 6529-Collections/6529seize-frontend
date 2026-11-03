"use client";

import { useReadContracts } from "wagmi";
import { CREATOR_ADMIN_ABI } from "@/components/drop-forge/contract-admins/creator-admin-abi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import { areEqualAddresses } from "@/helpers/Helpers";

// Admin approval changes rarely and the result only gates UI; the contract
// still enforces every write. Cache it instead of polling.
const DROP_FORGE_ADMIN_STALE_TIME_MS = 5 * 60_000;

export function useIsDropForgeAdmin({
  skip = false,
}: {
  /**
   * Skip the on-chain reads when the caller already knows the wallet holds a
   * role that makes the result irrelevant (e.g. it is listed in the app
   * settings). Every flag is then reported as false and nothing is fetched.
   */
  readonly skip?: boolean;
} = {}): {
  isDropForgeAdmin: boolean;
  isDropForgeOwner: boolean;
  isFetching: boolean;
} {
  const { address } = useSeizeConnectContext();
  const { contract, chain } = useDropForgeMintingConfig();
  const isEnabled = Boolean(address) && !skip;
  const contractAddress = contract as `0x${string}`;

  const readResult = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        chainId: chain.id,
        abi: CREATOR_ADMIN_ABI,
        functionName: "owner",
      },
      {
        address: contractAddress,
        chainId: chain.id,
        abi: CREATOR_ADMIN_ABI,
        functionName: "isAdmin",
        args: address ? [address as `0x${string}`] : undefined,
      },
    ],
    query: { enabled: isEnabled, staleTime: DROP_FORGE_ADMIN_STALE_TIME_MS },
  });

  // A failed read must fail closed instead of trusting stale cached data.
  const reads = isEnabled && !readResult.isError ? readResult.data : undefined;
  const [ownerRead, adminRead] = reads ?? [];
  const isOwner =
    ownerRead?.status === "success" &&
    Boolean(ownerRead.result) &&
    areEqualAddresses(ownerRead.result, address);

  return {
    isDropForgeAdmin:
      isOwner || (adminRead?.status === "success" && adminRead.result === true),
    isDropForgeOwner: isOwner,
    isFetching: isEnabled && readResult.isPending,
  };
}
