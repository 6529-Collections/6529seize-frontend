"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis";
import { wallTimeToUtcInstantInZone } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MANIFOLD_NETWORK,
  MEMES_CONTRACT,
  MEMES_MANIFOLD_PROXY_CONTRACT,
  NULL_MERKLE,
} from "@/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { useCallback, useEffect, useState } from "react";
import { useReadContract } from "wagmi";

export enum ManifoldClaimStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  ENDED = "ended",
}

export enum ManifoldPhase {
  ALLOWLIST = "Allowlist",
  PUBLIC = "Public Phase",
}

export interface MemePhase {
  id: string;
  name: string;
  type: ManifoldPhase;
  start: Time;
  end: Time;
}

export function buildMemesPhases(mintDate: Time): MemePhase[] {
  return [
    {
      id: "0",
      name: "Phase 0 (Allowlist)",
      type: ManifoldPhase.ALLOWLIST,
      start: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 17, 40).toISOString()
      ),
      end: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 18, 20).toISOString()
      ),
    },
    {
      id: "1",
      name: "Phase 1 (Allowlist)",
      type: ManifoldPhase.ALLOWLIST,
      start: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 18, 30).toISOString()
      ),
      end: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 18, 50).toISOString()
      ),
    },
    {
      id: "2",
      name: "Phase 2 (Allowlist)",
      type: ManifoldPhase.ALLOWLIST,
      start: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 19, 0).toISOString()
      ),
      end: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 19, 20).toISOString()
      ),
    },
    {
      id: "public",
      name: "Public Phase",
      type: ManifoldPhase.PUBLIC,
      start: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 19, 20).toISOString()
      ),
      end: Time.fromString(
        wallTimeToUtcInstantInZone(mintDate.toDate(), 17, 0).toISOString()
      ),
    },
  ];
}

const MEME_PHASES = buildMemesPhases(Time.now());

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
  memePhase?: MemePhase;
  isFetching: boolean;
  isFinalized: boolean;
  isSoldOut: boolean;
}

export function useManifoldClaim(
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

  const getMemePhase = useCallback(
    (phase: ManifoldPhase, end: number) => {
      if (!areEqualAddresses(contract, MEMES_CONTRACT)) {
        return undefined;
      }

      if (phase === ManifoldPhase.PUBLIC) {
        return MEME_PHASES.find((mp) => mp.id === "public");
      }

      const endTime = Time.seconds(end);
      return MEME_PHASES.filter((mp) => mp.end.gte(endTime))[0];
    },
    [contract]
  );

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
      const memePhase = getMemePhase(phase, claimData.endDate);
      const remaining = Number(claimData.totalMax) - Number(claimData.total);
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
        memePhase: memePhase,
        isFetching: false,
        isFinalized: remaining === 0 || status === ManifoldClaimStatus.ENDED,
        isSoldOut: remaining <= 0,
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

export function useMemesManifoldClaim(tokenId: number, onError?: () => void) {
  return useManifoldClaim(
    MEMES_CONTRACT,
    MEMES_MANIFOLD_PROXY_CONTRACT,
    MEMES_MANIFOLD_PROXY_ABI,
    tokenId,
    onError
  );
}
