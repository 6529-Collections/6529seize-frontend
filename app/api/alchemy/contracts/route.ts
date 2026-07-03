import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { normaliseAddress } from "@/services/alchemy/utils";
import type { SupportedChain } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const MAX_CONTRACTS_PER_REQUEST = 50;
const MAX_BODY_BYTES = 16 * 1024;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

const NETWORK_MAP: Record<SupportedChain, string> = {
  ethereum: "eth-mainnet",
};

type ContractRequest = {
  readonly address: `0x${string}`;
  readonly chain: SupportedChain;
};

type ContractResponseEntry = {
  readonly address: `0x${string}`;
  readonly chain: SupportedChain;
  readonly metadata: Record<string, unknown> | null;
  readonly error?: string | undefined;
  readonly status?: number | undefined;
};

type ParseResult =
  | { ok: true; contracts: ContractRequest[] }
  | { ok: false; response: NextResponse };

type CacheEntry = {
  readonly expiresAt: number;
  readonly entry: ContractResponseEntry;
};

const contractCache = new Map<string, CacheEntry>();

function resolveNetwork(chain: SupportedChain): string {
  return NETWORK_MAP[chain];
}

function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: NO_STORE_HEADERS }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseChain(value: unknown): SupportedChain | null {
  if (value === undefined || value === null || value === "") {
    return "ethereum";
  }
  return value === "ethereum" ? "ethereum" : null;
}

function parseContractAddress(value: unknown): `0x${string}` | null {
  if (typeof value !== "string" || !isValidEthAddress(value)) {
    return null;
  }
  return normaliseAddress(value);
}

function getContractCacheKey(
  address: `0x${string}`,
  chain: SupportedChain
): string {
  return `${chain}:${address.toLowerCase()}`;
}

function getCachedContract(
  address: `0x${string}`,
  chain: SupportedChain,
  now = Date.now()
): ContractResponseEntry | null {
  const key = getContractCacheKey(address, chain);
  const cached = contractCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= now) {
    contractCache.delete(key);
    return null;
  }
  return cached.entry;
}

function pruneContractCache(now = Date.now()): void {
  contractCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      contractCache.delete(key);
    }
  });

  while (contractCache.size >= MAX_CACHE_ENTRIES) {
    const oldestEntry = contractCache.keys().next();
    if (oldestEntry.done) {
      break;
    }
    contractCache.delete(oldestEntry.value);
  }
}

function setCachedContract(entry: ContractResponseEntry): void {
  pruneContractCache();
  contractCache.set(getContractCacheKey(entry.address, entry.chain), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    entry,
  });
}

function contractErrorEntry(
  contract: ContractRequest,
  error = "Failed to fetch contract metadata",
  status = 502
): ContractResponseEntry {
  return {
    address: contract.address,
    chain: contract.chain,
    metadata: null,
    error,
    status,
  };
}

async function readJsonBody(
  request: NextRequest
): Promise<
  { ok: true; body: unknown } | { ok: false; response: NextResponse }
> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (
      !Number.isFinite(contentLength) ||
      contentLength < 0 ||
      contentLength > MAX_BODY_BYTES
    ) {
      return {
        ok: false,
        response: jsonError("Request body is too large", 413),
      };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, response: jsonError("Invalid JSON payload") };
  }

  const decoder = new TextDecoder();
  let totalBytes = 0;
  let rawBody = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      return {
        ok: false,
        response: jsonError("Request body is too large", 413),
      };
    }
    rawBody += decoder.decode(value, { stream: true });
  }

  rawBody += decoder.decode();

  try {
    const parsedBody: unknown = JSON.parse(rawBody);
    return { ok: true, body: parsedBody };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON payload") };
  }
}

function parseRequestBody(body: unknown): ParseResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      response: jsonError("Payload must be a JSON object"),
    };
  }

  const rawContracts = body["contracts"];
  if (!Array.isArray(rawContracts)) {
    return {
      ok: false,
      response: jsonError("contracts must be an array"),
    };
  }

  if (rawContracts.length > MAX_CONTRACTS_PER_REQUEST) {
    return {
      ok: false,
      response: jsonError(
        `Maximum ${MAX_CONTRACTS_PER_REQUEST} contracts per request`,
        413
      ),
    };
  }

  const contracts: ContractRequest[] = [];
  const seen = new Set<string>();

  for (const contract of rawContracts) {
    if (!isRecord(contract)) {
      return {
        ok: false,
        response: jsonError("Each contract must include address and chain"),
      };
    }

    const address = parseContractAddress(contract["address"]);
    if (!address) {
      return {
        ok: false,
        response: jsonError("Invalid contract address"),
      };
    }

    const chain = parseChain(contract["chain"]);
    if (!chain) {
      return {
        ok: false,
        response: jsonError("Unsupported chain"),
      };
    }

    const cacheKey = getContractCacheKey(address, chain);
    if (!seen.has(cacheKey)) {
      seen.add(cacheKey);
      contracts.push({ address, chain });
    }
  }

  return { ok: true, contracts };
}

async function fetchContractMetadata({
  address,
  apiKey,
  chain,
  signal,
}: ContractRequest & {
  readonly apiKey: string;
  readonly signal: AbortSignal;
}): Promise<ContractResponseEntry> {
  const cached = getCachedContract(address, chain);
  if (cached) {
    return cached;
  }

  const network = resolveNetwork(chain);
  const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata?contractAddress=${address}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (response.status === 404) {
    const entry: ContractResponseEntry = { address, chain, metadata: null };
    setCachedContract(entry);
    return entry;
  }

  if (!response.ok) {
    return {
      address,
      chain,
      metadata: null,
      error: "Failed to fetch contract metadata",
      status: response.status,
    };
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    return {
      address,
      chain,
      metadata: null,
      error: "Invalid contract metadata response",
      status: response.status,
    };
  }

  const entry: ContractResponseEntry = {
    address,
    chain,
    metadata: { ...payload, _checksum: address },
  };
  setCachedContract(entry);
  return entry;
}

async function fetchContractMetadataEntry({
  apiKey,
  contract,
  signal,
}: {
  readonly apiKey: string;
  readonly contract: ContractRequest;
  readonly signal: AbortSignal;
}): Promise<ContractResponseEntry> {
  try {
    return await fetchContractMetadata({
      ...contract,
      apiKey,
      signal,
    });
  } catch {
    return contractErrorEntry(contract);
  }
}

export async function POST(request: NextRequest) {
  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const parseResult = parseRequestBody(bodyResult.body);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  try {
    const apiKey = getAlchemyApiKey();
    const contracts = await Promise.all(
      parseResult.contracts.map((contract) =>
        fetchContractMetadataEntry({
          apiKey,
          contract,
          signal: request.signal,
        })
      )
    );

    return NextResponse.json({ contracts }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch contract metadata";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
