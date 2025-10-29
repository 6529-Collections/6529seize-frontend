import {
  EnsAddressPreview,
  EnsContenthash,
  EnsLinks,
  EnsNamePreview,
  EnsOwnership,
  EnsPreview,
  TEXT_RECORD_KEYS,
  TextRecordKey,
} from "@/components/waves/ens/types";
import type { EnsTarget } from "@/lib/ens/detect";
import { stripHtmlTags } from "@/lib/text/html";
import { ens_normalize } from "@adraffy/ens-normalize";
import * as contentHash from "@ensdomains/content-hash";
import { toUnicode } from "punycode";
import {
  createPublicClient,
  fallback,
  getAddress,
  http,
  isAddress,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import { mainnet } from "viem/chains";
import { labelhash, namehash } from "viem/ens";

const CHAIN_ID = 1;

const ENS_REGISTRY_ADDRESS =
  "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as const satisfies Address;
const BASE_REGISTRAR_ADDRESS =
  "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const satisfies Address;
const NAME_WRAPPER_ADDRESS =
  "0x060f1546642E67c485D56248201feA2f9AB1803C" as const satisfies Address;

const PUBLIC_RESOLVER_ABI = [
  {
    name: "contenthash",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;

const ENS_REGISTRY_ABI = [
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const BASE_REGISTRAR_ABI = [
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "nameExpires",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const NAME_WRAPPER_ABI = [
  {
    name: "getData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "fuses", type: "uint32" },
      { name: "expiry", type: "uint64" },
    ],
  },
] as const;

const publicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([http(), http("https://rpc1.6529.io")]),
});

const NAME_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const ADDRESS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const OWNERSHIP_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface CacheEntry<T> {
  readonly expiresAt: number;
  readonly data: T;
}

const nameCache = new Map<string, CacheEntry<EnsNamePreview>>();
const addressCache = new Map<string, CacheEntry<EnsAddressPreview>>();
const ownershipCache = new Map<string, CacheEntry<EnsOwnership>>();

export class EnsPreviewError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ContenthashResult = EnsContenthash | null;

type NullableAddress = string | null | undefined;

function now(): number {
  return Date.now();
}

function fromCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string
): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function storeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T,
  ttlMs: number
): void {
  cache.set(key, { data, expiresAt: now() + ttlMs });
}

function normalizeEnsName(name: string): {
  normalized: string;
  display: string;
} {
  try {
    const normalized = ens_normalize(name);
    const display = toUnicode(normalized);
    return { normalized, display };
  } catch (error: any) {
    console.error("normalizeEnsName error", error);
    let message = "Invalid ENS name provided";
    if (error?.message) {
      message = `${message}: ${error.message}`;
    }
    throw new EnsPreviewError(400, message);
  }
}

function sanitizeRecordValue(
  value: string | null,
  key: TextRecordKey
): string | null {
  if (!value) {
    return null;
  }

  const withoutTags = stripHtmlTags(value, { maxLength: 20000 });
  const collapsed = withoutTags.replaceAll(/\s+/g, " ").trim();
  if (!collapsed) {
    return null;
  }

  const limit = key === "description" ? 512 : 160;
  return collapsed.slice(0, limit);
}

function sanitizeUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return null;
  }

  if (trimmed.startsWith("ipfs://")) {
    return `https://cf-ipfs.com/ipfs/${trimmed.slice(7)}`;
  }
  if (trimmed.startsWith("ipns://")) {
    return `https://cf-ipfs.com/ipns/${trimmed.slice(7)}`;
  }
  if (trimmed.startsWith("ar://")) {
    return `https://arweave.net/${trimmed.slice(5)}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    try {
      const parsed = new URL(`https://${trimmed}`);
      return parsed.toString();
    } catch {
      return null;
    }
  }

  return null;
}

function buildGatewayUrl(
  protocol: EnsContenthash["protocol"],
  value: string
): string | null {
  if (!value) {
    return null;
  }

  switch (protocol) {
    case "ipfs":
      return `https://cf-ipfs.com/ipfs/${value.replaceAll(/^ipfs:\/\//i, "")}`;
    case "ipns":
      return `https://cf-ipfs.com/ipns/${value.replaceAll(/^ipns:\/\//i, "")}`;
    case "arweave":
      return `https://arweave.net/${value.replaceAll(/^ar:\/\//i, "")}`;
    default:
      return null;
  }
}

