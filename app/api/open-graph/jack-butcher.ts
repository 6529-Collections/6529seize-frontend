import { createPublicClient, fallback, http, type Address, type PublicClient } from "viem";
import { mainnet } from "viem/chains";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import {
  type JackButcherCard,
  type JackChecksCard,
  type JackOpepenCard,
  type JackOpepenSetCard,
  type JackTraitAttribute,
} from "@/types/jackButcher";

import { ensureUrlIsPublic } from "./utils";

const JACK_CHAIN_ID = 1;
const METADATA_FETCH_TIMEOUT_MS = 10_000;
const JACK_TOKEN_CACHE_MS = 20 * 60 * 1000;

const ERC721_METADATA_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CHECKS_COLLECTIONS: ReadonlyArray<{
  readonly address: Address;
  readonly name: string;
  readonly variant: JackChecksCard["variant"];
}> = [
  {
    address: "0x34eebee6942d8def3c125458d1a86e0a897fd6f9",
    name: "Checks Originals",
    variant: "original",
  },
  {
    address: "0x59728544B08AB483533076417FbBB2fD0B17CE3a",
    name: "Checks – VV Edition",
    variant: "edition",
  },
];

const OPEPEN_COLLECTION: { readonly address: Address; readonly name: string } = {
  address: "0x6339e5e072086621540d0362c4e3cea0d643e114",
  name: "Opepen Edition",
};

interface HandlerResult {
  readonly data: LinkPreviewResponse;
  readonly ttl: number;
}

let sharedClient: PublicClient | null = null;

function getPublicClient(): PublicClient {
  if (!sharedClient) {
    sharedClient = createPublicClient({
      chain: mainnet,
      transport: fallback([http(), http("https://rpc1.6529.io")]),
    });
  }

  return sharedClient;
}

export async function handleJackButcher(url: URL): Promise<HandlerResult | null> {
  const normalizedHost = url.hostname.replace(/^www\./i, "").toLowerCase();
  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (normalizedHost === "checks.art") {
    const tokenId = extractTokenId(pathSegments, "checks");
    if (tokenId) {
      const card = await buildChecksTokenCard(tokenId, url);
      if (card) {
        return { data: card as LinkPreviewResponse, ttl: JACK_TOKEN_CACHE_MS };
      }
    }
    return null;
  }

  if (normalizedHost === "opepen.art") {
    const tokenId = extractTokenId(pathSegments, "opepen");
    if (tokenId) {
      const card = await buildOpepenTokenCard(tokenId, url);
      if (card) {
        return { data: card as LinkPreviewResponse, ttl: JACK_TOKEN_CACHE_MS };
      }
    }

    const setNumber = extractTokenId(pathSegments, "sets");
    if (setNumber) {
      const card = buildOpepenSetCard(setNumber, url);
      if (card) {
        return { data: card as LinkPreviewResponse, ttl: JACK_TOKEN_CACHE_MS };
      }
    }
  }

  return null;
}

function extractTokenId(segments: string[], prefix: string): string | null {
  if (segments.length < 2) {
    return null;
  }

  if (segments[0] !== prefix) {
    return null;
  }

  const tokenCandidate = segments[1]?.split("?")[0]?.split("#")[0];
  if (!tokenCandidate) {
    return null;
  }

  if (!/^\d+$/.test(tokenCandidate)) {
    return null;
  }

  return String(BigInt(tokenCandidate));
}

