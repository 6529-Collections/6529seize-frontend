import { publicEnv } from "@/config/env";
import { isValidEthAddress } from "@/helpers/Helpers";
import type {
  ContractOverview,
  Suggestion,
  SupportedChain,
  TokenMetadata,
} from "@/components/nft-picker/NftPicker.types";
import { getAddress } from "viem";
import { goerli, sepolia } from "wagmi/chains";

import { fetchUrl, postData } from "./6529api";

type SearchContractsParams = {
  query: string;
  chain?: SupportedChain;
  pageKey?: string;
  hideSpam?: boolean;
  signal?: AbortSignal;
};

type SearchContractsResult = {
  items: Suggestion[];
  hiddenCount: number;
  nextPageKey?: string;
};

type ContractOverviewParams = {
  address: `0x${string}`;
  chain?: SupportedChain;
  signal?: AbortSignal;
};

type TokenMetadataParams = {
  address: `0x${string}`;
  tokenIds: readonly string[];
  chain?: SupportedChain;
  signal?: AbortSignal;
};

type AlchemyContractResult = {
  address?: string;
  contractAddress?: string;
  contractDeployer?: string | null;
  isSpam?: boolean;
  spamInfo?: { isSpam?: boolean };
  spamClassifications?: string[] | null;
  contractMetadata?: AlchemyContractMetadata;
  openSeaMetadata?: AlchemyOpenSeaMetadata;
  openseaMetadata?: AlchemyOpenSeaMetadata;
} & AlchemyContractMetadata;

type AlchemyContractMetadata = {
  address?: string | null;
  name?: string | null;
  symbol?: string | null;
  tokenType?: string | null;
  totalSupply?: string | null;
  image?: { cachedUrl?: string | null; thumbnailUrl?: string | null } | null;
  bannerImageUrl?: string | null;
  description?: string | null;
  contractDeployer?: string | null;
  openSeaMetadata?: AlchemyOpenSeaMetadata;
  openseaMetadata?: AlchemyOpenSeaMetadata;
  openSea?: AlchemyOpenSeaMetadata;
  opensea?: AlchemyOpenSeaMetadata;
  isSpam?: boolean;
  spamInfo?: { isSpam?: boolean };
};

type AlchemyOpenSeaMetadata = {
  imageUrl?: string | null;
  bannerImageUrl?: string | null;
  collectionName?: string | null;
  safelistRequestStatus?: string | null;
  floorPrice?: number | { eth?: number | string | null } | null;
  description?: string | null;
};

type AlchemySearchResponse = {
  contracts?: AlchemyContractResult[];
  pageKey?: string;
};

type AlchemyContractMetadataResponse = {
  contractMetadata?: AlchemyContractMetadata;
  openSeaMetadata?: AlchemyOpenSeaMetadata;
  openseaMetadata?: AlchemyOpenSeaMetadata;
  address?: string;
  contractAddress?: string;
  isSpam?: boolean;
};

type AlchemyTokenMetadataEntry = {
  tokenId?: string;
  tokenType?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  image?: {
    cachedUrl?: string | null;
    thumbnailUrl?: string | null;
    originalUrl?: string | null;
  } | null;
  media?: {
    gateway?: string | null;
    thumbnailUrl?: string | null;
    raw?: string | null;
  }[] | null;
  metadata?: { image?: string | null; name?: string | null } | null;
  raw?: { metadata?: { image?: string | null; name?: string | null } } | null;
  isSpam?: boolean;
  spamInfo?: { isSpam?: boolean } | null;
};

type AlchemyTokenMetadataResponse = {
  tokens?: AlchemyTokenMetadataEntry[];
  nfts?: AlchemyTokenMetadataEntry[];
};

const NETWORK_MAP: Record<SupportedChain, string> = {
  ethereum: "eth-mainnet",
};

const MAX_BATCH_SIZE = 100;
const MAX_GET_NFTS_RETRIES = 3;

function resolveNetwork(chain: SupportedChain = "ethereum"): string {
  return NETWORK_MAP[chain] ?? NETWORK_MAP.ethereum;
}

function ensureQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Query must not be empty");
  }
  return trimmed;
}

