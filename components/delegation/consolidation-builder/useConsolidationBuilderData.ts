"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import { fetchUrl } from "@/services/6529api";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useReadContracts } from "wagmi";
import {
  getLinkStatusReadParams,
  getRegisteredLinkKeys,
} from "./consolidation-contract";
import {
  parseConsolidationGroup,
  type ConsolidationGroups,
} from "./consolidation-groups";

const LINK_STATUS_REFETCH_INTERVAL_MS = 15_000;
const GROUP_STALE_TIME_MS = 30_000;

function getConsolidationGroupQueryKey(wallet: string) {
  return [QueryKey.CONSOLIDATION_GROUP, wallet] as const;
}

function combineGroupResults(results: UseQueryResult<string[]>[]) {
  return {
    data: results.map((result) => result.data),
    isPending: results.some((result) => result.isPending),
    isError: results.some((result) => result.isError),
  };
}

/**
 * Current consolidation of each wallet from the 6529 API. Wallets are
 * lowercased keys; the map only contains wallets whose lookup succeeded.
 */
export function useConsolidationGroups(wallets: readonly string[]) {
  const combined = useQueries({
    queries: wallets.map((wallet) => ({
      queryKey: getConsolidationGroupQueryKey(wallet),
      queryFn: async () =>
        parseConsolidationGroup(
          await fetchUrl(
            `${publicEnv.API_ENDPOINT}/api/consolidations/${wallet}`
          )
        ),
      staleTime: GROUP_STALE_TIME_MS,
      refetchOnWindowFocus: false,
    })),
    combine: combineGroupResults,
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
      refetchInterval: LINK_STATUS_REFETCH_INTERVAL_MS,
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
