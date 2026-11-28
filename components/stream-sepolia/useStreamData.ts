"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Address, Hex } from "viem";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getStreamClient } from "@/lib/stream/client";
import { getStreamInstance } from "@/lib/stream/instances";
import {
  listSales,
  readClaimable,
  readEdition,
  readOneOfOne,
  readWorkArt,
  readWorkMeta,
  type SaleSummary,
} from "@/lib/stream/reads";
import { isTestWork } from "@/lib/stream/showcase";
import { readMyCollections } from "@/lib/stream/activity";
import { readSaleTerms } from "@/lib/stream/saleTerms";

import { formatSpan } from "./format";
import { findStartableItems, readStartPreview, type PendingStart } from "@/lib/stream/startFile";

// Read once on the client: switching instance reloads the page.
const KEY = [QueryKey.STREAM_SEPOLIA, getStreamInstance().name] as const;
/** Live sales change by the block (12 s on Sepolia). */
const LIVE_REFRESH_MS = 15_000;

export function useSales() {
  return useQuery({
    queryKey: [...KEY, "sales"],
    queryFn: listSales,
    // The list only needs to follow the chain loosely; work pages poll by the block.
    refetchInterval: 30_000,
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
      readWorkArt({
        token: args.token,
        tokenId: args.tokenId,
        meta: meta.data!,
        firstStartTx: args.firstStartTx,
        curated: args.curated,
      }),
    enabled: !!meta.data,
    staleTime: Infinity,
  });
  return { meta, art };
}

/** Inside the closing window (or just past the end) the page reads every block. */
const CLOSING_REFRESH_MS = 4_000;

function nearEnd(endTime: bigint | undefined, windowSeconds: number): boolean {
  if (endTime === undefined) return false;
  const left = Number(endTime) - chainNowSeconds();
  return left <= windowSeconds && left > -120;
}

export function useOneOfOne(token: Address, tokenId: bigint) {
  return useQuery({
    queryKey: [...KEY, "oneOfOne", token.toLowerCase(), tokenId.toString()],
    queryFn: () => readOneOfOne(token, tokenId),
    refetchInterval: (query) =>
      nearEnd(query.state.data?.auction.endTime, query.state.data?.extensionWindow ?? 0)
        ? CLOSING_REFRESH_MS
        : LIVE_REFRESH_MS,
  });
}

export function useEdition(token: Address, tokenId: bigint) {
  return useQuery({
    queryKey: [...KEY, "edition", token.toLowerCase(), tokenId.toString()],
    queryFn: () => readEdition(token, tokenId),
    refetchInterval: (query) =>
      nearEnd(query.state.data?.endTimes.endTime, query.state.data?.sale.terms.softWindow ?? 0)
        ? CLOSING_REFRESH_MS
        : LIVE_REFRESH_MS,
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

/** Seconds the chain's latest block time is ahead of this device's clock. */
let chainOffsetSeconds = 0;

function recordChainTime(blockSeconds: number): void {
  chainOffsetSeconds = blockSeconds - Date.now() / 1000;
}

function chainNowSeconds(): number {
  return Math.floor(Date.now() / 1000 + chainOffsetSeconds);
}

/**
 * Keeps the countdown on the chain's time: the contracts decide "ended" by
 * block time, so a visitor's fast or slow clock must not.
 */
function useChainClock() {
  return useQuery({
    queryKey: [...KEY, "chainClock"],
    queryFn: async () => {
      const block = await getStreamClient().getBlock({ blockTag: "latest" });
      recordChainTime(Number(block.timestamp));
      return Number(block.timestamp);
    },
    refetchInterval: 12_000,
  });
}

/** Chain time in Unix seconds, ticking once a second, for countdowns. */
export function useNow(): number {
  useChainClock();
  const [now, setNow] = useState(chainNowSeconds);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(chainNowSeconds()), 1000);
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

/** The 1/1 auction's terms on this instance (length, extension, bid step, opening bid), read live. */
export function useSaleTerms() {
  return useQuery({
    queryKey: [...KEY, "saleTerms"],
    queryFn: readSaleTerms,
    staleTime: 10 * 60_000,
  });
}

export function usePendingStarts() {
  return useQuery({
    queryKey: [...KEY, "pendingStarts"],
    queryFn: findStartableItems,
    refetchInterval: 30_000,
  });
}

export function useStartPreview(start: PendingStart) {
  return useQuery({
    queryKey: [...KEY, "startPreview", start.itemHash],
    queryFn: () => readStartPreview(start),
    staleTime: Infinity,
  });
}

/** How long after its 1/1 an edition sale closes, formatted, or null until read. */
export function useEditionCloseOffset(curated: boolean): string | null {
  const locale = useBrowserLocale();
  const terms = useSaleTerms();
  if (!terms.data) return null;
  return formatSpan(terms.data.editionCloseOffset[curated ? "curated" : "independent"], locale);
}

/**
 * Splits works into the main grids and "Test tokens" (no art, or an operator's
 * test name), from the same metadata and art queries the cards use. A work is
 * placed once both have answered.
 */
export function useShowcase(sales: readonly SaleSummary[]): {
  readonly shown: SaleSummary[];
  readonly tests: SaleSummary[];
} {
  const metas = useQueries({
    queries: sales.map((sale) => ({
      queryKey: [...KEY, "meta", sale.token.toLowerCase(), sale.tokenId.toString()],
      queryFn: () => readWorkMeta(sale.token, sale.tokenId),
      staleTime: 60_000,
    })),
  });
  const arts = useQueries({
    queries: sales.map((sale, index) => {
      const meta = metas[index]?.data;
      return {
        queryKey: [...KEY, "art", sale.token.toLowerCase(), sale.tokenId.toString()],
        queryFn: () =>
          readWorkArt({ token: sale.token, tokenId: sale.tokenId, meta: meta!, firstStartTx: sale.firstStartTx, curated: sale.curated }),
        enabled: !!meta,
        staleTime: Infinity,
      };
    }),
  });
  const shown: SaleSummary[] = [];
  const tests: SaleSummary[] = [];
  sales.forEach((sale, index) => {
    const meta = metas[index]?.data;
    const art = arts[index];
    if (!meta || !art || art.isPending) return;
    (isTestWork({ name: meta.name, hasArt: !!art.data }) ? tests : shown).push(sale);
  });
  return { shown, tests };
}
