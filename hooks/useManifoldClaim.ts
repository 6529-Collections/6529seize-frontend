"use client";

import { wallTimeToUtcInstantInZone } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MEMES_CONTRACT,
  NULL_ADDRESS,
  NULL_MERKLE,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { useCallback, useEffect, useState } from "react";
import type { Abi } from "viem";
import { mainnet } from "viem/chains";
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
  dayOffset?: number | undefined;
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
  location: string;
  total: number;
  totalMax: number;
  remaining: number;
  cost: number;
  costWei?: bigint | undefined;
  walletMax?: number | undefined;
  storageProtocol?: number | undefined;
  merkleRoot?: `0x${string}` | undefined;
  tokenId?: number | undefined;
  paymentReceiver?: `0x${string}` | undefined;
  erc20?: `0x${string}` | undefined;
  signingAddress?: `0x${string}` | undefined;
  startDate: number;
  endDate: number;
  status: ManifoldClaimStatus;
  phase: ManifoldPhase;
  memePhase?: MemePhase | undefined;
  isFetching: boolean;
  isFinalized: boolean;
  isSoldOut: boolean;
  isError: boolean;
}

export type ManifoldClaimReadMethod = "getClaimForToken" | "getClaim";
export interface UseManifoldClaimResult {
  claim: ManifoldClaim | undefined;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
}

export interface UseManifoldClaimParams {
  chainId: number;
  contract: string;
  proxy: string;
  abi: Abi;
  identifier: number;
  onError?: () => void;
}

export function useManifoldClaim({
  chainId,
  contract,
  proxy,
  abi,
  identifier,
  onError,
}: UseManifoldClaimParams): UseManifoldClaimResult {
  const readMethod: ManifoldClaimReadMethod =
    chainId === mainnet.id ? "getClaimForToken" : "getClaim";
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
        !!contract &&
        !!proxy &&
        !!abi &&
        identifier >= 0 &&
        !claim?.isFinalized,
      refetchInterval: refetchInterval,
    },
    chainId,
    functionName: readMethod,
    args: [contract, identifier],
  });

  useEffect(() => {
    if (readContract.data) {
      const data = readContract.data as any;
      const claimData =
        readMethod === "getClaimForToken" ? (data.claim ?? data[1]) : data;
      if (!claimData) return;
      const instanceId =
        readMethod === "getClaimForToken"
          ? Number(data.instanceId ?? data[0] ?? identifier)
          : identifier;
      const startDate = Number(claimData.startDate ?? 0);
      const endDate = Number(claimData.endDate ?? 0);
      const costWei = BigInt(claimData.cost ?? 0);
      const status = getStatus(startDate, endDate);
      const publicMerkle = areEqualAddresses(NULL_MERKLE, claimData.merkleRoot);
      const phase =
        publicMerkle && claimData.total > 0
          ? ManifoldPhase.PUBLIC
          : ManifoldPhase.ALLOWLIST;
      const memePhase = getMemePhase(phase, startDate, endDate);
      const remaining = Number(claimData.totalMax) - Number(claimData.total);
      const newClaim: ManifoldClaim = {
        instanceId: instanceId,
        location: String(claimData.location ?? ""),
        total: Number(claimData.total),
        totalMax: Number(claimData.totalMax),
        remaining: remaining,
        cost: Number(costWei),
        costWei,
        walletMax: Number(claimData.walletMax ?? 0),
        storageProtocol: Number(claimData.storageProtocol ?? 0),
        merkleRoot: String(
          claimData.merkleRoot ?? NULL_MERKLE
        ) as `0x${string}`,
        tokenId: Number(claimData.tokenId ?? 0),
        paymentReceiver: String(
          claimData.paymentReceiver ?? NULL_ADDRESS
        ) as `0x${string}`,
        erc20: String(claimData.erc20 ?? NULL_ADDRESS) as `0x${string}`,
        signingAddress: String(
          claimData.signingAddress ?? NULL_ADDRESS
        ) as `0x${string}`,
        startDate,
        endDate,
        status: status,
        phase: phase,
        memePhase: memePhase,
        isFetching: false,
        isFinalized: remaining === 0 || status === ManifoldClaimStatus.ENDED,
        isSoldOut: remaining <= 0,
        isError: false,
      };
      setClaim(newClaim);
      setRefetchInterval(status === ManifoldClaimStatus.ACTIVE ? 5000 : 10000);
    }
  }, [readContract.data, readMethod, identifier, getMemePhase, getStatus]);

  useEffect(() => {
    if (readContract.error) {
      setClaim((prevClaim) => {
        if (!prevClaim) return;
        return {
          ...prevClaim,
          isError: true,
        };
      });
      onError?.();
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
      return;
    });
  }, [readContract.isFetching]);

  return {
    claim,
    isFetching: readContract.isFetching,
    refetch: async () => {
      await readContract.refetch();
    },
  };
}
