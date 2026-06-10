import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { fetchPublicJson, UrlGuardError } from "@/lib/security/urlGuard";
import { normaliseAddress, resolveNetwork } from "@/services/alchemy/utils";
import type { SupportedChain } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const MAX_BATCH_SIZE = 100;
const MAX_TOKENS_PER_REQUEST = 100;
const MAX_BODY_BYTES = 32 * 1024;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const ANONYMOUS_RATE_LIMIT = 20;
const AUTHENTICATED_RATE_LIMIT = 60;
const MAX_RATE_LIMIT_BUCKETS = 1000;
const WALLET_AUTH_COOKIE = "wallet-auth";
const TOKEN_ID_DECIMAL_PATTERN = /^(0|[1-9][0-9]{0,77})$/;
const TOKEN_ID_HEX_PATTERN = /^0x[0-9a-fA-F]{1,64}$/;

type TokenMetadataRequestBody = {
  readonly address?: unknown;
  readonly tokenIds?: unknown;
  readonly tokens?: unknown;
  readonly chain?: unknown;
};

type TokenToFetch = { contractAddress: string; tokenId: string };
type BatchCacheEntry = { expiresAt: number; tokens: unknown[] };
type RateLimitEntry = { count: number; resetAt: number };

type ParseResult =
  | { ok: true; tokens: TokenToFetch[]; chain: SupportedChain }
  | { ok: false; response: NextResponse };

const batchCache = new Map<string, BatchCacheEntry>();
const rateLimitBuckets = new Map<string, RateLimitEntry>();

function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: NO_STORE_HEADERS }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseChain(chain: unknown): SupportedChain | null {
  if (chain === undefined || chain === null || chain === "") {
    return "ethereum";
  }
  return chain === "ethereum" ? "ethereum" : null;
}

function normaliseTokenId(value: unknown): string | null {
  const tokenId =
    typeof value === "number"
      ? Number.isSafeInteger(value) && value >= 0
        ? String(value)
        : null
      : typeof value === "string"
        ? value.trim()
        : null;

  if (!tokenId) {
    return null;
  }
  if (TOKEN_ID_HEX_PATTERN.test(tokenId)) {
    return tokenId.toLowerCase();
  }
  if (TOKEN_ID_DECIMAL_PATTERN.test(tokenId)) {
    return tokenId;
  }
  return null;
}

function parseContractAddress(value: unknown): `0x${string}` | null {
  if (typeof value !== "string" || !isValidEthAddress(value)) {
    return null;
  }
  return normaliseAddress(value);
}

function parseTokensArray(tokens: unknown[]): ParseResult {
  if (tokens.length > MAX_TOKENS_PER_REQUEST) {
    return {
      ok: false,
      response: jsonError(
        `Maximum ${MAX_TOKENS_PER_REQUEST} tokens per request`,
        413
      ),
    };
  }

  const results: TokenToFetch[] = [];
  for (const token of tokens) {
    if (!isRecord(token)) {
      return {
        ok: false,
        response: jsonError("Each token must include contract and tokenId"),
      };
    }

    const contractAddress = parseContractAddress(token["contract"]);
    if (!contractAddress) {
      return {
        ok: false,
        response: jsonError("Invalid contract address"),
      };
    }

    const tokenId = normaliseTokenId(token["tokenId"]);
    if (!tokenId) {
      return {
        ok: false,
        response: jsonError("Invalid tokenId"),
      };
    }

    results.push({ contractAddress, tokenId });
  }
  return { ok: true, tokens: results, chain: "ethereum" };
}

function parseAddressAndIds(
  address: unknown,
  tokenIds: unknown[]
): ParseResult {
  if (tokenIds.length > MAX_TOKENS_PER_REQUEST) {
    return {
      ok: false,
      response: jsonError(
        `Maximum ${MAX_TOKENS_PER_REQUEST} tokens per request`,
        413
      ),
    };
  }

  const checksum = parseContractAddress(address);
  if (!checksum) {
    return {
      ok: false,
      response: jsonError("Invalid contract address"),
    };
  }

  const parsedTokenIds: string[] = [];
  for (const tokenIdValue of tokenIds) {
    const tokenId = normaliseTokenId(tokenIdValue);
    if (!tokenId) {
      return {
        ok: false,
        response: jsonError("Invalid tokenId"),
      };
    }
    parsedTokenIds.push(tokenId);
  }

  return {
    ok: true,
    tokens: parsedTokenIds.map((tokenId) => ({
      contractAddress: checksum,
      tokenId,
    })),
    chain: "ethereum",
  };
}

function withChain(result: ParseResult, chain: SupportedChain): ParseResult {
  return result.ok ? { ...result, chain } : result;
}

