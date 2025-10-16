"use client";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis";
import {
  MANIFOLD_NETWORK,
  MEMES_CONTRACT,
  MEMES_MANIFOLD_PROXY_CONTRACT,
  NULL_MERKLE,
} from "@/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { DateTime } from "luxon";
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
  const zone = "America/New_York";

  const base = DateTime.fromJSDate(mintDate.toDate()).setZone(zone);

  const toUtc = (hour: number, minute: number): Time =>
    Time.seconds(base.set({ hour, minute, second: 0 }).toUTC().toSeconds());

  const toUtcNextDay = (hour: number, minute: number): Time =>
    Time.seconds(
      base
        .plus({ days: 1 })
        .set({ hour, minute, second: 0 })
        .toUTC()
        .toSeconds()
    );

  return [
    {
      id: "0",
      name: "Phase 0 (Allowlist)",
      type: ManifoldPhase.ALLOWLIST,
      start: toUtc(10, 40),
      end: toUtc(11, 20),
    },
    {
      id: "1",
      name: "Phase 1 (Allowlist)",
      type: ManifoldPhase.ALLOWLIST,
      start: toUtc(11, 30),
      end: toUtc(11, 50),
    },
    {
      id: "2",
      name: "Phase 2 (Allowlist)",
      type: ManifoldPhase.ALLOWLIST,
      start: toUtc(12, 0),
      end: toUtc(12, 20),
    },
    {
      id: "public",
      name: "Public Phase",
      type: ManifoldPhase.PUBLIC,
      start: toUtc(12, 20),
      end: toUtcNextDay(10, 0),
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
    (phase: ManifoldPhase, start: number, end: number) => {
      if (!areEqualAddresses(contract, MEMES_CONTRACT)) {
        return undefined;
      }

      if (phase === ManifoldPhase.PUBLIC) {
        return MEME_PHASES.find((mp) => mp.id === "public");
      }

      return MEME_PHASES.filter((mp) => mp.end >= Time.seconds(end))[0];
    },
    []
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
