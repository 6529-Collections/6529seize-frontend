import { decodeEventLog, formatUnits, getAddress, isAddress } from "viem";
import type { Address, Hex } from "viem";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

import { publicClient } from "./viem-client";

const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC1155_INTERFACE_ID = "0xd9b67a26";
const ERC2981_INTERFACE_ID = "0x2a55205a";

const ITEM_METADATA_TTL_MS = 24 * 60 * 60 * 1000;
const ITEM_STATE_TTL_MS = 3 * 60 * 1000;
const COLLECTION_TTL_MS = 24 * 60 * 60 * 1000;
const SLUG_TTL_MS = 12 * 60 * 60 * 1000;
const TX_PENDING_TTL_MS = 30 * 1000;
const TX_CONFIRMED_TTL_MS = 24 * 60 * 60 * 1000;

const ROYALTY_SALE_PRICE = BigInt("1000000000000000000");
const BASIS_POINTS_MULTIPLIER = BigInt(10000);

const MAX_METADATA_BYTES = 512 * 1024;
const METADATA_TIMEOUT_MS = 5000;

const IPFS_GATEWAY = (process.env.IPFS_GATEWAY ?? "https://cloudflare-ipfs.com/ipfs/").replace(/\/+$/, "");

const SEAPORT_CONTRACTS = new Set([
  getAddress("0x00000000006c3852cbEf3e08e8dF289169EdE581"),
  getAddress("0x00000000000000ADc04C56Bf30aC9d3C0aAF14dC"),
  getAddress("0x00000000000001ad428e4906ae43d8f9852d0dd6"),
]);

const WETH_ADDRESS = getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const USDC_ADDRESS = getAddress("0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

const ERC165_ABI = [
  {
    name: "supportsInterface",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const ERC721_METADATA_ABI = [
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const ERC1155_METADATA_ABI = [
  {
    name: "uri",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const ERC1155_SUPPLY_ABI = [
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const ERC2981_ABI = [
  {
    name: "royaltyInfo",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "salePrice", type: "uint256" },
    ],
    outputs: [
      { name: "receiver", type: "address" },
      { name: "royaltyAmount", type: "uint256" },
    ],
  },
] as const;

const SEAPORT_ORDER_FULFILLED_EVENT = {
  name: "OrderFulfilled",
  type: "event",
  inputs: [
    { name: "orderHash", type: "bytes32", indexed: false },
    { name: "offerer", type: "address", indexed: true },
    { name: "zone", type: "address", indexed: true },
    { name: "recipient", type: "address", indexed: false },
    {
      name: "offer",
      type: "tuple[]",
      indexed: false,
      components: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifier", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
    },
    {
      name: "consideration",
      type: "tuple[]",
      indexed: false,
      components: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifier", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "recipient", type: "address" },
      ],
    },
  ],
} as const;

const ERC721_TRANSFER_EVENT = {
  name: "Transfer",
  type: "event",
  anonymous: false,
  inputs: [
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "tokenId", type: "uint256", indexed: true },
  ],
} as const;

const ERC1155_TRANSFER_SINGLE_EVENT = {
  name: "TransferSingle",
  type: "event",
  anonymous: false,
  inputs: [
    { name: "operator", type: "address", indexed: true },
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "id", type: "uint256", indexed: false },
    { name: "value", type: "uint256", indexed: false },
  ],
} as const;

const ERC1155_TRANSFER_BATCH_EVENT = {
  name: "TransferBatch",
  type: "event",
  anonymous: false,
  inputs: [
    { name: "operator", type: "address", indexed: true },
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "ids", type: "uint256[]", indexed: false },
    { name: "values", type: "uint256[]", indexed: false },
  ],
} as const;

type CachedValue<T> = { value: T; expiresAt: number };

type HandlerResult = { ttlMs: number; data: LinkPreviewResponse };

interface ItemMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: TokenAttribute[];
  metadataUrl?: string;
}

interface TokenAttribute {
  trait_type?: string;
  value: string;
}

