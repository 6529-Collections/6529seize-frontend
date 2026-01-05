"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type {
  AlchemyContractMetadataResponse,
  AlchemyGetNftsForOwnerResponse,
  AlchemySearchResponse,
  AlchemyTokenMetadataResponse,
  OwnerNft,
  SearchContractsResult,
} from "@/services/alchemy/types";
import {
  normaliseAddress,
  processContractMetadataResponse,
  processOwnerNftsResponse,
  processSearchResponse,
  processTokenMetadataResponse,
} from "@/services/alchemy/utils";
import type {
  ContractOverview,
  Suggestion,
  SupportedChain,
  TokenMetadata,
} from "@/types/nft";

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

function getBackendAlchemyProxyUrl(path: string): string {
  return `${publicEnv.API_ENDPOINT}/alchemy-proxy${path}`;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  return false;
}

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchJsonWithFailover<T>(
  primaryUrl: string,
  backendPath: string,
  init?: RequestInit
): Promise<T> {
  try {
    return await fetchJson<T>(primaryUrl, init);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    const backendUrl = getBackendAlchemyProxyUrl(backendPath);
    console.warn(
      `Failed to fetch from primary endpoint (${primaryUrl}), falling back to proxy endpoint: (${backendUrl})`
    );
    return fetchJson<T>(backendUrl, init);
  }
}

type TokenMetadataParams = {
  readonly address?: `0x${string}` | undefined;
  readonly tokenIds?: readonly string[] | undefined;
  readonly tokens?: readonly { contract: string; tokenId: string }[] | undefined;
  readonly chain?: SupportedChain | undefined;
  readonly signal?: AbortSignal | undefined;
};

async function fetchCollectionsFromApi(
  params: UseCollectionSearchParams & { readonly signal?: AbortSignal | undefined }
): Promise<SearchContractsResult> {
  const { query, chain = "ethereum", hideSpam = true, signal } = params;
  const search = new URLSearchParams();
  search.set("query", query);
  search.set("chain", chain);
  const queryString = search.toString();

  const payload = await fetchJsonWithFailover<AlchemySearchResponse>(
    `/api/alchemy/collections?${queryString}`,
    `/collections?${queryString}`,
    { ...(signal !== undefined ? { signal: signal } : {}) }
  );

  return processSearchResponse(payload, hideSpam);
}

async function fetchContractOverviewFromApi(
  params: UseContractOverviewParams & { readonly signal?: AbortSignal | undefined }
): Promise<ContractOverview | null> {
  const { address, chain = "ethereum", signal } = params;
  if (!address) {
    return null;
  }

  const checksum = normaliseAddress(address);
  if (!checksum) {
    return null;
  }

  const search = new URLSearchParams();
  search.set("address", address);
  search.set("chain", chain);
  const queryString = search.toString();

  const payload = await fetchJsonWithFailover<
    (AlchemyContractMetadataResponse & { _checksum?: string | undefined }) | null
  >(`/api/alchemy/contract?${queryString}`, `/contract?${queryString}`, {
    ...(signal !== undefined ? { signal: signal } : {}),
  });

  if (!payload) {
    return null;
  }

  const checksumFromResponse = (payload._checksum ?? checksum) as `0x${string}`;
  return processContractMetadataResponse(payload, checksumFromResponse);
}

async function fetchTokenMetadataFromApi(
  params: TokenMetadataParams
): Promise<TokenMetadata[]> {
  const body = JSON.stringify({
    address: params.address,
    tokenIds: params.tokenIds,
    tokens: params.tokens,
    chain: params.chain ?? "ethereum",
  });
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: params.signal ?? null,
  };

  const payload = await fetchJsonWithFailover<AlchemyTokenMetadataResponse>(
    "/api/alchemy/token-metadata",
    "/token-metadata",
    init
  );

  return processTokenMetadataResponse(payload);
}

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
  if (params.tokens) {
    const sortedTokens = [...params.tokens].sort((a, b) => {
      const contractCompare = a.contract.localeCompare(b.contract);
      if (contractCompare !== 0) {
        return contractCompare;
      }
      return a.tokenId.localeCompare(b.tokenId);
    });
    const key = sortedTokens
      .map((t) => `${t.contract.toLowerCase()}:${t.tokenId}`)
      .join("|");
    return `${params.chain ?? "ethereum"}:${key}`;
  }

  const address = params.address ?? "0x";
  const tokenIds = params.tokenIds ?? [];

  const ids = [...tokenIds].sort((a, b) => {
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  });
  return `${params.chain ?? "ethereum"}:${address.toLowerCase()}:${ids.join(
    "|"
  )}`;
}

