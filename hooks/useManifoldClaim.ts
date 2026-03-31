"use client";

import { useCallback, useEffect, useState } from "react";
import { mainnet } from "viem/chains";
import { useReadContract } from "wagmi";
import { wallTimeToUtcInstantInZone } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MEMES_CONTRACT,
  NULL_ADDRESS,
  NULL_MERKLE,
} from "@/constants/constants";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import { areEqualAddresses } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { getMemesMintingRoots } from "@/services/api/memes-minting-claims-api";
import { isAddress, type Abi } from "viem";

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

type MemesRootsState =
  | {
      status: "idle" | "loading" | "error";
      roots: null;
    }
  | {
      status: "success";
      roots: MintingClaimsRootItem[];
    };

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

const ACTIVE_CLAIM_REFETCH_INTERVAL_MS = 5000;
const INACTIVE_CLAIM_REFETCH_INTERVAL_MS = 10000;
const UINT_256_MAX = (1n << 256n) - 1n;

function parseUnknownBigInt(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return null;
    }
    return BigInt(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      return BigInt(trimmed);
    } catch {
      return null;
    }
  }

  return null;
}

function toValidatedAddress(value: unknown): `0x${string}` {
  if (typeof value === "string" && isAddress(value)) {
    return value as `0x${string}`;
  }
  return NULL_ADDRESS;
}

function toValidatedMerkleRoot(value: unknown): `0x${string}` {
  if (typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value)) {
    return value as `0x${string}`;
  }
  return NULL_MERKLE;
}

function toValidatedTokenId(value: unknown): number {
  const parsed = parseUnknownBigInt(value);
  if (
    parsed === null ||
    parsed < 0n ||
    parsed > UINT_256_MAX ||
    parsed > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return 0;
  }
  return Number(parsed);
}

function normalizePhaseName(value: string): string {
  return value.replaceAll(/\s+/g, "").toLowerCase();
}

function normalizeHexValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function getMemePhaseIdForRootPhase(
  phase: string | null | undefined
): string | undefined {
  const normalizedPhase = normalizePhaseName(phase ?? "");

  if (normalizedPhase === "phase0") {
    return "0";
  }

  if (normalizedPhase === "phase1") {
    return "1";
  }

  if (normalizedPhase === "phase2") {
    return "2";
  }

  if (normalizedPhase === "publicphase" || normalizedPhase === "public") {
    return "public";
  }

  return undefined;
}

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
  identifier: number;
  instanceId: number;
  location: string;
  total: number;
  totalMax: number;
  remaining: number;
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
  nextMemePhase?: MemePhase | undefined;
  isFetching: boolean;
  isFinalized: boolean;
  isDropComplete: boolean;
  isSoldOut: boolean;
  isError: boolean;
}

type ManifoldClaimReadMethod = "getClaimForToken" | "getClaim";
interface UseManifoldClaimResult {
  claim: ManifoldClaim | undefined;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
}

interface UseManifoldClaimParams {
  chainId: number;
  contract: string;
  proxy: string;
  abi: Abi;
  identifier: number;
  onError?: () => void;
}

