import { useReadContract } from "wagmi";
import { NULL_MERKLE } from "../constants";
import { useCallback, useEffect, useState } from "react";
import { areEqualAddresses } from "../helpers/Helpers";
import { mainnet } from "viem/chains";

export const MANIFOLD_NETWORK = mainnet;

export enum ManifoldClaimStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  ENDED = "ended",
}

export enum ManifoldPhase {
  ALLOWLIST = "Allowlist",
  PUBLIC = "Public Phase",
}

export interface ManifoldClaim {
  instanceId: number;
  total: number;
  totalMax: number;
  remaining: number;
  cost: number;
  startDate: number;
  endDate: number;
  status: ManifoldClaimStatus;
  phase: ManifoldPhase;
  isFetching: boolean;
  isFinalized: boolean;
}

export default function useManifoldClaim(
  contract: string,
  proxy: string,
  abi: any,
  tokenId: number,
  onError?: () => void
) {
  const [claim, setClaim] = useState<ManifoldClaim | undefined>();
  const [refetchInterval, setRefetchInterval] = useState<number>(5000);

  const getStatus = useCallback((start: number, end: number) => {
    const now = Date.now() / 1000;
    if (now < start) {
      return ManifoldClaimStatus.UPCOMING;
    } else if (now > start && now < end) {
      return ManifoldClaimStatus.ACTIVE;
    }
    return ManifoldClaimStatus.ENDED;
  }, []);

  const readContract = useReadContract({
    address: proxy as `0x${string}`,
    abi,
    query: {
      enabled:
        !!contract && !!proxy && !!abi && tokenId >= 0 && !claim?.isFinalized,
      refetchInterval: refetchInterval,
    },
    chainId: MANIFOLD_NETWORK.id,
    functionName: "getClaimForToken",
    args: [contract, tokenId],
  });

  useEffect(() => {
    if (readContract.data) {
      const data = readContract.data as any;
      const instanceId = Number(data[0]);
      const claimData = data[1];
      const status = getStatus(claimData.startDate, claimData.endDate);
      const publicMerkle = areEqualAddresses(NULL_MERKLE, claimData.merkleRoot);
      const phase =
        publicMerkle && claimData.total > 0
          ? ManifoldPhase.PUBLIC
          : ManifoldPhase.ALLOWLIST;
      const remaining =
        phase === ManifoldPhase.PUBLIC && status === ManifoldClaimStatus.ENDED
          ? 0
          : Number(claimData.totalMax) - Number(claimData.total);
      const newClaim: ManifoldClaim = {
        instanceId: instanceId,
        total: Number(claimData.total),
        totalMax: Number(claimData.totalMax),
        remaining: remaining,
        cost: Number(claimData.cost),
        startDate: Number(claimData.startDate),
        endDate: Number(claimData.endDate),
        status: status,
        phase: phase,
        isFetching: false,
        isFinalized: remaining === 0,
      };
      setClaim(newClaim);
      setRefetchInterval(status === ManifoldClaimStatus.ACTIVE ? 5000 : 10000);
    }
  }, [readContract.data, getStatus]);

  useEffect(() => {
    if (readContract.error && onError) {
      onError();
    }
  }, [readContract.error, onError]);

  useEffect(() => {
    setClaim((prevClaim) => {
      if (prevClaim) {
        return {
          ...prevClaim,
          isFetching: readContract.isFetching,
        };
      }
    });
  }, [readContract.isFetching]);

  return claim;
}