type UseCollectionSearchParams = {
  readonly query: string;
  readonly chain?: SupportedChain | undefined;
  readonly hideSpam?: boolean | undefined;
  readonly debounceMs?: number | undefined;
  readonly enabled?: boolean | undefined;
};

type UseContractOverviewParams = {
  readonly address?: `0x${string}` | undefined;
  readonly chain?: SupportedChain | undefined;
  readonly enabled?: boolean | undefined;
};

type UseTokenMetadataParams = {
  readonly address?: `0x${string}` | undefined;
  readonly tokenIds?: readonly string[] | undefined;
  readonly tokens?: readonly { contract: string; tokenId: string }[] | undefined;
  readonly chain?: SupportedChain | undefined;
  readonly enabled?: boolean | undefined;
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
    queryKey: [QueryKey.NFT_COLLECTION_SEARCH, chain, debouncedQuery, hideSpam],
    enabled: enabled && Boolean(debouncedQuery),
    staleTime: SUGGESTION_TTL,
    gcTime: SUGGESTION_TTL,
    queryFn: async ({ signal }) => {
      const cacheKey = getSuggestionCacheKey(debouncedQuery, chain, hideSpam);
      const now = Date.now();
      gcExpired(suggestionCache, now);
      const cached = suggestionCache.get(cacheKey);
      if (cached && cached.expires > now) {
        return cached.data;
      }
      const data = await fetchCollectionsFromApi({
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
    const now = Date.now();
    gcExpired(suggestionCache, now);
    const cached = suggestionCache.get(cacheKey);
    if (cached && cached.expires > now) {
      queryClient.setQueryData(
        [QueryKey.NFT_COLLECTION_SEARCH, chain, debouncedQuery, hideSpam],
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
    queryKey: [QueryKey.NFT_CONTRACT_OVERVIEW, chain, normalizedAddress],
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
      const data = await fetchContractOverviewFromApi({
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
  tokens,
  chain = "ethereum",
  enabled = true,
}: UseTokenMetadataParams) {
  const uniqueIds = useMemo(() => {
    if (!tokenIds) return [];
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const id of tokenIds) {
      if (!seen.has(id)) {
        seen.add(id);
        deduped.push(id);
      }
    }
    return deduped;
  }, [tokenIds]);

  const params = useMemo(() => {
    if (tokens && tokens.length > 0) {
      return {
        tokens,
        chain,
      } satisfies TokenMetadataParams;
    }
    if (!address || uniqueIds.length === 0) {
      return undefined;
    }
    return {
      address,
      tokenIds: uniqueIds,
      chain,
    } satisfies TokenMetadataParams;
  }, [address, uniqueIds, tokens, chain]);

  return useQuery({
    queryKey: [
      QueryKey.NFT_TOKEN_METADATA,
      chain,
      address?.toLowerCase(),
      QueryKey.NFT_TOKEN_METADATA,
      chain,
      address?.toLowerCase(),
      uniqueIds,
      tokens,
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
      const data = await fetchTokenMetadataFromApi({
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

export async function fetchOwnerNfts(
  chainId: number,
  contract: string,
  owner: string,
  signal?: AbortSignal
): Promise<OwnerNft[]> {
  const search = new URLSearchParams();
  search.set("chainId", String(chainId));
  search.set("contract", contract);
  search.set("owner", owner);
  const queryString = search.toString();

  const payload = await fetchJsonWithFailover<AlchemyGetNftsForOwnerResponse>(
    `/api/alchemy/owner-nfts?${queryString}`,
    `/owner-nfts?${queryString}`,
    { ...(signal !== undefined ? { signal: signal } : {}) }
  );

  return processOwnerNftsResponse(payload.ownedNfts ?? []);
}