async function buildChecksTokenCard(tokenId: string, sourceUrl: URL): Promise<JackChecksCard | null> {
  const client = getPublicClient();
  const tokenBigInt = BigInt(tokenId);

  for (const collection of CHECKS_COLLECTIONS) {
    const tokenUri = await readTokenUri(client, collection.address, tokenBigInt);
    if (!tokenUri) {
      continue;
    }

    const owner = await readOwner(client, collection.address, tokenBigInt);
    const metadata = await fetchTokenMetadata(tokenUri);

    const attributes = sanitizeAttributes(metadata?.attributes);
    const imageUrl = extractImage(metadata);
    const statement = sanitizeString(metadata?.description);

    return {
      type: "jack.checks",
      chainId: JACK_CHAIN_ID,
      requestUrl: sourceUrl.toString(),
      url: sourceUrl.toString(),
      variant: collection.variant,
      collection: {
        address: collection.address,
        name: collection.name,
      },
      token: {
        id: tokenId,
        owner,
        image: imageUrl ?? null,
        attributes: attributes.length > 0 ? attributes : undefined,
      },
      meta: {
        statement: statement ?? undefined,
        migrationHint:
          collection.variant === "original"
            ? "migrated"
            : collection.variant === "edition"
            ? "unmigrated"
            : "unknown",
      },
      links: buildTokenLinks(collection.address, tokenId, sourceUrl),
    };
  }

  return null;
}

async function buildOpepenTokenCard(tokenId: string, sourceUrl: URL): Promise<JackOpepenCard | null> {
  const client = getPublicClient();
  const tokenBigInt = BigInt(tokenId);

  const tokenUri = await readTokenUri(client, OPEPEN_COLLECTION.address, tokenBigInt);
  if (!tokenUri) {
    return null;
  }

  const metadata = await fetchTokenMetadata(tokenUri);
  const attributes = sanitizeAttributes(metadata?.attributes);
  const imageUrl = extractImage(metadata);
  const setInfo = extractOpepenSetInfo(attributes);
  const consensus = extractConsensus(metadata);

  return {
    type: "jack.opepen",
    chainId: JACK_CHAIN_ID,
    requestUrl: sourceUrl.toString(),
    url: sourceUrl.toString(),
    collection: {
      address: OPEPEN_COLLECTION.address,
      name: OPEPEN_COLLECTION.name,
    },
    token: {
      id: tokenId,
      image: imageUrl ?? null,
      set: setInfo,
      attributes: attributes.length > 0 ? attributes : undefined,
    },
    consensus: consensus ? { metAt: consensus } : undefined,
    links: buildTokenLinks(OPEPEN_COLLECTION.address, tokenId, sourceUrl),
  };
}

function buildOpepenSetCard(setId: string, sourceUrl: URL): JackOpepenSetCard | null {
  const parsedId = Number.parseInt(setId, 10);
  if (Number.isNaN(parsedId)) {
    return null;
  }

  return {
    type: "jack.opepen.set",
    chainId: JACK_CHAIN_ID,
    requestUrl: sourceUrl.toString(),
    url: sourceUrl.toString(),
    set: {
      number: parsedId,
      title: undefined,
      artist: undefined,
      editions: undefined,
    },
    links: {
      site: sourceUrl.toString(),
    },
  };
}

async function readTokenUri(
  client: PublicClient,
  address: Address,
  tokenId: bigint
): Promise<string | null> {
  try {
    const result = await client.readContract({
      address,
      abi: ERC721_METADATA_ABI,
      functionName: "tokenURI",
      args: [tokenId],
    });

    return typeof result === "string" && result ? result : null;
  } catch {
    return null;
  }
}

async function readOwner(
  client: PublicClient,
  address: Address,
  tokenId: bigint
): Promise<string | null> {
  try {
    const owner = await client.readContract({
      address,
      abi: ERC721_METADATA_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    });

    return typeof owner === "string" ? owner : null;
  } catch {
    return null;
  }
}