function buildClaimFromReadData({
  data,
  readMethod,
  identifier,
  getStatus,
  getMemePhase,
  getNextMemePhase,
}: {
  readonly data: unknown;
  readonly readMethod: ManifoldClaimReadMethod;
  readonly identifier: number;
  readonly getStatus: (start: number, end: number) => ManifoldClaimStatus;
  readonly getMemePhase: (
    phase: ManifoldPhase,
    merkleRoot: `0x${string}` | undefined,
    start: number,
    end: number
  ) => MemePhase | undefined;
  readonly getNextMemePhase: (
    memePhase: MemePhase | undefined,
    start: number
  ) => MemePhase | undefined;
}): ManifoldClaim | undefined {
  const readData = data as any;
  const claimData =
    readMethod === "getClaimForToken"
      ? (readData.claim ?? readData[1])
      : readData;

  if (!claimData) {
    return undefined;
  }

  const instanceId =
    readMethod === "getClaimForToken"
      ? Number(readData.instanceId ?? readData[0] ?? identifier)
      : identifier;
  const startDate = Number(claimData.startDate ?? 0);
  const endDate = Number(claimData.endDate ?? 0);
  const costRaw = parseUnknownBigInt(claimData.cost);
  const costWei = costRaw !== null && costRaw >= 0n ? costRaw : 0n;
  const merkleRoot = toValidatedMerkleRoot(claimData.merkleRoot);
  const tokenId = toValidatedTokenId(claimData.tokenId);
  const paymentReceiver = toValidatedAddress(claimData.paymentReceiver);
  const erc20 = toValidatedAddress(claimData.erc20);
  const signingAddress = toValidatedAddress(claimData.signingAddress);
  const status = getStatus(startDate, endDate);
  const publicMerkle = areEqualAddresses(NULL_MERKLE, merkleRoot);
  const phase = publicMerkle ? ManifoldPhase.PUBLIC : ManifoldPhase.ALLOWLIST;
  const memePhase = getMemePhase(phase, merkleRoot, startDate, endDate);
  const nextMemePhase = getNextMemePhase(memePhase, startDate);
  const remaining = Number(claimData.totalMax) - Number(claimData.total);
  const isSoldOut = remaining <= 0;
  const isFinalized = isSoldOut || status === ManifoldClaimStatus.ENDED;
  const isDropComplete =
    isSoldOut || (status === ManifoldClaimStatus.ENDED && !nextMemePhase);

  return {
    identifier,
    instanceId,
    location: String(claimData.location ?? ""),
    total: Number(claimData.total),
    totalMax: Number(claimData.totalMax),
    remaining,
    costWei,
    walletMax: Number(claimData.walletMax ?? 0),
    storageProtocol: Number(claimData.storageProtocol ?? 0),
    merkleRoot,
    tokenId,
    paymentReceiver,
    erc20,
    signingAddress,
    startDate,
    endDate,
    status,
    phase,
    memePhase,
    nextMemePhase,
    isFetching: false,
    isFinalized,
    isDropComplete,
    isSoldOut,
    isError: false,
  };
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
  const [refetchInterval, setRefetchInterval] = useState<number>(
    ACTIVE_CLAIM_REFETCH_INTERVAL_MS
  );
  const [memesRootsState, setMemesRootsState] = useState<MemesRootsState>({
    status: "idle",
    roots: null,
  });

  const getStatus = useCallback((start: number, end: number) => {
    const now = Time.now().toSeconds();
    if (now < start) {
      return ManifoldClaimStatus.UPCOMING;
    } else if (now >= start && now < end) {
      return ManifoldClaimStatus.ACTIVE;
    }
    return ManifoldClaimStatus.ENDED;
  }, []);

  const getScheduledMemePhase = useCallback(
    (phase: ManifoldPhase, start: number, end: number) => {
      const memePhases = buildMemesPhases(Time.seconds(start));

      if (phase === ManifoldPhase.PUBLIC) {
        return memePhases.find((mp) => mp.id === "public");
      }

      const endTime = Time.seconds(end);
      return memePhases.find((mp) => mp.end.gte(endTime));
    },
    []
  );

  const getMemePhase = useCallback(
    (
      phase: ManifoldPhase,
      merkleRoot: `0x${string}` | undefined,
      start: number,
      end: number
    ) => {
      if (!areEqualAddresses(contract, MEMES_CONTRACT)) {
        return undefined;
      }

      const memePhases = buildMemesPhases(Time.seconds(start));
      const scheduledPhase = getScheduledMemePhase(phase, start, end);

      if (phase === ManifoldPhase.PUBLIC) {
        return memePhases.find((mp) => mp.id === "public");
      }

      if (
        memesRootsState.status !== "success" ||
        memesRootsState.roots.length === 0
      ) {
        return scheduledPhase;
      }

      const matchedRoot = memesRootsState.roots.find(
        (root) =>
          normalizeHexValue(root.merkle_root) === normalizeHexValue(merkleRoot)
      );
      const phaseId = getMemePhaseIdForRootPhase(matchedRoot?.phase);

      if (!phaseId) {
        return scheduledPhase;
      }

      return (
        memePhases.find((memePhase) => memePhase.id === phaseId) ??
        scheduledPhase
      );
    },
    [contract, getScheduledMemePhase, memesRootsState]
  );

  const getNextMemePhase = useCallback(
    (memePhase: MemePhase | undefined, start: number) => {
      if (!memePhase || !areEqualAddresses(contract, MEMES_CONTRACT)) {
        return undefined;
      }

      const memePhases = buildMemesPhases(Time.seconds(start));
      const currentPhaseIndex = memePhases.findIndex(
        (phase) => phase.id === memePhase.id
      );

      if (currentPhaseIndex === -1) {
        return undefined;
      }

      return memePhases[currentPhaseIndex + 1];
    },
    [contract]
  );

  const shouldFetchForIdentifier =
    claim?.identifier !== identifier || !claim?.isDropComplete;

  const readContract = useReadContract({
    address: proxy as `0x${string}`,
    abi,
    query: {
      enabled:
        !!contract &&
        !!proxy &&
        !!abi &&
        identifier >= 0 &&
        shouldFetchForIdentifier,
      refetchInterval: refetchInterval,
    },
    chainId,
    functionName: readMethod,
    args: [contract, identifier],
  });

  useEffect(() => {
    setClaim(undefined);
    setRefetchInterval(ACTIVE_CLAIM_REFETCH_INTERVAL_MS);
  }, [chainId, contract, proxy, identifier, readMethod]);

  useEffect(() => {
    if (!areEqualAddresses(contract, MEMES_CONTRACT) || identifier < 0) {
      setMemesRootsState({
        status: "idle",
        roots: null,
      });
      return;
    }

    let isMounted = true;
    setMemesRootsState({
      status: "loading",
      roots: null,
    });

    getMemesMintingRoots(identifier)
      .then((roots) => {
        if (!isMounted) {
          return;
        }

        setMemesRootsState({
          status: "success",
          roots: Array.isArray(roots) ? roots : [],
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setMemesRootsState({
          status: "error",
          roots: null,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [contract, identifier]);

  useEffect(() => {
    if (!readContract.data) {
      return;
    }

    const newClaim = buildClaimFromReadData({
      data: readContract.data,
      readMethod,
      identifier,
      getStatus,
      getMemePhase,
      getNextMemePhase,
    });

    if (!newClaim) {
      return;
    }

    setClaim(newClaim);
    setRefetchInterval(
      newClaim.status === ManifoldClaimStatus.ACTIVE
        ? ACTIVE_CLAIM_REFETCH_INTERVAL_MS
        : INACTIVE_CLAIM_REFETCH_INTERVAL_MS
    );
  }, [
    readContract.data,
    readMethod,
    identifier,
    getMemePhase,
    getNextMemePhase,
    getStatus,
  ]);

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
