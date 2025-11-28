"use client";

import { useEffect, useMemo, useState } from "react";

import type { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import type { TokenMetadata } from "@/types/nft";

type TokenMetadataMap = Map<string, TokenMetadata>;

export interface UseXtdhTokenMetadataMapResult {
  readonly metadataMap: TokenMetadataMap;
  readonly isFetching: boolean;
  readonly hasError: boolean;
}

export function useXtdhTokenMetadataMap(
  contractAddress: `0x${string}` | null,
  tokens: ApiXTdhTokensPage["data"],
): UseXtdhTokenMetadataMapResult {
  const [metadataMap, setMetadataMap] = useState<TokenMetadataMap>(new Map());

  useEffect(() => {
    setMetadataMap(new Map());
  }, [contractAddress]);

  const tokenIds = useMemo(() => {
    if (!tokens.length) {
      return [] as string[];
    }
    return tokens
      .map((token) => token.token)
      .filter((tokenId) => typeof tokenId === "number" && Number.isFinite(tokenId))
      .map((tokenId) => Math.trunc(tokenId).toString());
  }, [tokens]);

  const missingTokenIds = useMemo(() => {
    if (!tokenIds.length) {
      return [];
    }
    const missing: string[] = [];
    for (const tokenId of tokenIds) {
      if (!metadataMap.has(tokenId)) {
        missing.push(tokenId);
      }
    }
    return missing;
  }, [tokenIds, metadataMap]);

  const metadataQuery = useTokenMetadataQuery({
    address: contractAddress ?? undefined,
    tokenIds: missingTokenIds,
    enabled: Boolean(contractAddress && missingTokenIds.length > 0),
  });

  useEffect(() => {
    const entries = metadataQuery.data;
    if (!entries || entries.length === 0) {
      return;
    }
    setMetadataMap((previous) => {
      const next = new Map(previous);
      for (const entry of entries) {
        const decimalKey = entry.tokenId.toString(10);
        next.set(decimalKey, entry);
        if (entry.tokenIdRaw) {
          next.set(entry.tokenIdRaw, entry);
          next.set(entry.tokenIdRaw.toLowerCase(), entry);
        }
      }
      return next;
    });
  }, [metadataQuery.data]);

  return {
    metadataMap,
    isFetching: metadataQuery.isFetching,
    hasError: metadataQuery.isError,
  };
}
