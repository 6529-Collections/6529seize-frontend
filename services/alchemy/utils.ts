import { STATIC_ALLOWED_IMAGE_HOSTNAMES } from "@/lib/media/static-image-hosts";
import { isArweaveGatewayRuntimeHost } from "@/lib/media/arweave-gateways";
import { getAddress } from "viem";
import {
  DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  normalizeDecentralizedMediaUrl,
} from "@/lib/media/decentralized-media";

import { isValidEthAddress } from "@/helpers/Helpers";
import type {
  AlchemyContractMetadata,
  AlchemyContractMetadataResponse,
  AlchemyContractResult,
  AlchemyOpenSeaMetadata,
  AlchemyTokenMetadataEntry,
  AlchemyTokenMetadataResponse,
  OwnerNft,
} from "./types";
import type {
  ContractOverview,
  Suggestion,
  SupportedChain,
  TokenMetadata,
} from "@/types/nft";

const NETWORK_MAP: Record<SupportedChain, string> = {
  ethereum: "eth-mainnet",
};

export function resolveNetwork(chain: SupportedChain = "ethereum"): string {
  return NETWORK_MAP[chain];
}

function toSafelist(status: string | null | undefined): Suggestion["safelist"] {
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

function parseFloorPrice(
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

const STATIC_IMAGE_HOSTS = new Set<string>(STATIC_ALLOWED_IMAGE_HOSTNAMES);

type OpenSeaMetadataSource =
  | {
      openSeaMetadata?: AlchemyOpenSeaMetadata | null | undefined;
      openseaMetadata?: AlchemyOpenSeaMetadata | null | undefined;
      openSea?: AlchemyOpenSeaMetadata | null | undefined;
      opensea?: AlchemyOpenSeaMetadata | null | undefined;
    }
  | null
  | undefined;

function resolveOpenSeaMetadata(
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

function normaliseImageUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const source = value.trim();
  try {
    const url = new URL(source);
    return url.protocol === "https:" || url.protocol === "http:"
      ? source
      : null;
  } catch {
    return null;
  }
}

function pickOriginalImage(...sources: unknown[]): string | null {
  for (const source of sources) {
    const imageUrl =
      normaliseImageUrl(source) ??
      (typeof source === "string"
        ? normaliseImageUrl(normalizeDecentralizedMediaUrl(source))
        : null);
    if (!imageUrl) {
      continue;
    }
    const url = new URL(imageUrl);
    // Raw metadata can name any host; retain the existing image-host policy.
    if (
      url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      (url.origin === DEFAULT_MEDIA_RESOLVER_ENDPOINT ||
        STATIC_IMAGE_HOSTS.has(url.hostname) ||
        isArweaveGatewayRuntimeHost(url.hostname))
    ) {
      return imageUrl;
    }
  }
  return null;
}

function pickImage(source?: {
  image?:
    | {
        cachedUrl?: string | null | undefined;
        thumbnailUrl?: string | null | undefined;
      }
    | null
    | undefined;
  imageUrl?: string | null | undefined;
}): string | null {
  return (
    normaliseImageUrl(source?.imageUrl) ??
    normaliseImageUrl(source?.image?.cachedUrl) ??
    normaliseImageUrl(source?.image?.thumbnailUrl)
  );
}

function pickThumbnail(source: AlchemyTokenMetadataEntry): string | null {
  return (
    normaliseImageUrl(source.image?.thumbnailUrl) ??
    normaliseImageUrl(source.image?.cachedUrl) ??
    source.media
      ?.map((item) => normaliseImageUrl(item.thumbnailUrl))
      .find(Boolean) ??
    pickOriginalImage(
      source.image?.originalUrl,
      source.metadata?.image,
      source.raw?.metadata?.image,
      source.raw?.metadata?.["original_image_url"]
    )
  );
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

function extractContract(contract: AlchemyContractResult): Suggestion | null {
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
    isSpam,
    safelist,
    deployer: deployer ?? null,
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

export function processOwnerNftsResponse(
  ownedNfts: AlchemyTokenMetadataEntry[]
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
    const imageUrl = pickThumbnail(token);
    return {
      tokenId,
      tokenIdRaw,
      tokenUri: token.tokenUri ?? token.raw?.tokenUri ?? null,
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

export function processTokenUriMetadata(
  payload: unknown
): Pick<TokenMetadata, "name" | "imageUrl"> | null {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return null;
  }
  const metadata = payload as Record<string, unknown>;
  const name =
    typeof metadata["name"] === "string" ? metadata["name"].trim() : null;
  return {
    name: name === "" ? null : name,
    imageUrl: pickOriginalImage(metadata["image"], metadata["image_url"]),
  };
}