interface ContractInterfaces {
  readonly isErc721: boolean;
  readonly isErc1155: boolean;
  readonly supports2981: boolean;
}

interface OfferItem {
  readonly itemType: number;
  readonly token: Address;
  readonly identifier: bigint;
  readonly amount: bigint;
}

interface ConsiderationItem extends OfferItem {
  readonly recipient: Address;
}

const itemMetadataCache = new Map<string, CachedValue<ItemMetadata>>();
const collectionMetadataCache = new Map<string, CachedValue<LinkPreviewResponse>>();
const transactionCache = new Map<string, CachedValue<LinkPreviewResponse>>();

function getCached<T>(cache: Map<string, CachedValue<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function setCached<T>(cache: Map<string, CachedValue<T>>, key: string, value: T, ttl: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

function normalizeAddress(value: string): Address | null {
  if (!isAddress(value)) {
    return null;
  }

  try {
    return getAddress(value);
  } catch {
    return null;
  }
}

function parseTokenId(value: string): bigint | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return trimmed.startsWith("0x") ? BigInt(trimmed) : BigInt(trimmed);
  } catch {
    return null;
  }
}

function resolve1155Uri(template: string, tokenId: bigint): string {
  if (!template.includes("{id}")) {
    return template;
  }

  const hexId = tokenId.toString(16).padStart(64, "0");
  return template.replace(/\{id\}/gi, hexId);
}

function normalizeIpfsUrl(value: string): string {
  const match = value.match(/^ipfs:\/\/(ipfs\/)?(.+)$/i);
  if (!match) {
    return value;
  }

  return `${IPFS_GATEWAY}/${match[2].replace(/^\/+/, "")}`;
}

function sanitizeUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const normalized = normalizeIpfsUrl(trimmed);

  if (/^data:/i.test(normalized)) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // ignore invalid URLs
  }

  return undefined;
}

function sanitizeAttributes(value: unknown): TokenAttribute[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const attributes: TokenAttribute[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const trait = typeof record.trait_type === "string" ? record.trait_type.trim() : undefined;
    const rawValue = record.value;

    if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      const valueString = String(rawValue).trim();
      if (!valueString) {
        continue;
      }

      const attribute: TokenAttribute = { value: valueString };
      if (trait) {
        attribute.trait_type = trait;
      }
      attributes.push(attribute);
    }
  }

  return attributes.slice(0, 50);
}

function normalizeTopics(topics: readonly Hex[]): [] | [Hex, ...Hex[]] {
  if (!topics || topics.length === 0) {
    return [];
  }

  const [signature, ...rest] = topics;
  return [signature, ...(rest as Hex[])] as [Hex, ...Hex[]];
}

