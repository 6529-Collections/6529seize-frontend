import { useContractRead } from "wagmi";
import { MANIFOLD_PROXY_ABI } from "../abis";
import { MANIFOLD_PROXY } from "../constants";
import { useState } from "react";

export enum ManifoldClaimStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  EXPIRED = "expired",
}

export interface ManifoldClaim {
  instanceId: number;
  total: number;
  totalMax: number;
  cost: number;
  startDate: number;
  endDate: number;
  status: ManifoldClaimStatus;
}

export default function useManifoldClaim(contract: string, tokenId: number) {
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

  useContractRead({
    address: MANIFOLD_PROXY,
    abi: MANIFOLD_PROXY_ABI,
    enabled: !!contract && tokenId >= 0,
    chainId: 1,
    watch: true,
    functionName: "getClaimForToken",
    args: [contract, tokenId],
    onSettled(data: any, error: any) {
      if (data) {
        const instanceId = Number(data[0]);
        const claim = data[1];
        const status = getStatus(claim.startDate, claim.endDate);
        setClaim({
          instanceId: instanceId,
          total: Number(claim.total),
          totalMax: Number(claim.totalMax),
          cost: Number(claim.cost),
          startDate: Number(claim.startDate),
          endDate: Number(claim.endDate),
          status: status,
        });
      }
    },
  });

  return claim;
}
