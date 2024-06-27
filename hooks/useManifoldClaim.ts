import { useReadContract } from "wagmi";
import { NULL_MERKLE } from "../constants";
import { useEffect, useState } from "react";
import { areEqualAddresses } from "../helpers/Helpers";

export enum ManifoldClaimStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  EXPIRED = "expired",
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
  const [claim, setClaim] = useState<ManifoldClaim>();

  function getStatus(start: number, end: number) {
    const now = Date.now() / 1000;
    if (now < start) {
      return ManifoldClaimStatus.UPCOMING;
    } else if (now > start && now < end) {
      return ManifoldClaimStatus.ACTIVE;
    }
    return ManifoldClaimStatus.EXPIRED;
  }

  const readContract = useReadContract({
    address: proxy as `0x${string}`,
    abi,
    query: {
      enabled:
        !!contract && !!proxy && !!abi && tokenId >= 0 && !claim?.isFinalized,
      refetchInterval: 5000,
    },
    chainId: 1,
    functionName: "getClaimForToken",
    args: [contract, tokenId],
  });

  useEffect(() => {
    const data = readContract.data as any;
    console.log("i am data", data);
    if (data) {
      const instanceId = Number(data[0]);
      const claim = data[1];
      // claim.startDate = 1719319078;
      // claim.endDate = 1719419078;
      const status = getStatus(claim.startDate, claim.endDate);
      const publicMerkle = areEqualAddresses(NULL_MERKLE, claim.merkleRoot);
      const phase = publicMerkle
        ? ManifoldPhase.PUBLIC
        : ManifoldPhase.ALLOWLIST;
      const remaining =
        phase === ManifoldPhase.PUBLIC && status === ManifoldClaimStatus.EXPIRED
          ? 0
          : Number(claim.totalMax) - Number(claim.total);
      setClaim({
        instanceId: instanceId,
        total: Number(claim.total),
        totalMax: Number(claim.totalMax),
        remaining: remaining,
        cost: Number(claim.cost),
        startDate: Number(claim.startDate),
        endDate: Number(claim.endDate),
        status: status,
        phase: phase,
        isFetching: false,
        isFinalized: remaining === 0,
      });
    }
  }, [readContract.data]);

  useEffect(() => {
    if (readContract.error && onError) {
      onError();
    }
  }, [readContract.error]);

  useEffect(() => {
    if (claim) {
      setClaim({
        ...claim,
        isFetching: readContract.isFetching,
      });
    }
  }, [readContract.isFetching]);

  return claim;
}