async function readBodyWithLimit(response: Response, limit: number): Promise<string | null> {
  if (!response.body) {
    const text = await response.text();
    return text.length <= limit ? text : null;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (value) {
      total += value.length;
      if (total > limit) {
        reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(buffer);
}

async function fetchJsonMetadata(uri: string): Promise<Record<string, unknown> | null> {
  if (uri.startsWith("data:")) {
    const comma = uri.indexOf(",");
    if (comma === -1) {
      return null;
    }

    const metadataPayload = uri.slice(comma + 1);
    const isBase64 = /;base64/i.test(uri.slice(0, comma));
    try {
      const decoded = isBase64
        ? Buffer.from(metadataPayload, "base64").toString("utf-8")
        : decodeURIComponent(metadataPayload);
      const parsed = JSON.parse(decoded);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);

  try {
    const response = await fetch(uri, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const text = await readBodyWithLimit(response, MAX_METADATA_BYTES);
    if (!text) {
      return null;
    }

    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveTokenMetadata(
  contract: Address,
  tokenId: bigint,
  tokenUri: string | undefined
): Promise<ItemMetadata> {
  const cacheKey = `${contract}:${tokenId.toString()}`;
  const cached = getCached(itemMetadataCache, cacheKey);
  if (cached) {
    return cached;
  }

  const resolvedUri = tokenUri ? sanitizeUrl(tokenUri) : undefined;
  if (!resolvedUri) {
    const metadata: ItemMetadata = {};
    setCached(itemMetadataCache, cacheKey, metadata, ITEM_METADATA_TTL_MS);
    return metadata;
  }

  const json = await fetchJsonMetadata(resolvedUri);
  if (!json) {
    const metadata: ItemMetadata = { metadataUrl: resolvedUri };
    setCached(itemMetadataCache, cacheKey, metadata, ITEM_METADATA_TTL_MS);
    return metadata;
  }

  const metadata: ItemMetadata = {
    metadataUrl: resolvedUri,
  };

  if (typeof json.name === "string" && json.name.trim()) {
    metadata.name = json.name.trim();
  }

  if (typeof json.description === "string" && json.description.trim()) {
    metadata.description = json.description.trim();
  }

  const imageCandidate =
    (typeof json.image === "string" && json.image.trim()) ||
    (typeof json.image_url === "string" && json.image_url.trim()) ||
    (typeof json.imageUrl === "string" && json.imageUrl.trim()) ||
    (typeof json.animation_url === "string" && json.animation_url.trim()) ||
    undefined;

  const sanitizedImage = sanitizeUrl(imageCandidate);
  if (sanitizedImage) {
    metadata.image = sanitizedImage;
  }

  const attributes = sanitizeAttributes(json.attributes);
  if (attributes && attributes.length > 0) {
    metadata.attributes = attributes;
  }

  setCached(itemMetadataCache, cacheKey, metadata, ITEM_METADATA_TTL_MS);
  return metadata;
}

async function detectInterfaces(contract: Address): Promise<ContractInterfaces> {
  try {
    const results = await publicClient.multicall({
      allowFailure: true,
      contracts: [
        {
          address: contract,
          abi: ERC165_ABI,
          functionName: "supportsInterface",
          args: [ERC721_INTERFACE_ID as Hex],
        },
        {
          address: contract,
          abi: ERC165_ABI,
          functionName: "supportsInterface",
          args: [ERC1155_INTERFACE_ID as Hex],
        },
        {
          address: contract,
          abi: ERC165_ABI,
          functionName: "supportsInterface",
          args: [ERC2981_INTERFACE_ID as Hex],
        },
      ],
    });

    const isErc721 = results[0]?.status === "success" && results[0].result === true;
    const isErc1155 = results[1]?.status === "success" && results[1].result === true;
    const supports2981 = results[2]?.status === "success" && results[2].result === true;

    return {
      isErc721: Boolean(isErc721),
      isErc1155: Boolean(isErc1155),
      supports2981: Boolean(supports2981),
    };
  } catch {
    return { isErc721: false, isErc1155: false, supports2981: false };
  }
}

function deriveStandard(interfaces: ContractInterfaces): "ERC721" | "ERC1155" | "unknown" {
  if (interfaces.isErc721 && !interfaces.isErc1155) {
    return "ERC721";
  }
  if (interfaces.isErc1155 && !interfaces.isErc721) {
    return "ERC1155";
  }
  if (interfaces.isErc1155) {
    return "ERC1155";
  }
  if (interfaces.isErc721) {
    return "ERC721";
  }
  return "unknown";
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function createImageMedia(url: string | undefined) {
  if (!url) {
    return null;
  }
  return { url, secureUrl: url };
}

async function readRoyaltyInfo(
  contract: Address,
  tokenId: bigint,
  interfaces: ContractInterfaces
): Promise<{ readonly receiver: Address | null; readonly bps: number | null; readonly supports2981: boolean }>
{
  if (!interfaces.supports2981) {
    return { receiver: null, bps: null, supports2981: false };
  }

  try {
    const [receiver, amount] = await publicClient.readContract({
      address: contract,
      abi: ERC2981_ABI,
      functionName: "royaltyInfo",
      args: [tokenId, ROYALTY_SALE_PRICE],
    });

    const normalizedReceiver = getAddress(receiver);
    const bps = Number((amount * BASIS_POINTS_MULTIPLIER) / ROYALTY_SALE_PRICE);
    return { receiver: normalizedReceiver, bps, supports2981: true };
  } catch {
    return { receiver: null, bps: null, supports2981: true };
  }
}

async function handleItem(
  contract: Address,
  tokenIdValue: string,
  tokenId: bigint,
  url: URL
): Promise<HandlerResult | null> {
  const interfaces = await detectInterfaces(contract);
  const standard = deriveStandard(interfaces);

  const contractCalls = await publicClient.multicall({
    allowFailure: true,
    contracts: [
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "name" },
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "symbol" },
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "tokenURI", args: [tokenId] },
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "ownerOf", args: [tokenId] },
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "totalSupply" },
      { address: contract, abi: ERC1155_METADATA_ABI, functionName: "uri", args: [tokenId] },
      { address: contract, abi: ERC1155_SUPPLY_ABI, functionName: "totalSupply", args: [tokenId] },
    ],
  });

  const contractName = safeString(
    contractCalls[0]?.status === "success" ? (contractCalls[0].result as string) : undefined
  );
  const contractSymbol = safeString(
    contractCalls[1]?.status === "success" ? (contractCalls[1].result as string) : undefined
  );

  const tokenUriRaw = safeString(
    contractCalls[2]?.status === "success" ? (contractCalls[2].result as string) : undefined
  );
  const uriRaw = safeString(
    contractCalls[5]?.status === "success" ? (contractCalls[5].result as string) : undefined
  );

  const resolvedUri = (() => {
    if (standard === "ERC1155" && uriRaw) {
      return resolve1155Uri(uriRaw, tokenId);
    }
    if (tokenUriRaw) {
      return tokenUriRaw;
    }
    if (uriRaw) {
      return resolve1155Uri(uriRaw, tokenId);
    }
    return undefined;
  })();

  const metadata = await resolveTokenMetadata(contract, tokenId, resolvedUri);

  const ownerAddress = (() => {
    if (standard !== "ERC721") {
      return null;
    }
    const ownerValue = contractCalls[3]?.status === "success" ? (contractCalls[3].result as Address) : null;
    if (!ownerValue) {
      return null;
    }
    try {
      return getAddress(ownerValue);
    } catch {
      return null;
    }
  })();

  const totalSupplyValue = (() => {
    if (standard === "ERC1155") {
      const supplyEntry = contractCalls[6];
      if (supplyEntry?.status === "success") {
        return (supplyEntry.result as bigint).toString();
      }
      return null;
    }
    const supplyEntry = contractCalls[4];
    if (supplyEntry?.status === "success") {
      return (supplyEntry.result as bigint).toString();
    }
    return null;
  })();

  const canonicalUrl = `https://opensea.io/assets/ethereum/${contract}/${encodeURIComponent(tokenIdValue)}`;
  const etherscanUrl = `https://etherscan.io/token/${contract}?a=${encodeURIComponent(tokenIdValue)}`;

  const displayName = metadata.name ?? (contractName ? `${contractName} #${tokenIdValue}` : `Token #${tokenIdValue}`);
  const imageMedia = metadata.image ? createImageMedia(metadata.image) : null;
  const royalties = await readRoyaltyInfo(contract, tokenId, interfaces);

  const response: LinkPreviewResponse = {
    requestUrl: url.toString(),
    url: canonicalUrl,
    title: displayName,
    description: metadata.description ?? null,
    siteName: "OpenSea",
    image: imageMedia,
    images: imageMedia ? [imageMedia] : [],
    type: "opensea.item",
    chainId: 1,
    contract,
    tokenId: tokenIdValue,
    standard,
    name: displayName,
    attributes: metadata.attributes ?? [],
    owner: ownerAddress,
    supply: totalSupplyValue
      ? { total: totalSupplyValue, standard }
      : standard === "ERC1155"
      ? { total: null, standard }
      : null,
    royalties,
    links: {
      opensea: canonicalUrl,
      etherscan: etherscanUrl,
      metadata: metadata.metadataUrl ?? null,
    },
    symbol: contractSymbol ?? null,
  } as LinkPreviewResponse;

  return { data: response, ttlMs: ITEM_STATE_TTL_MS };
}

async function handleCollection(contract: Address, url: URL): Promise<HandlerResult | null> {
  const cacheKey = `collection:${contract}`;
  const cached = getCached(collectionMetadataCache, cacheKey);
  if (cached) {
    return { data: cached, ttlMs: COLLECTION_TTL_MS };
  }

  const interfaces = await detectInterfaces(contract);
  const standard = deriveStandard(interfaces);

  const tokenId = BigInt(1);

  const contractCalls = await publicClient.multicall({
    allowFailure: true,
    contracts: [
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "name" },
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "symbol" },
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "totalSupply" },
      { address: contract, abi: ERC721_METADATA_ABI, functionName: "tokenURI", args: [tokenId] },
      { address: contract, abi: ERC1155_METADATA_ABI, functionName: "uri", args: [tokenId] },
    ],
  });

  const name = safeString(contractCalls[0]?.status === "success" ? (contractCalls[0].result as string) : undefined);
  const symbol = safeString(contractCalls[1]?.status === "success" ? (contractCalls[1].result as string) : undefined);
  const totalSupply = contractCalls[2]?.status === "success" ? (contractCalls[2].result as bigint) : null;

  const tokenUriRaw = safeString(
    contractCalls[3]?.status === "success" ? (contractCalls[3].result as string) : undefined
  );
  const uriRaw = safeString(contractCalls[4]?.status === "success" ? (contractCalls[4].result as string) : undefined);

  let sampleImage: string | undefined;
  const resolvedUri = tokenUriRaw ?? (uriRaw ? resolve1155Uri(uriRaw, tokenId) : undefined);
  if (resolvedUri) {
    const metadata = await resolveTokenMetadata(contract, tokenId, resolvedUri);
    sampleImage = metadata.image;
  }

  const canonicalUrl = `https://opensea.io/assets/ethereum/${contract}`;
  const etherscanUrl = `https://etherscan.io/address/${contract}`;
  const imageMedia = sampleImage ? createImageMedia(sampleImage) : null;

  const response: LinkPreviewResponse = {
    requestUrl: url.toString(),
    url: canonicalUrl,
    title: name ?? `Collection ${contract}`,
    siteName: "OpenSea",
    image: imageMedia,
    images: imageMedia ? [imageMedia] : [],
    type: "opensea.collection",
    chainId: 1,
    contract,
    name: name ?? null,
    symbol: symbol ?? null,
    standard,
    supply: totalSupply ? totalSupply.toString() : null,
    sampleImage: sampleImage ?? null,
    links: {
      opensea: canonicalUrl,
      etherscan: etherscanUrl,
    },
  } as LinkPreviewResponse;

  setCached(collectionMetadataCache, cacheKey, response, COLLECTION_TTL_MS);

  return { data: response, ttlMs: COLLECTION_TTL_MS };
}