function decodeEnsContenthash(
  value: Hex | null | undefined
): ContenthashResult {
  if (!value || value === "0x") {
    return null;
  }

  try {
    const codec = contentHash.getCodec(value) ?? "";
    const decoded = contentHash.decode(value) as string;

    if (codec === "ipfs") {
      const uri = decoded.startsWith("ipfs://") ? decoded : `ipfs://${decoded}`;
      return {
        protocol: "ipfs",
        decoded: uri,
        gatewayUrl: buildGatewayUrl("ipfs", uri),
      };
    }

    if (codec === "ipns") {
      const uri = decoded.startsWith("ipns://") ? decoded : `ipns://${decoded}`;
      return {
        protocol: "ipns",
        decoded: uri,
        gatewayUrl: buildGatewayUrl("ipns", uri),
      };
    }

    if (codec === "arweave") {
      const uri = decoded.startsWith("ar://") ? decoded : `ar://${decoded}`;
      return {
        protocol: "arweave",
        decoded: uri,
        gatewayUrl: buildGatewayUrl("arweave", uri),
      };
    }

    return {
      protocol: "other",
      decoded,
      gatewayUrl: null,
    };
  } catch {
    return {
      protocol: "other",
      decoded: null,
      gatewayUrl: null,
    };
  }
}

function ensureChecksumAddress(address: NullableAddress): Address | null {
  if (!address || address === zeroAddress) {
    return null;
  }

  if (!isAddress(address)) {
    return null;
  }

  try {
    return getAddress(address);
  } catch {
    return null;
  }
}

function createLinksForName(
  normalized: string,
  address: string | null
): EnsLinks {
  return {
    app: `https://app.ens.domains/${encodeURIComponent(normalized)}`,
    ...(address
      ? { etherscan: `https://etherscan.io/address/${address}` }
      : {}),
  };
}

function createLinksForAddress(address: string): EnsLinks {
  return {
    app: `https://app.ens.domains/address/${address}`,
    etherscan: `https://etherscan.io/address/${address}`,
  };
}

function isEthSecondLevel(normalized: string): boolean {
  const parts = normalized.toLowerCase().split(".");
  return parts.length === 2 && parts[1] === "eth";
}

function safeNumber(value: bigint): number | null {
  if (value <= BigInt(0)) {
    return null;
  }

  const asNumber = Number(value);
  if (!Number.isSafeInteger(asNumber)) {
    return null;
  }

  return asNumber;
}

async function loadOwnership(
  normalized: string,
  node: Hex
): Promise<EnsOwnership> {
  const cacheKey = normalized.toLowerCase();
  const cached = fromCache(ownershipCache, cacheKey);
  if (cached) {
    return cached;
  }

  let registryOwner: string | null = null;
  let registrant: string | null = null;
  let expiry: number | null = null;
  let gracePeriodEnds: number | null = null;
  let isWrapped = false;

  try {
    registryOwner = ensureChecksumAddress(
      await publicClient.readContract({
        address: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: "owner",
        args: [node],
      })
    );
  } catch {
    registryOwner = null;
  }

  isWrapped = Boolean(
    registryOwner &&
      registryOwner.toLowerCase() === NAME_WRAPPER_ADDRESS.toLowerCase()
  );

  if (isEthSecondLevel(normalized)) {
    const [label] = normalized.split(".");
    const labelHash = labelhash(label);
    const labelHashBigInt = BigInt(labelHash);

    try {
      registrant = ensureChecksumAddress(
        await publicClient.readContract({
          address: BASE_REGISTRAR_ADDRESS,
          abi: BASE_REGISTRAR_ABI,
          functionName: "ownerOf",
          args: [labelHashBigInt],
        })
      );
    } catch {
      registrant = null;
    }

    try {
      const expiryRaw = await publicClient.readContract({
        address: BASE_REGISTRAR_ADDRESS,
        abi: BASE_REGISTRAR_ABI,
        functionName: "nameExpires",
        args: [labelHashBigInt],
      });
      expiry = safeNumber(expiryRaw);
      if (expiry) {
        const grace = expiryRaw + BigInt(90 * 24 * 60 * 60);
        const graceNumber = safeNumber(grace);
        gracePeriodEnds = graceNumber;
      }
    } catch {
      expiry = null;
    }
  }

  if (isWrapped) {
    try {
      const [, , wrapperExpiry] = await publicClient.readContract({
        address: NAME_WRAPPER_ADDRESS,
        abi: NAME_WRAPPER_ABI,
        functionName: "getData",
        args: [BigInt(node)],
      });
      const wrapperExpiryNumber = safeNumber(wrapperExpiry);
      if (wrapperExpiryNumber && (!expiry || wrapperExpiryNumber > expiry)) {
        expiry = wrapperExpiryNumber;
      }
    } catch {
      // ignore wrapper errors
    }
  }

  const ownership: EnsOwnership = {
    registryOwner,
    isWrapped,
    registrant,
    expiry,
    ...(gracePeriodEnds === null ? {} : { gracePeriodEnds }),
  };

  storeCache(ownershipCache, cacheKey, ownership, OWNERSHIP_CACHE_TTL_MS);

  return ownership;
}