function parseRequestBody(body: TokenMetadataRequestBody): ParseResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      response: jsonError("Payload must be a JSON object"),
    };
  }

  const { address, tokenIds, tokens } = body;
  const chain = parseChain(body.chain);
  if (!chain) {
    return {
      ok: false,
      response: jsonError("Unsupported chain"),
    };
  }

  if (tokens !== undefined && !Array.isArray(tokens)) {
    return {
      ok: false,
      response: jsonError("tokens must be an array"),
    };
  }

  if (Array.isArray(tokens) && tokens.length > 0) {
    return withChain(parseTokensArray(tokens), chain);
  }

  if (address && tokenIds !== undefined && !Array.isArray(tokenIds)) {
    return {
      ok: false,
      response: jsonError("tokenIds must be an array"),
    };
  }

  if (address && Array.isArray(tokenIds) && tokenIds.length > 0) {
    return withChain(parseAddressAndIds(address, tokenIds), chain);
  }

  return {
    ok: false,
    response: jsonError("Either tokens OR (address and tokenIds) are required"),
  };
}

function getRequestAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")?.trim();
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) {
    return bearer;
  }

  const walletCookie = request.cookies?.get(WALLET_AUTH_COOKIE)?.value?.trim();
  return walletCookie && walletCookie.length > 0 ? walletCookie : null;
}

function getClientAddress(request: NextRequest): string {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (forwardedFor) {
    return forwardedFor;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getRateLimitKey(request: NextRequest): {
  key: string;
  limit: number;
} {
  const authToken = getRequestAuthToken(request);
  if (authToken) {
    return {
      key: `auth:${fingerprint(authToken)}`,
      limit: AUTHENTICATED_RATE_LIMIT,
    };
  }

  const clientAddress = getClientAddress(request);
  const userAgent = request.headers.get("user-agent") ?? "";
  const anonymousIdentity = `${clientAddress}:${userAgent.slice(0, 128)}`;
  return {
    key: `anon:${fingerprint(anonymousIdentity)}`,
    limit: ANONYMOUS_RATE_LIMIT,
  };
}

function pruneRateLimitBuckets(now = Date.now()): void {
  if (rateLimitBuckets.size < MAX_RATE_LIMIT_BUCKETS) {
    return;
  }

  rateLimitBuckets.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  });

  while (rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    const oldestKey = rateLimitBuckets.keys().next().value as
      | string
      | undefined;
    if (!oldestKey) {
      break;
    }
    rateLimitBuckets.delete(oldestKey);
  }
}

function enforceRateLimit(request: NextRequest): NextResponse | null {
  const now = Date.now();
  pruneRateLimitBuckets(now);

  const { key, limit } = getRateLimitKey(request);
  const existing = rateLimitBuckets.get(key);
  const entry =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  entry.count += 1;
  rateLimitBuckets.set(key, entry);

  if (entry.count <= limit) {
    return null;
  }

  const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return NextResponse.json(
    { error: "Too many token metadata requests" },
    {
      status: 429,
      headers: {
        ...NO_STORE_HEADERS,
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

async function readJsonBody(
  request: NextRequest
): Promise<
  | { ok: true; body: TokenMetadataRequestBody }
  | { ok: false; response: NextResponse }
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

  while (true) {
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
    return { ok: true, body: JSON.parse(rawBody) as TokenMetadataRequestBody };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON payload") };
  }
}

function getBatchCacheKey(
  chain: SupportedChain,
  tokens: readonly TokenToFetch[]
): string {
  return `${chain}:${tokens
    .map((token) => `${token.contractAddress.toLowerCase()}:${token.tokenId}`)
    .join("|")}`;
}

function getCachedBatch(key: string, now = Date.now()): unknown[] | null {
  const cached = batchCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= now) {
    batchCache.delete(key);
    return null;
  }
  return cached.tokens;
}

function pruneBatchCache(now = Date.now()): void {
  batchCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      batchCache.delete(key);
    }
  });

  while (batchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = batchCache.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    batchCache.delete(oldestKey);
  }
}

function setCachedBatch(key: string, tokens: unknown[]): void {
  pruneBatchCache();
  batchCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    tokens,
  });
}

async function fetchAlchemyBatch({
  chain,
  url,
  tokens,
  signal,
}: {
  readonly chain: SupportedChain;
  readonly url: string;
  readonly tokens: readonly TokenToFetch[];
  readonly signal: AbortSignal;
}): Promise<unknown[]> {
  const cacheKey = getBatchCacheKey(chain, tokens);
  const cached = getCachedBatch(cacheKey);
  if (cached) {
    return cached;
  }

  const payload = await fetchPublicJson<{
    tokens?: unknown[] | undefined;
    nfts?: unknown[] | undefined;
  }>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ tokens }),
      signal,
    },
    { timeoutMs: 10000 }
  );
  const responseTokens = payload.tokens ?? payload.nfts ?? [];
  setCachedBatch(cacheKey, responseTokens);
  return responseTokens;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const parseResult = parseRequestBody(bodyResult.body);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { tokens: tokensToFetch, chain } = parseResult;

  try {
    const apiKey = getAlchemyApiKey();
    const network = resolveNetwork(chain);
    const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadataBatch`;
    const allTokens: unknown[] = [];

    for (let i = 0; i < tokensToFetch.length; i += MAX_BATCH_SIZE) {
      const slice = tokensToFetch.slice(i, i + MAX_BATCH_SIZE);
      const tokens = await fetchAlchemyBatch({
        chain,
        url,
        tokens: slice,
        signal: request.signal,
      });
      allTokens.push(...tokens);
    }

    return NextResponse.json(
      { tokens: allTokens },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: NO_STORE_HEADERS }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch token metadata";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