function handleCollectionSlug(slug: string, url: URL): HandlerResult {
  const canonicalSlug = slug.toLowerCase();
  const canonicalUrl = `https://opensea.io/collection/${canonicalSlug}`;
  const data: LinkPreviewResponse = {
    requestUrl: url.toString(),
    url: canonicalUrl,
    title: "OpenSea Collection",
    siteName: "OpenSea",
    type: "opensea.collection.slug",
    slug: canonicalSlug,
    links: {
      opensea: canonicalUrl,
    },
  } as LinkPreviewResponse;

  return { data, ttlMs: SLUG_TTL_MS };
}

const enum ItemType {
  NATIVE = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
  ERC721_WITH_CRITERIA = 4,
  ERC1155_WITH_CRITERIA = 5,
}

function decodeSeaportOrder(log: { readonly topics: readonly Hex[]; readonly data: Hex }) {
  try {
    const decoded = decodeEventLog({
      abi: [SEAPORT_ORDER_FULFILLED_EVENT],
      data: log.data,
      topics: normalizeTopics(log.topics),
    });
    if (decoded.eventName !== "OrderFulfilled") {
      return null;
    }

    const args = decoded.args as unknown as {
      readonly offerer: Address;
      readonly recipient: Address;
      readonly offer: readonly OfferItem[];
      readonly consideration: readonly ConsiderationItem[];
    };

    return args;
  } catch {
    return null;
  }
}

