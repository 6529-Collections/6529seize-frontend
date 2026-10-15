import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  fetchTokenUriMetadata,
  getTokenUriMetadataUrl,
} from "@/services/alchemy/token-uri";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import type {
  SupportedChain,
  TokenMetadata,
} from "@/components/nft-picker/types";
import { EMPTY_METADATA_MAP } from "../utils";
import type { TokenWindowEntry } from "../types";

type TokenMetadataWindowParams = Readonly<{
  contractAddress?: `0x${string}` | undefined;
  chain: SupportedChain | null;
  windowTokens: TokenWindowEntry[];
}>;

export function useTokenMetadataWindow({
  contractAddress,
  chain,
  windowTokens,
}: TokenMetadataWindowParams) {
  const decimalTokenIds = useMemo(
    () => windowTokens.map((token) => token.decimalId),
    [windowTokens]
  );
  const canLoadMetadata = Boolean(
    contractAddress && chain && decimalTokenIds.length > 0
  );

  const metadataQuery = useTokenMetadataQuery({
    address: contractAddress,
    chain: chain ?? undefined,
    tokenIds: decimalTokenIds,
    enabled: canLoadMetadata,
  });

  const missingArtwork = useMemo(
    () =>
      canLoadMetadata
        ? (metadataQuery.data ?? []).filter(
            (entry): entry is TokenMetadata & { tokenUri: string } =>
              !entry.imageUrl &&
              typeof entry.tokenUri === "string" &&
              Boolean(getTokenUriMetadataUrl(entry.tokenUri))
          )
        : [],
    [canLoadMetadata, metadataQuery.data]
  );
  const originalMetadata = useQueries({
    queries: missingArtwork.map((entry) => ({
      queryKey: [QueryKey.NFT_TOKEN_METADATA, "token-uri", entry.tokenUri],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchTokenUriMetadata(entry.tokenUri, signal),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  });

  const metadataMap = useMemo(() => {
    if (!canLoadMetadata) {
      return EMPTY_METADATA_MAP;
    }

    const entries = metadataQuery.data ?? [];
    if (!entries.length) {
      return EMPTY_METADATA_MAP;
    }

    const map = new Map<string, TokenMetadata>();
    for (const entry of entries) {
      // Store by raw and decimal string IDs to support either lookup format
      map.set(entry.tokenIdRaw, entry);
      map.set(entry.tokenId.toString(10), entry);
    }
    missingArtwork.forEach((entry, index) => {
      const original = originalMetadata[index]?.data;
      if (!original) {
        return;
      }
      const isPlaceholderName =
        !entry.name || entry.name === `#${entry.tokenId}`;
      const recovered = {
        ...entry,
        imageUrl: original.imageUrl ?? entry.imageUrl,
        name: isPlaceholderName ? (original.name ?? entry.name) : entry.name,
      };
      map.set(entry.tokenIdRaw, recovered);
      map.set(entry.tokenId.toString(10), recovered);
    });
    return map;
  }, [metadataQuery.data, canLoadMetadata, missingArtwork, originalMetadata]);

  return { metadataQuery, metadataMap };
}
