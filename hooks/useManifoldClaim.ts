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
import type { Abi } from "viem";
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

interface PhaseBoundary {
  hour: number;
  minute: number;
  dayOffset?: number;
}

interface PhaseDefinition {
  id: string;
  name: string;
  type: ManifoldPhase;
  start: PhaseBoundary;
  end: PhaseBoundary;
}

export interface MemePhase {
  id: string;
  name: string;
  type: ManifoldPhase;
  start: Time;
  end: Time;
}

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    id: "0",
    name: "Phase 0 (Allowlist)",
    type: ManifoldPhase.ALLOWLIST,
    start: { hour: 17, minute: 40 },
    end: { hour: 18, minute: 20 },
  },
  {
    id: "1",
    name: "Phase 1 (Allowlist)",
    type: ManifoldPhase.ALLOWLIST,
    start: { hour: 18, minute: 30 },
    end: { hour: 18, minute: 50 },
  },
  {
    id: "2",
    name: "Phase 2 (Allowlist)",
    type: ManifoldPhase.ALLOWLIST,
    start: { hour: 19, minute: 0 },
    end: { hour: 19, minute: 20 },
  },
  {
    id: "public",
    name: "Public Phase",
    type: ManifoldPhase.PUBLIC,
    start: { hour: 19, minute: 20 },
    end: { hour: 17, minute: 0, dayOffset: 1 },
  },
];

export function buildMemesPhases(mintDate: Time = Time.now()): MemePhase[] {
  const resolveTime = ({
    hour,
    minute,
    dayOffset = 0,
  }: PhaseBoundary): Time => {
    const reference = dayOffset === 0 ? mintDate : mintDate.plusDays(dayOffset);
    const instant = wallTimeToUtcInstantInZone(
      reference.toDate(),
      hour,
      minute
    );
    return Time.millis(instant.getTime());
  };

  return PHASE_DEFINITIONS.map(({ start, end, ...phase }) => ({
    ...phase,
    start: resolveTime(start),
    end: resolveTime(end),
  }));
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
  memePhase?: MemePhase;
  isFetching: boolean;
  isFinalized: boolean;
  isSoldOut: boolean;
}

export function useManifoldClaim(
  contract: string,
  proxy: string,
  abi: Abi,
  tokenId: number,
  onError?: () => void
) {
  const [claim, setClaim] = useState<ManifoldClaim | undefined>();
  const [refetchInterval, setRefetchInterval] = useState<number>(5000);

  const getStatus = useCallback((start: number, end: number) => {
    const now = Time.now().toSeconds();
    if (now < start) {
      return ManifoldClaimStatus.UPCOMING;
    } else if (now >= start && now < end) {
      return ManifoldClaimStatus.ACTIVE;
    }
    return ManifoldClaimStatus.ENDED;
  }, []);

  const getMemePhase = useCallback(
    (phase: ManifoldPhase, start: number, end: number) => {
      if (!areEqualAddresses(contract, MEMES_CONTRACT)) {
        return undefined;
      }

      const memePhases = buildMemesPhases(Time.seconds(start));

      if (phase === ManifoldPhase.PUBLIC) {
        return memePhases.find((mp) => mp.id === "public");
      }

      const endTime = Time.seconds(end);
      return memePhases.find((mp) => mp.end.gte(endTime));
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
      const memePhase = getMemePhase(
        phase,
        claimData.startDate,
        claimData.endDate
      );
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