function pickNftFromOffer(offer: readonly OfferItem[], consideration: readonly ConsiderationItem[]) {
  const combined = [...offer, ...consideration];
  for (const item of combined) {
    if (item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC721_WITH_CRITERIA) {
      return {
        contract: getAddress(item.token),
        tokenId: item.identifier,
        standard: "ERC721" as const,
      };
    }
    if (item.itemType === ItemType.ERC1155 || item.itemType === ItemType.ERC1155_WITH_CRITERIA) {
      return {
        contract: getAddress(item.token),
        tokenId: item.identifier,
        standard: "ERC1155" as const,
      };
    }
  }
  return null;
}

function derivePrice(
  consideration: readonly ConsiderationItem[],
  offerer: Address
): { readonly amount: string; readonly asset: string } | null {
  let amount = BigInt(0);
  let asset: string | null = null;
  let decimals = 18;

  for (const item of consideration) {
    if (item.recipient.toLowerCase() !== offerer.toLowerCase()) {
      continue;
    }
    if (item.itemType === ItemType.NATIVE) {
      amount += item.amount;
      asset = "ETH";
      decimals = 18;
    } else if (item.itemType === ItemType.ERC20) {
      amount += item.amount;
      if (item.token.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
        asset = "WETH";
        decimals = 18;
      } else if (item.token.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
        asset = "USDC";
        decimals = 6;
      } else {
        asset = "ERC20";
        decimals = 18;
      }
    }
  }

  if (!asset) {
    return null;
  }

  return { amount: formatUnits(amount, decimals), asset };
}

