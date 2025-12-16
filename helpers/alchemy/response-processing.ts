import type {
  AlchemyContractMetadata,
  AlchemyContractMetadataResponse,
  AlchemyContractResult,
  AlchemyNftMedia,
  AlchemyOwnedNft,
  AlchemySearchResponse,
  AlchemyTokenMetadataEntry,
  AlchemyTokenMetadataResponse,
} from "@/services/alchemy/types";
import {
  extractContract,
  normaliseAddress,
  pickThumbnail,
  resolveOpenSeaMetadata,
} from "@/services/alchemy/utils";
import type { ContractOverview, Suggestion, TokenMetadata } from "@/types/nft";

export { normaliseAddress };

export type SearchContractsResult = {
  items: Suggestion[];
  hiddenCount: number;
  nextPageKey?: string;
};

export function processSearchResponse(
  payload: AlchemySearchResponse | undefined,
  hideSpam: boolean
): SearchContractsResult {
  const contracts = payload?.contracts ?? [];
  const suggestions = contracts
    .map((contract) => extractContract(contract))
    .filter((suggestion): suggestion is Suggestion => suggestion !== null);
  const hiddenCount = hideSpam
    ? suggestions.filter((suggestion) => suggestion.isSpam).length
    : 0;
  const visibleItems = hideSpam
    ? suggestions.filter((suggestion) => !suggestion.isSpam)
    : suggestions;
  return {
    items: visibleItems,
    hiddenCount,
    nextPageKey: payload?.pageKey,
  };
}

export function processContractMetadataResponse(
  payload: AlchemyContractMetadataResponse | undefined,
  checksum: `0x${string}`
): ContractOverview | null {
  if (!payload) {
    return null;
  }
  const baseMeta: AlchemyContractMetadata = payload.contractMetadata ?? payload;
  const openSeaMetadata = resolveOpenSeaMetadata(
    payload,
    payload.contractMetadata,
    baseMeta
  );
  const contract: AlchemyContractResult = {
    ...baseMeta,
    contractMetadata: baseMeta,
    address: checksum,
    contractAddress: checksum,
    openSeaMetadata,
    isSpam: payload.isSpam ?? baseMeta.isSpam ?? baseMeta.spamInfo?.isSpam,
  };
  const suggestion = extractContract(contract);
  if (!suggestion) {
    return null;
  }
  return {
    ...suggestion,
    description: openSeaMetadata?.description ?? null,
    bannerImageUrl: openSeaMetadata?.bannerImageUrl ?? null,
  };
}

export type OwnerNft = {
  tokenId: string;
  tokenType: string | null;
  name: string | null;
  tokenUri: string | null;
  image: AlchemyNftMedia | null;
};

export function processOwnerNftsResponse(
  ownedNfts: AlchemyOwnedNft[]
): OwnerNft[] {
  return ownedNfts.map((nft) => ({
    tokenId: nft.tokenId ?? "",
    tokenType: nft.tokenType ?? null,
    name: nft.name ?? null,
    tokenUri: nft.tokenUri ?? null,
    image: nft.image ?? null,
  }));
}

function parseTokenIdToBigint(tokenId: string): bigint {
  if (!tokenId) {
    throw new Error("Token ID missing");
  }
  const trimmed = tokenId.trim();
  return BigInt(trimmed);
}

function normaliseTokenMetadata(
  token: AlchemyTokenMetadataEntry
): TokenMetadata | null {
  const tokenIdRaw = token.tokenId ?? "";
  try {
    const tokenId = parseTokenIdToBigint(tokenIdRaw);
    const imageUrl = pickThumbnail({
      image: token.image ?? undefined,
      media: token.media ?? undefined,
    });
    return {
      tokenId,
      tokenIdRaw,
      contract: token.contract?.address ?? undefined,
      name:
        token.title ??
        token.name ??
        token.metadata?.name ??
        token.raw?.metadata?.name ??
        null,
      imageUrl,
      collectionName:
        token.collection?.name ??
        token.contract?.openSeaMetadata?.collectionName ??
        token.contract?.name ??
        null,
      isSpam: token.isSpam ?? token.spamInfo?.isSpam ?? false,
    };
  } catch {
    return null;
  }
}

export function processTokenMetadataResponse(
  payload: AlchemyTokenMetadataResponse
): TokenMetadata[] {
  const tokens = payload.tokens ?? payload.nfts ?? [];
  const results: TokenMetadata[] = [];
  for (const token of tokens) {
    const normalised = normaliseTokenMetadata(token);
    if (normalised) {
      results.push(normalised);
    }
  }
  return results;
}
