import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { BoundedResultCache } from "@/lib/cache/boundedResultCache";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";
import { normaliseAddress, resolveNetwork } from "@/services/alchemy/utils";
import type { SupportedChain } from "@/types/nft";
import { fetchAlchemyJson } from "../fetchAlchemyJson";
import { readJsonBody } from "../readJsonBody";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const MAX_BATCH_SIZE = 100;
const MAX_TOKENS_PER_REQUEST = 100;
const MAX_BODY_BYTES = 32 * 1024;
const CACHE_TTL_MS = 5 * 60 * 1000;
// A full 100-token batch is usually well under 1 MB. Collections that keep
// metadata on-chain (inline base64 images) are far larger, so allow ample
// headroom before refusing a batch.
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
// Cached batches are bounded by memory, not count. A batch larger than the
// per-entry cap is served but not kept.
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const MAX_CACHE_ENTRY_BYTES = 8 * 1024 * 1024;
const TOKEN_ID_DECIMAL_PATTERN = /^(0|[1-9]\d{0,77})$/;
const TOKEN_ID_HEX_PATTERN = /^0x[\da-fA-F]{1,64}$/;

type TokenMetadataRequestBody = {
  readonly address?: unknown;
  readonly tokenIds?: unknown;
  readonly tokens?: unknown;
  readonly chain?: unknown;
};

type TokenToFetch = { contractAddress: string; tokenId: string };

type ParseResult =
  | { ok: true; tokens: TokenToFetch[]; chain: SupportedChain }
  | { ok: false; response: NextResponse };

const batchCache = new BoundedResultCache<unknown[]>({
  maxBytes: MAX_CACHE_BYTES,
  maxEntryBytes: MAX_CACHE_ENTRY_BYTES,
});

const enforceRateLimit = createClientRateLimiter({
  limit: 120,
  windowMs: 60 * 1000,
  errorMessage: "Too many token metadata requests",
});

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
  let tokenId: string | null = null;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    tokenId = String(value);
  }
  if (typeof value === "string") {
    tokenId = value.trim();
  }

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

  const hasAddress =
    address !== undefined && address !== null && address !== "";

  if (hasAddress && tokenIds !== undefined && !Array.isArray(tokenIds)) {
    return {
      ok: false,
      response: jsonError("tokenIds must be an array"),
    };
  }

  if (hasAddress && Array.isArray(tokenIds) && tokenIds.length > 0) {
    return withChain(parseAddressAndIds(address, tokenIds), chain);
  }

  return {
    ok: false,
    response: jsonError("Either tokens OR (address and tokenIds) are required"),
  };
}

function getTokenKey(token: TokenToFetch): string {
  return `${token.contractAddress.toLowerCase()}:${token.tokenId}`;
}

/**
 * One entry per distinct token, in a fixed order, so the same set of tokens
 * always maps to the same upstream batch and cache entry whatever order or
 * repetition the caller used.
 */
function canonicaliseTokens(tokens: readonly TokenToFetch[]): TokenToFetch[] {
  const byKey = new Map<string, TokenToFetch>();
  for (const token of tokens) {
    const key = getTokenKey(token);
    if (!byKey.has(key)) {
      byKey.set(key, token);
    }
  }
  return Array.from(byKey.entries())
    .sort(([left], [right]) => {
      if (left < right) {
        return -1;
      }
      return left > right ? 1 : 0;
    })
    .map(([, token]) => token);
}

function getBatchCacheKey(
  chain: SupportedChain,
  tokens: readonly TokenToFetch[]
): string {
  return `${chain}:${tokens.map(getTokenKey).join("|")}`;
}

class AlchemyBatchError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("Failed to fetch token metadata");
    this.name = "AlchemyBatchError";
    this.status = status;
  }
}

function readResponseTokens(payload: unknown): unknown[] {
  if (!isRecord(payload)) {
    return [];
  }
  const tokens = payload["tokens"] ?? payload["nfts"];
  return Array.isArray(tokens) ? tokens : [];
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
  return batchCache.load(
    getBatchCacheKey(chain, tokens),
    async (jobSignal) => {
      const result = await fetchAlchemyJson(url, {
        maxBytes: MAX_RESPONSE_BYTES,
        signal: jobSignal,
        jsonBody: { tokens },
      });
      if (!result.ok) {
        throw new AlchemyBatchError(result.status);
      }
      return {
        value: readResponseTokens(result.payload),
        // The parsed value is held in memory as JavaScript strings, about
        // two bytes for each character of the response text.
        bytes: result.text.length * 2,
        ttlMs: CACHE_TTL_MS,
      };
    },
    signal
  );
}

export async function POST(request: NextRequest) {
  const bodyResult = await readJsonBody<TokenMetadataRequestBody>({
    request,
    maxBodyBytes: MAX_BODY_BYTES,
    jsonError,
  });
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const parseResult = parseRequestBody(bodyResult.body);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { chain } = parseResult;
  const tokensToFetch = canonicaliseTokens(parseResult.tokens);

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
    if (error instanceof AlchemyBatchError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE_HEADERS }
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
