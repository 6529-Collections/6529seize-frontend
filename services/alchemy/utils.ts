import { getAddress } from "viem";

import { isValidEthAddress } from "@/helpers/Helpers";
import type {
  AlchemyContractResult,
  AlchemyOpenSeaMetadata,
} from "./types";
import type { Suggestion, SupportedChain } from "@/types/nft";

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
  openSeaMetadata?: AlchemyOpenSeaMetadata | null;
  openseaMetadata?: AlchemyOpenSeaMetadata | null;
  openSea?: AlchemyOpenSeaMetadata | null;
  opensea?: AlchemyOpenSeaMetadata | null;
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
  image?: { cachedUrl?: string | null; thumbnailUrl?: string | null } | null;
  imageUrl?: string | null;
  media?: { thumbnailUrl?: string | null; gateway?: string | null }[] | null;
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
  image?: { thumbnailUrl?: string | null; cachedUrl?: string | null } | null;
  media?: { thumbnailUrl?: string | null }[] | null;
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