async function fetchTokenMetadata(
  tokenUri: string
): Promise<Record<string, unknown> | null> {
  if (!tokenUri) {
    return null;
  }

  if (tokenUri.startsWith("data:")) {
    const parsed = parseDataUri(tokenUri);
    return parsed ?? null;
  }

  const resolved = resolveResourceUrl(tokenUri);
  if (!resolved) {
    return null;
  }

  try {
    const url = new URL(resolved);
    await ensureUrlIsPublic(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), METADATA_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const json = (await response.json()) as unknown;
      if (json && typeof json === "object") {
        return json as Record<string, unknown>;
      }

      return null;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}

function parseDataUri(uri: string): Record<string, unknown> | null {
  const match = uri.match(/^data:application\/json(;charset=[^,]+)?;base64,(.+)$/i);
  if (match) {
    try {
      const decoded = Buffer.from(match[2], "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }

  const textMatch = uri.match(/^data:application\/json(;charset=[^,]+)?,(.+)$/i);
  if (textMatch) {
    try {
      const decoded = decodeURIComponent(textMatch[2]);
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function resolveResourceUrl(uri: string): string | null {
  const trimmed = uri.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("ipfs://")) {
    const path = trimmed.replace(/^ipfs:\/\//i, "").replace(/^ipfs\//i, "");
    return `https://ipfs.io/ipfs/${path}`;
  }

  if (trimmed.startsWith("ar://")) {
    return `https://arweave.net/${trimmed.slice(5)}`;
  }

  return null;
}

function sanitizeAttributes(value: unknown): JackTraitAttribute[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const results: JackTraitAttribute[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const traitTypeRaw = record["trait_type"] ?? record["traitType"] ?? record["trait"];
    const traitValue = record["value"];

    const traitType = typeof traitTypeRaw === "string" ? traitTypeRaw.trim() : "";
    if (!traitType) {
      continue;
    }

    if (
      typeof traitValue !== "string" &&
      typeof traitValue !== "number" &&
      typeof traitValue !== "boolean"
    ) {
      continue;
    }

    results.push({ trait_type: traitType, value: traitValue });
    if (results.length >= 24) {
      break;
    }
  }

  return results;
}

function extractImage(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) {
    return null;
  }

  const candidates = [
    metadata["image"],
    metadata["image_url"],
    metadata["imageUrl"],
    metadata["imageURI"],
    metadata["animation_url"],
    metadata["thumbnail"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const resolved = resolveResourceUrl(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractOpepenSetInfo(attributes: JackTraitAttribute[]): JackOpepenCard["token"]["set"] {
  if (attributes.length === 0) {
    return undefined;
  }

  let setNumber: number | null = null;
  let setName: string | null = null;
  let editionSize: number | null = null;

  for (const attribute of attributes) {
    const key = attribute.trait_type.toLowerCase();
    const value = attribute.value;

    if (setNumber === null && /set/.test(key)) {
      const numericMatch = typeof value === "string" ? value.match(/\d+/) : null;
      if (numericMatch) {
        setNumber = Number.parseInt(numericMatch[0], 10);
      } else if (typeof value === "number") {
        setNumber = value;
      }
    }

    if (setName === null && key.includes("name") && typeof value === "string") {
      setName = value;
    }

    if (editionSize === null && key.includes("edition") && typeof value === "string") {
      const editionMatch = value.match(/\d+/);
      if (editionMatch) {
        editionSize = Number.parseInt(editionMatch[0], 10);
      }
    } else if (editionSize === null && key.includes("edition") && typeof value === "number") {
      editionSize = value;
    }
  }

  if (setNumber === null && setName === null && editionSize === null) {
    return undefined;
  }

  return {
    number: setNumber,
    name: setName,
    editionSize,
  };
}

function extractConsensus(metadata: Record<string, unknown> | null | undefined): number | null {
  if (!metadata) {
    return null;
  }

  const consensusRaw = metadata["consensus"] ?? metadata["consensusMetAt"] ?? metadata["consensus_met_at"];

  if (typeof consensusRaw === "number") {
    return consensusRaw;
  }

  if (typeof consensusRaw === "string") {
    const trimmed = consensusRaw.trim();
    const numeric = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }

    const timestamp = Date.parse(trimmed);
    if (!Number.isNaN(timestamp)) {
      return Math.floor(timestamp / 1000);
    }
  }

  return null;
}

function buildTokenLinks(address: string, tokenId: string, sourceUrl: URL) {
  return {
    site: sourceUrl.toString(),
    contract: `https://etherscan.io/address/${address}`,
    token: `https://etherscan.io/token/${address}?a=${tokenId}`,
    market: `https://opensea.io/assets/ethereum/${address}/${tokenId}`,
  };
}
