"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import { fetchUrl } from "@/services/6529api";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useReadContracts } from "wagmi";
import {
  getLinkStatusReadParams,
  getManagedWalletKeys,
  getManagerStatusReadParams,
  getRegisteredLinkKeys,
} from "./consolidation-contract";
import {
  parseConsolidationGroup,
  type ConsolidationGroups,
} from "./consolidation-groups";
import {
  getFreshLinkKeys,
  parseConsolidationRows,
} from "./consolidation-registrations";

const REFETCH_INTERVAL_MS = 15_000;
const GROUP_STALE_TIME_MS = 30_000;

type ConsolidationRows = ReturnType<typeof parseConsolidationRows>;

function combineResults<T>(results: UseQueryResult<T>[]) {
  return {
    data: results.map((result) => result.data),
    isPending: results.some((result) => result.isPending),
    // A failed refetch keeps the last data, so only a lookup without data
    // counts as an error.
    isError: results.some(
      (result) => result.isError && result.data === undefined
    ),
  };
}

/**
 * Current consolidation of each wallet from the 6529 API. Wallets are
 * lowercased keys; the map only contains wallets whose lookup succeeded.
 */
export function useConsolidationGroups(wallets: readonly string[]) {
  const combined = useQueries({
    queries: wallets.map((wallet) => ({
      queryKey: [QueryKey.CONSOLIDATION_GROUP, wallet],
      queryFn: async () =>
        parseConsolidationGroup(
          await fetchUrl(
            `${publicEnv.API_ENDPOINT}/api/consolidations/${wallet}`
          )
        ),
      staleTime: GROUP_STALE_TIME_MS,
      refetchOnWindowFocus: false,
    })),
    combine: combineResults<string[]>,
  });

  const groups = useMemo<ConsolidationGroups>(() => {
    const map = new Map<string, readonly string[]>();
    wallets.forEach((wallet, index) => {
      const group = combined.data[index];
      if (group) {
        map.set(wallet, group);
      }
    });
    return map;
  }, [combined.data, wallets]);

  return {
    groups,
    isPending: combined.isPending,
    isError: combined.isError,
  };
}

/**
 * Directed use-case-999 links between the wallets, read on-chain. A
 * direction is registered on Any Collection or The Memes.
 */
export function useConsolidationLinkStatus(wallets: readonly string[]) {
  const contracts = useMemo(() => getLinkStatusReadParams(wallets), [wallets]);
  const reads = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      refetchInterval: REFETCH_INTERVAL_MS,
    },
  });
  const { refetch } = reads;
  const registeredLinkKeys = useMemo(
    () => getRegisteredLinkKeys(wallets, reads.data),
    [reads.data, wallets]
  );
  const refetchLinks = useCallback(() => {
    refetch().catch(() => undefined);
  }, [refetch]);

  return {
    registeredLinkKeys,
    isError:
      reads.isError ||
      reads.data?.some((read) => read.status === "failure") === true,
    refetch: refetchLinks,
  };
}

/**
 * Listed wallets that the connected wallet manages as their Delegation
 * Manager on Any Collection, read on-chain. Undefined while the reads load
 * or after one fails; empty without a connected wallet or other wallets.
 */
export function useConsolidationManagedWallets(
  wallets: readonly string[],
  connectedKey: string | undefined
) {
  const candidates = useMemo(
    () =>
      connectedKey ? wallets.filter((wallet) => wallet !== connectedKey) : [],
    [connectedKey, wallets]
  );
  const contracts = useMemo(
    () =>
      connectedKey ? getManagerStatusReadParams(candidates, connectedKey) : [],
    [candidates, connectedKey]
  );
  const reads = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      refetchInterval: REFETCH_INTERVAL_MS,
    },
  });
  const { refetch } = reads;
  const managedWallets = useMemo(() => {
    const keys = getManagedWalletKeys(candidates, reads.data);
    return keys ? new Set(keys) : undefined;
  }, [candidates, reads.data]);
  const hasContracts = contracts.length > 0;
  const refetchManagers = useCallback(() => {
    if (hasContracts) {
      refetch().catch(() => undefined);
    }
  }, [hasContracts, refetch]);

  return {
    managedWallets,
    isError:
      hasContracts &&
      (reads.isError ||
        reads.data?.some((read) => read.status === "failure") === true),
    refetch: refetchManagers,
  };
}

/**
 * Directions between the wallets that 6529 recorded as registered at or
 * after the fourth-slot activation, from each wallet's stored pair rows.
 * Only four-wallet plans need it; pass no wallets otherwise.
 */
export function useConsolidationFreshLinks(
  wallets: readonly string[],
  activationMs: number | null
) {
  const combined = useQueries({
    queries: wallets.map((wallet) => ({
      queryKey: [QueryKey.CONSOLIDATION_REGISTRATIONS, wallet],
      queryFn: async () =>
        parseConsolidationRows(
          await fetchUrl(
            `${publicEnv.API_ENDPOINT}/api/consolidations/${wallet}?show_incomplete=true`
          )
        ),
      refetchInterval: REFETCH_INTERVAL_MS,
      refetchOnWindowFocus: false,
    })),
    combine: combineResults<ConsolidationRows>,
  });

  const freshLinkKeys = useMemo(() => {
    const loaded = combined.data.filter(
      (rows): rows is ConsolidationRows => rows !== undefined
    );
    if (wallets.length === 0) return [];
    return activationMs !== null && loaded.length === combined.data.length
      ? getFreshLinkKeys(loaded, wallets, activationMs)
      : undefined;
  }, [activationMs, combined.data, wallets]);

  return {
    freshLinkKeys,
    isError: combined.isError,
  };
}
