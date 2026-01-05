import { useMemo } from "react";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import type { SupportedChain, TokenMetadata } from "@/components/nft-picker/NftPicker.types";
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
    contractAddress &&
    chain &&
    decimalTokenIds.length > 0
  );

  const metadataQuery = useTokenMetadataQuery({
    address: contractAddress,
    chain: chain ?? undefined,
    tokenIds: decimalTokenIds,
    enabled: canLoadMetadata,
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
    return map;
  }, [metadataQuery.data, canLoadMetadata]);

  return { metadataQuery, metadataMap };
}