function toSafelist(
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

function parseFloorPrice(meta: AlchemyOpenSeaMetadata | undefined): number | null {
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

function pickImage(source?: {
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

function pickThumbnail(source?: {
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

function normaliseAddress(address?: string | null): `0x${string}` | null {
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
  const openSea =
    contract.openSeaMetadata ??
    contract.openseaMetadata ??
    baseMeta.openSeaMetadata ??
    baseMeta.openseaMetadata ??
    baseMeta.openSea ??
    baseMeta.opensea;
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

export async function searchNftCollections(
  params: SearchContractsParams
): Promise<SearchContractsResult> {
  const { query, chain = "ethereum", pageKey, hideSpam = true, signal } = params;
  const trimmed = ensureQuery(query);
  const network = resolveNetwork(chain);
  const url = new URL(
    `https://${network}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/searchContractMetadata`
  );
  url.searchParams.set("query", trimmed);
  if (pageKey) {
    url.searchParams.set("pageKey", pageKey);
  }
  const response = await fetchUrl<AlchemySearchResponse | undefined>(
    url.toString(),
    { signal }
  );
  const contracts = response?.contracts ?? [];
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
    nextPageKey: response?.pageKey,
  };
}

export async function getContractOverview(
  params: ContractOverviewParams
): Promise<ContractOverview | null> {
  const { address, chain = "ethereum", signal } = params;
  if (!isValidEthAddress(address)) {
    throw new Error("Invalid contract address");
  }
  const checksum = normaliseAddress(address);
  if (!checksum) {
    return null;
  }
  const network = resolveNetwork(chain);
  const url = `https://${network}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/getContractMetadata?contractAddress=${checksum}`;
  const response = await fetchUrl<AlchemyContractMetadataResponse | undefined>(
    url,
    { signal }
  );
  if (!response) {
    return null;
  }
  const contract: AlchemyContractResult = {
    ...response.contractMetadata,
    contractMetadata: response.contractMetadata,
    address: checksum,
    contractAddress: checksum,
    openSeaMetadata: response.openSeaMetadata ?? response.openseaMetadata,
    openseaMetadata: response.openseaMetadata ?? response.openSeaMetadata,
    isSpam:
      response.isSpam ??
      response.contractMetadata?.isSpam ??
      response.contractMetadata?.spamInfo?.isSpam,
  };
  const suggestion = extractContract(contract);
  if (!suggestion) {
    return null;
  }
  const openSea =
    response.openSeaMetadata ??
    response.openseaMetadata ??
    response.contractMetadata?.openSeaMetadata ??
    response.contractMetadata?.openseaMetadata ??
    response.contractMetadata?.openSea ??
    response.contractMetadata?.opensea;
  return {
    ...suggestion,
    description: openSea?.description ?? null,
    bannerImageUrl: openSea?.bannerImageUrl ?? null,
  };
}

function parseTokenIdToBigint(tokenId: string): bigint {
  if (!tokenId) {
    throw new Error("Token ID missing");
  }
  const trimmed = tokenId.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    return BigInt(trimmed);
  }
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
      name:
        token.title ??
        token.name ??
        token.metadata?.name ??
        token.raw?.metadata?.name ??
        null,
      imageUrl,
      isSpam: token.isSpam ?? token.spamInfo?.isSpam ?? false,
    };
  } catch (error) {
    console.warn("Failed to parse token metadata", tokenIdRaw, error);
    return null;
  }
}

export async function getTokensMetadata(
  params: TokenMetadataParams
): Promise<TokenMetadata[]> {
  const { address, tokenIds, chain = "ethereum", signal } = params;
  if (!tokenIds.length) {
    return [];
  }
  if (!isValidEthAddress(address)) {
    throw new Error("Invalid contract address");
  }
  const checksum = normaliseAddress(address);
  if (!checksum) {
    return [];
  }
  const network = resolveNetwork(chain);
  const url = `https://${network}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/getNFTMetadataBatch`;
  const results: TokenMetadata[] = [];
  for (let i = 0; i < tokenIds.length; i += MAX_BATCH_SIZE) {
    const slice = tokenIds.slice(i, i + MAX_BATCH_SIZE);
    const body = {
      tokens: slice.map((tokenId) => ({
        contractAddress: checksum,
        tokenId,
      })),
    };
    const { status, response } = await postData(url, body, { signal });
    if (status >= 400) {
      throw new Error("Failed to fetch token metadata");
    }
    const payload = response as AlchemyTokenMetadataResponse;
    const tokens = payload.tokens ?? payload.nfts ?? [];
    for (const token of tokens) {
      const normalised = normaliseTokenMetadata(token);
      if (normalised) {
        results.push(normalised);
      }
    }
  }
  return results;
}

const legacyOptions = { method: "GET", headers: { accept: "application/json" } };

function createAbortError(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }
  if (typeof DOMException === "function") {
    return new DOMException("The operation was aborted.", "AbortError");
  }
  const error = new Error("The operation was aborted.");
  (error as Error & { name: string }).name = "AbortError";
  return error;
}

function delayWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  if (!signal) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  if (signal.aborted) {
    return Promise.reject(createAbortError(signal));
  }

  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      reject(createAbortError(signal));
    };

    timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchLegacyUrl(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { ...legacyOptions, signal });
  return await response.json();
}

export async function getNftsForContractAndOwner(
  chainId: number,
  contract: string,
  owner: string,
  nfts?: any[],
  pageKey?: string,
  retries = 0,
  signal?: AbortSignal
) {
  if (!nfts) {
    nfts = [];
  }
  let path = "eth-mainnet";
  if (chainId === sepolia.id) {
    path = "eth-sepolia";
  } else if (chainId === goerli.id) {
    path = "eth-goerli";
  }

  let url = `https://${path}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&contractAddresses[]=${contract}`;
  if (pageKey) {
    url += `&pageKey=${pageKey}`;
  }
  const response = await fetchLegacyUrl(url, signal);
  if (response.error) {
    if (retries >= MAX_GET_NFTS_RETRIES) {
      throw new Error("Failed to fetch NFTs for owner after retries");
    }
    await delayWithAbort(250 * (retries + 1), signal);
    return getNftsForContractAndOwner(
      chainId,
      contract,
      owner,
      nfts,
      pageKey,
      retries + 1,
      signal
    );
  }
  nfts = [...nfts].concat(response.ownedNfts);
  if (response.pageKey) {
    return getNftsForContractAndOwner(
      chainId,
      contract,
      owner,
      nfts,
      response.pageKey,
      retries,
      signal
    );
  }

  const allNfts = nfts.map((nft) => {
    return {
      tokenId: nft.tokenId,
      tokenType: nft.tokenType,
      name: nft.name,
      tokenUri: nft.tokenUri,
      image: nft.image,
    };
  });
  return allNfts;
}

export type { SearchContractsParams, SearchContractsResult, TokenMetadataParams };