function decodeTransferFallback(logs: readonly { readonly topics: readonly Hex[]; readonly data: Hex; readonly address: Address }[]) {
  for (const log of logs) {
    try {
      const decoded721 = decodeEventLog({
        abi: [ERC721_TRANSFER_EVENT],
        data: log.data,
        topics: normalizeTopics(log.topics),
      });
      if (decoded721.eventName === "Transfer") {
        const tokenId = decoded721.args.tokenId as bigint;
        return {
          contract: getAddress(log.address),
          tokenId,
          standard: "ERC721" as const,
        };
      }
    } catch {
      // continue
    }

    try {
      const decodedSingle = decodeEventLog({
        abi: [ERC1155_TRANSFER_SINGLE_EVENT],
        data: log.data,
        topics: normalizeTopics(log.topics),
      });
      if (decodedSingle.eventName === "TransferSingle") {
        const id = decodedSingle.args.id as bigint;
        return {
          contract: getAddress(log.address),
          tokenId: id,
          standard: "ERC1155" as const,
        };
      }
    } catch {
      // continue
    }

    try {
      const decodedBatch = decodeEventLog({
        abi: [ERC1155_TRANSFER_BATCH_EVENT],
        data: log.data,
        topics: normalizeTopics(log.topics),
      });
      if (decodedBatch.eventName === "TransferBatch") {
        const ids = decodedBatch.args.ids as readonly bigint[];
        if (ids && ids.length > 0) {
          return {
            contract: getAddress(log.address),
            tokenId: ids[0],
            standard: "ERC1155" as const,
          };
        }
      }
    } catch {
      // continue
    }
  }

  return null;
}

