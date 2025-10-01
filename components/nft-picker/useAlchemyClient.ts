"use client";

import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  ContractOverview,
  Suggestion,
  SupportedChain,
  TokenMetadata,
} from "./NftPicker.types";
import {
  getContractOverview,
  getTokensMetadata,
  searchNftCollections,
} from "@/services/alchemy-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

import type {
  SearchContractsResult,
  TokenMetadataParams,
} from "@/services/alchemy-api";

const SUGGESTION_TTL = 60_000;
const CONTRACT_TTL = 5 * 60_000;
const TOKEN_TTL = 60_000;

type CacheEntry<T> = {
  data: T;
  expires: number;
};

const suggestionCache = new Map<string, CacheEntry<SearchContractsResult>>();
const contractCache = new Map<string, CacheEntry<ContractOverview | null>>();
const tokenCache = new Map<string, CacheEntry<TokenMetadata[]>>();

function gcExpired<T>(map: Map<string, CacheEntry<T>>, now = Date.now()): void {
  map.forEach((entry, key) => {
    if (entry.expires <= now) {
      map.delete(key);
    }
  });
}

function getSuggestionCacheKey(
  query: string,
  chain: SupportedChain,
  hideSpam: boolean
): string {
  return `${chain}:${hideSpam ? "1" : "0"}:${query.toLowerCase()}`;
}

function getContractCacheKey(
  address: `0x${string}`,
  chain: SupportedChain
): string {
  return `${chain}:${address.toLowerCase()}`;
}

function getTokenCacheKey(params: TokenMetadataParams): string {
  const ids = [...params.tokenIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return `${params.chain ?? "ethereum"}:${params.address.toLowerCase()}:${ids.join("|")}`;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

type UseCollectionSearchParams = {
  readonly query: string;
  readonly chain?: SupportedChain;
  readonly hideSpam?: boolean;
  readonly debounceMs?: number;
  readonly enabled?: boolean;
};

type UseContractOverviewParams = {
  readonly address?: `0x${string}`;
  readonly chain?: SupportedChain;
  readonly enabled?: boolean;
};

type UseTokenMetadataParams = {
  readonly address?: `0x${string}`;
  readonly tokenIds: readonly string[];
  readonly chain?: SupportedChain;
  readonly enabled?: boolean;
};

export function useCollectionSearch({
  query,
  chain = "ethereum",
  hideSpam = true,
  debounceMs = 250,
  enabled = true,
}: UseCollectionSearchParams) {
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey: [QueryKey.NFT_PICKER_SEARCH, chain, debouncedQuery, hideSpam],
    enabled: enabled && Boolean(debouncedQuery),
    staleTime: SUGGESTION_TTL,
    gcTime: SUGGESTION_TTL,
    queryFn: async ({ signal }) => {
      const cacheKey = getSuggestionCacheKey(
        debouncedQuery,
        chain,
        hideSpam
      );
      const now = Date.now();
      gcExpired(suggestionCache, now);
      const cached = suggestionCache.get(cacheKey);
      if (cached && cached.expires > now) {
        return cached.data;
      }
      const data = await searchNftCollections({
        query: debouncedQuery,
        chain,
        hideSpam,
        signal,
      });
      suggestionCache.set(cacheKey, { data, expires: now + SUGGESTION_TTL });
      return data;
    },
  });

  useEffect(() => {
    if (!debouncedQuery) {
      return;
    }
    const cacheKey = getSuggestionCacheKey(debouncedQuery, chain, hideSpam);
    const cached = suggestionCache.get(cacheKey);
    if (cached) {
      queryClient.setQueryData(
        [QueryKey.NFT_PICKER_SEARCH, chain, debouncedQuery, hideSpam],
        cached.data
      );
    }
  }, [chain, debouncedQuery, hideSpam, queryClient]);

  return {
    ...result,
    debouncedQuery,
  };
}

export function useContractOverviewQuery({
  address,
  chain = "ethereum",
  enabled = true,
}: UseContractOverviewParams) {
  const normalizedAddress = useMemo(() => {
    if (!address) {
      return undefined;
    }
    return address.toLowerCase() as `0x${string}`;
  }, [address]);

  return useQuery({
    queryKey: [QueryKey.NFT_PICKER_CONTRACT, chain, normalizedAddress],
    enabled: enabled && Boolean(normalizedAddress),
    staleTime: CONTRACT_TTL,
    gcTime: CONTRACT_TTL,
    queryFn: async ({ signal }) => {
      if (!normalizedAddress) {
        return null;
      }
      const cacheKey = getContractCacheKey(normalizedAddress, chain);
      const now = Date.now();
      gcExpired(contractCache, now);
      const cached = contractCache.get(cacheKey);
      if (cached && cached.expires > now) {
        return cached.data;
      }
      const data = await getContractOverview({
        address: normalizedAddress,
        chain,
        signal,
      });
      contractCache.set(cacheKey, { data, expires: now + CONTRACT_TTL });
      return data;
    },
  });
}

export function useTokenMetadataQuery({
  address,
  tokenIds,
  chain = "ethereum",
  enabled = true,
}: UseTokenMetadataParams) {
  const uniqueIds = useMemo(() => {
    const seen = new Set<string>();
    const deduped: string[] = [];
    tokenIds.forEach((id) => {
      if (!seen.has(id)) {
        seen.add(id);
        deduped.push(id);
      }
    });
    return deduped;
  }, [tokenIds]);

  const params = useMemo(() => {
    if (!address || uniqueIds.length === 0) {
      return undefined;
    }
    return {
      address,
      tokenIds: uniqueIds,
      chain,
    } satisfies TokenMetadataParams;
  }, [address, uniqueIds, chain]);

  return useQuery({
    queryKey: [
      QueryKey.NFT_PICKER_TOKENS,
      chain,
      address?.toLowerCase(),
      uniqueIds,
    ],
    enabled: enabled && Boolean(params),
    placeholderData: keepPreviousData,
    staleTime: TOKEN_TTL,
    gcTime: TOKEN_TTL,
    queryFn: async ({ signal }) => {
      if (!params) {
        return [] as TokenMetadata[];
      }
      const cacheKey = getTokenCacheKey(params);
      const now = Date.now();
      gcExpired(tokenCache, now);
      const cached = tokenCache.get(cacheKey);
      if (cached && cached.expires > now) {
        return cached.data;
      }
      const data = await getTokensMetadata({
        ...params,
        signal,
      });
      tokenCache.set(cacheKey, { data, expires: now + TOKEN_TTL });
      return data;
    },
  });
}

export function primeContractCache(
  suggestion: Suggestion,
  chain: SupportedChain = "ethereum"
) {
  const cacheKey = getContractCacheKey(suggestion.address, chain);
  contractCache.set(cacheKey, {
    data: {
      ...suggestion,
      description: null,
      bannerImageUrl: null,
    },
    expires: Date.now() + CONTRACT_TTL,
  });
}