async function fetchTextRecords(
  normalized: string
): Promise<Partial<Record<TextRecordKey, string | null>>> {
  const result: Partial<Record<TextRecordKey, string | null>> = {};

  await Promise.all(
    TEXT_RECORD_KEYS.map(async (key) => {
      try {
        const value = await publicClient.getEnsText({ name: normalized, key });
        result[key] = sanitizeRecordValue(value, key);
      } catch {
        result[key] = null;
      }
    })
  );

  return result;
}

async function fetchEnsName(input: string): Promise<EnsNamePreview> {
  const cacheKey = input.toLowerCase();
  const cached = fromCache(nameCache, cacheKey);
  if (cached) {
    return cached;
  }

  const { normalized, display } = normalizeEnsName(input);
  const node = namehash(normalized);

  const resolver = await publicClient
    .getEnsResolver({ name: normalized })
    .then((resolverAddress) => ensureChecksumAddress(resolverAddress))
    .catch(() => null);

  const [address, avatarUrl, records, contenthash, ownership] =
    (await Promise.all([
      publicClient
        .getEnsAddress({ name: normalized })
        .then((resolved) => ensureChecksumAddress(resolved))
        .catch(() => null),
      publicClient
        .getEnsAvatar({ name: normalized })
        .then((avatar) => sanitizeUrl(avatar))
        .catch(() => null),
      fetchTextRecords(normalized),
      (async () => {
        if (!resolver) {
          return null;
        }
        try {
          const raw = await publicClient.readContract({
            address: resolver as Address,
            abi: PUBLIC_RESOLVER_ABI,
            functionName: "contenthash",
            args: [node],
          });
          return decodeEnsContenthash(raw);
        } catch {
          return null;
        }
      })(),
      loadOwnership(normalized, node),
    ])) as [
      Address | null,
      string | null,
      Partial<Record<TextRecordKey, string | null>>,
      EnsContenthash | null,
      EnsOwnership
    ];

  const sanitizedRecords: Partial<Record<TextRecordKey, string | null>> = {};
  for (const key of TEXT_RECORD_KEYS) {
    const value = records[key] ?? null;
    sanitizedRecords[key] = key === "url" ? sanitizeUrl(value) : value;
  }

  const preview: EnsNamePreview = {
    type: "ens.name",
    chainId: CHAIN_ID,
    name: display,
    normalized,
    address,
    resolver,
    avatarUrl,
    records: sanitizedRecords,
    contenthash,
    ownership,
    links: createLinksForName(normalized, address),
  };

  storeCache(nameCache, cacheKey, preview, NAME_CACHE_TTL_MS);

  return preview;
}

async function fetchEnsAddress(address: string): Promise<EnsAddressPreview> {
  const cacheKey = address.toLowerCase();
  const cached = fromCache(addressCache, cacheKey);
  if (cached) {
    return cached;
  }

  const checksummed = getAddress(address);

  const primaryName = await publicClient
    .getEnsName({ address: checksummed })
    .catch(() => null);

  let forwardMatch = false;
  let avatarUrl: string | null = null;

  if (primaryName) {
    try {
      const resolvedAddress = await publicClient.getEnsAddress({
        name: primaryName,
      });
      forwardMatch = Boolean(
        resolvedAddress && getAddress(resolvedAddress) === checksummed
      );
    } catch {
      forwardMatch = false;
    }

    if (forwardMatch) {
      avatarUrl = await publicClient
        .getEnsAvatar({ name: primaryName })
        .then((value) => sanitizeUrl(value))
        .catch(() => null);
    }
  }

  const preview: EnsAddressPreview = {
    type: "ens.address",
    chainId: CHAIN_ID,
    address: checksummed,
    primaryName,
    forwardMatch,
    avatarUrl,
    links: createLinksForAddress(checksummed),
  };

  storeCache(addressCache, cacheKey, preview, ADDRESS_CACHE_TTL_MS);

  return preview;
}

export async function fetchEnsPreview(target: EnsTarget): Promise<EnsPreview> {
  if (target.kind === "name") {
    return fetchEnsName(target.input);
  }

  return fetchEnsAddress(target.input);
}

export { detectEnsTarget } from "@/lib/ens/detect";