async function handleTransaction(hash: string, url: URL): Promise<HandlerResult | null> {
  const normalizedHash = hash.toLowerCase();
  const cached = getCached(transactionCache, normalizedHash);
  if (cached) {
    const ttl = cached.status === "pending" ? TX_PENDING_TTL_MS : TX_CONFIRMED_TTL_MS;
    return { data: cached, ttlMs: ttl };
  }

  try {
    const transaction = await publicClient.getTransaction({ hash: hash as Hex });
    if (transaction.chainId && transaction.chainId !== 1) {
      return null;
    }
    const receipt = await publicClient
      .getTransactionReceipt({ hash: hash as Hex })
      .catch(() => null);

    const status = receipt ? receipt.status : "pending";

    const logs = receipt?.logs ?? [];

    const seaportLog = logs.find((log) => SEAPORT_CONTRACTS.has(getAddress(log.address)));
    if (!seaportLog) {
      return null;
    }

    const decoded = decodeSeaportOrder(seaportLog);
    if (!decoded) {
      return null;
    }

    const nft = pickNftFromOffer(decoded.offer, decoded.consideration);
    const normalizedLogs = logs.map((log) => ({
      topics: log.topics as readonly Hex[],
      data: log.data as Hex,
      address: getAddress(log.address),
    }));
    const fallbackNft = nft ?? decodeTransferFallback(normalizedLogs);

    const price = derivePrice(decoded.consideration, decoded.offerer);

    const canonicalHash = hash.toLowerCase();
    const response: LinkPreviewResponse = {
      requestUrl: url.toString(),
      url: `https://etherscan.io/tx/${canonicalHash}`,
      title: "Seaport Transaction",
      siteName: "Etherscan",
      type: "opensea.tx",
      chainId: 1,
      hash: canonicalHash,
      status: status ?? "pending",
      blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
      market: "seaport",
      summary: fallbackNft
        ? {
            item: {
              contract: fallbackNft.contract,
              tokenId: fallbackNft.tokenId.toString(),
              standard: fallbackNft.standard,
            },
            price: price ?? null,
            buyer: getAddress(decoded.recipient),
            seller: getAddress(decoded.offerer),
          }
        : null,
      links: {
        etherscan: `https://etherscan.io/tx/${canonicalHash}`,
        opensea: `https://opensea.io/tx/${canonicalHash}`,
      },
    } as LinkPreviewResponse;

    const ttl = status === "pending" ? TX_PENDING_TTL_MS : TX_CONFIRMED_TTL_MS;
    setCached(transactionCache, normalizedHash, response, ttl);

    return { data: response, ttlMs: ttl };
  } catch {
    return null;
  }
}

function extractTransactionHash(url: URL): string | null {
  if (url.hostname.endsWith("etherscan.io")) {
    const match = url.pathname.match(/\/tx\/(0x[0-9a-fA-F]{64})/);
    return match ? match[1] : null;
  }

  if (url.hostname.endsWith("opensea.io")) {
    const match = url.pathname.match(/\/tx\/(0x[0-9a-fA-F]{64})/);
    return match ? match[1] : null;
  }

  return null;
}

export async function handleOpenSea(url: URL): Promise<HandlerResult | null> {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host.endsWith("opensea.io")) {
    if (segments.length >= 2 && segments[0] === "collection") {
      return handleCollectionSlug(segments[1], url);
    }

    if (segments.length >= 3 && segments[0] === "assets") {
      if (segments.length >= 4) {
        const chain = segments[1].toLowerCase();
        if (chain !== "ethereum") {
          return null;
        }
        const contract = normalizeAddress(segments[2]);
        const tokenIdValue = segments[3];
        if (!contract) {
          return null;
        }
        const tokenId = parseTokenId(tokenIdValue);
        if (!tokenId) {
          return null;
        }
        return handleItem(contract, tokenIdValue, tokenId, url);
      }

      if (segments.length === 3) {
        const chain = segments[1].toLowerCase();
        if (chain !== "ethereum") {
          return null;
        }
        const contract = normalizeAddress(segments[2]);
        if (!contract) {
          return null;
        }
        return handleCollection(contract, url);
      }
    }
  }

  const hash = extractTransactionHash(url);
  if (hash) {
    return handleTransaction(hash, url);
  }

  return null;
}
