import { getAddress } from "viem";

import { isValidEthAddress } from "@/helpers/Helpers";
import type {
  AlchemyContractMetadata,
  AlchemyContractMetadataResponse,
  AlchemyContractResult,
  AlchemyOpenSeaMetadata,
  AlchemyOwnedNft,
  AlchemySearchResponse,
  AlchemyTokenMetadataEntry,
  AlchemyTokenMetadataResponse,
  OwnerNft,
  SearchContractsResult,
} from "./types";
import type { ContractOverview, Suggestion, SupportedChain, TokenMetadata } from "@/types/nft";

const NETWORK_MAP: Record<SupportedChain, string> = {
  ethereum: "eth-mainnet",
};

export function resolveNetwork(chain: SupportedChain = "ethereum"): string {
  return NETWORK_MAP[chain] ?? NETWORK_MAP.ethereum;
}

export function ensureQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Query must not be empty");
  }
  return trimmed;
}

export function toSafelist(
  status: string | null | undefined
): Suggestion["safelist"] {
  if (!status) {
    return undefined;
  }
  if (
    status === "verified" ||
    status === "approved" ||
    status === "requested" ||
    status === "not_requested"
  ) {
    return status;
  }
  return undefined;
}

export function parseFloorPrice(
  meta: AlchemyOpenSeaMetadata | undefined
): number | null {
  if (!meta) {
    return null;
  }
  const { floorPrice } = meta;
  if (typeof floorPrice === "number") {
    return floorPrice;
  }
  if (floorPrice && typeof floorPrice === "object") {
    const candidate = floorPrice.eth;
    if (typeof candidate === "number") {
      return candidate;
    }
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

type OpenSeaMetadataSource = {
  openSeaMetadata?: AlchemyOpenSeaMetadata | null | undefined;
  openseaMetadata?: AlchemyOpenSeaMetadata | null | undefined;
  openSea?: AlchemyOpenSeaMetadata | null | undefined;
  opensea?: AlchemyOpenSeaMetadata | null | undefined;
} | null | undefined;

export function resolveOpenSeaMetadata(
  ...sources: OpenSeaMetadataSource[]
): AlchemyOpenSeaMetadata | undefined {
  for (const source of sources) {
    if (!source) {
      continue;
    }
    const metadata =
      source.openSeaMetadata ??
      source.openseaMetadata ??
      source.openSea ??
      source.opensea;
    if (metadata) {
      return metadata;
    }
  }
  return undefined;
}

export function pickImage(source?: {
  image?: { cachedUrl?: string | null | undefined; thumbnailUrl?: string | null | undefined } | null | undefined;
  imageUrl?: string | null | undefined;
  media?: { thumbnailUrl?: string | null | undefined; gateway?: string | null | undefined }[] | null | undefined;
}): string | null {
  if (!source) {
    return null;
  }
  if (source.imageUrl) {
    return source.imageUrl;
  }
  if (source.image?.cachedUrl) {
    return source.image.cachedUrl;
  }
  if (source.image?.thumbnailUrl) {
    return source.image.thumbnailUrl;
  }
  if (source.media && source.media.length > 0) {
    const mediaItem = source.media.find((item) => item?.thumbnailUrl) ??
      source.media[0];
    if (mediaItem?.thumbnailUrl) {
      return mediaItem.thumbnailUrl;
    }
    if (mediaItem?.gateway) {
      return mediaItem.gateway;
    }
  }
  return null;
}

export function pickThumbnail(source?: {
  image?: { thumbnailUrl?: string | null | undefined; cachedUrl?: string | null | undefined } | null | undefined;
  media?: { thumbnailUrl?: string | null | undefined }[] | null | undefined;
}): string | null {
  if (!source) {
    return null;
  }
  if (source.image?.thumbnailUrl) {
    return source.image.thumbnailUrl;
  }
  if (source.image?.cachedUrl) {
    return source.image.cachedUrl;
  }
  if (source.media && source.media.length > 0) {
    const mediaItem = source.media.find((item) => item?.thumbnailUrl) ??
      source.media[0];
    if (mediaItem?.thumbnailUrl) {
      return mediaItem.thumbnailUrl;
    }
  }
  return null;
}

export function normaliseAddress(
  address?: string | null
): `0x${string}` | null {
  if (!address) {
    return null;
  }
  if (!isValidEthAddress(address)) {
    return null;
  }
  try {
    return getAddress(address);
  } catch (error) {
    console.warn("Failed to checksum address", address, error);
    return address as `0x${string}`;
  }
}

export function extractContract(
  contract: AlchemyContractResult
): Suggestion | null {
  const baseMeta = contract.contractMetadata ?? contract;
  const openSea = resolveOpenSeaMetadata(contract, baseMeta);
  const address =
    normaliseAddress(contract.address ?? contract.contractAddress) ??
    normaliseAddress(baseMeta.address);
  if (!address) {
    return null;
  }
  const name = baseMeta.name ?? openSea?.collectionName ?? undefined;
  const totalSupply = baseMeta.totalSupply ?? undefined;
  const tokenType = baseMeta.tokenType?.toUpperCase() as
    | "ERC721"
    | "ERC1155"
    | undefined;
  const imageUrl = pickImage({
    imageUrl: openSea?.imageUrl ?? undefined,
    image: baseMeta.image,
  });
  const isSpam =
    contract.isSpam ??
    contract.spamInfo?.isSpam ??
    baseMeta.isSpam ??
    baseMeta.spamInfo?.isSpam ??
    false;
  const safelist = toSafelist(openSea?.safelistRequestStatus ?? null);
  const floorPriceEth = parseFloorPrice(openSea ?? undefined);
  const deployer = normaliseAddress(
    contract.contractDeployer ?? baseMeta.contractDeployer ?? null
  );

  return {
    address,
    name: name ?? undefined,
    symbol: baseMeta.symbol ?? undefined,
    tokenType,
    totalSupply: totalSupply ?? undefined,
    floorPriceEth,
    imageUrl: imageUrl ?? null,
    isSpam: isSpam ?? false,
    safelist,
    deployer: deployer ?? null,
  };
}

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

export function processOwnerNftsResponse(ownedNfts: AlchemyOwnedNft[]): OwnerNft[] {
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

function normaliseTokenMetadata(token: AlchemyTokenMetadataEntry): TokenMetadata | null {
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

export function processTokenMetadataResponse(payload: AlchemyTokenMetadataResponse): TokenMetadata[] {
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
