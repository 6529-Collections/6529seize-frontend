"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Address, Hex } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ACTIVE_STREAM_INSTANCE } from "@/lib/stream/instances";
import {
  listSales,
  readClaimable,
  readMyCollections,
  readEdition,
  readOneOfOne,
  readWorkArt,
  readWorkMeta,
} from "@/lib/stream/reads";

const KEY = [QueryKey.STREAM_SEPOLIA, ACTIVE_STREAM_INSTANCE] as const;
/** Live sales change by the block (12 s on Sepolia). */
const LIVE_REFRESH_MS = 15_000;

export function useSales() {
  return useQuery({
    queryKey: [...KEY, "sales"],
    queryFn: listSales,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useWorkMeta(token: Address, tokenId: bigint) {
  return useQuery({
    queryKey: [...KEY, "meta", token.toLowerCase(), tokenId.toString()],
    queryFn: () => readWorkMeta(token, tokenId),
    staleTime: 60_000,
  });
}

export function useWorkArt(args: {
  readonly token: Address;
  readonly tokenId: bigint;
  readonly firstStartTx: Hex | null;
  readonly curated: boolean;
}) {
  const meta = useWorkMeta(args.token, args.tokenId);
  const art = useQuery({
    queryKey: [...KEY, "art", args.token.toLowerCase(), args.tokenId.toString()],
    queryFn: () =>
      readWorkArt({ meta: meta.data!, firstStartTx: args.firstStartTx, curated: args.curated }),
    enabled: !!meta.data,
    staleTime: Infinity,
  });
  return { meta, art };
}

export function useOneOfOne(token: Address, tokenId: bigint) {
  return useQuery({
    queryKey: [...KEY, "oneOfOne", token.toLowerCase(), tokenId.toString()],
    queryFn: () => readOneOfOne(token, tokenId),
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useEdition(token: Address, tokenId: bigint) {
  return useQuery({
    queryKey: [...KEY, "edition", token.toLowerCase(), tokenId.toString()],
    queryFn: () => readEdition(token, tokenId),
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useClaimable(viewer: Address | undefined) {
  return useQuery({
    queryKey: [...KEY, "claimable", viewer?.toLowerCase() ?? ""],
    queryFn: () => readClaimable(viewer!),
    enabled: !!viewer,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

/** Unix seconds, ticking once a second, for countdowns. */
export function useNow(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function useMyCollections(viewer: Address | undefined) {
  return useQuery({
    queryKey: [...KEY, "collections", viewer?.toLowerCase() ?? ""],
    queryFn: () => readMyCollections(viewer!),
    enabled: !!viewer,
  });
}
