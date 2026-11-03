import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import LruTtlCache from "@/lib/cache/lruTtl";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";
import { normaliseAddress } from "@/services/alchemy/utils";
import { fetchAlchemyJson } from "../fetchAlchemyJson";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const CACHE_TTL_MS = 30 * 1000;
// Matches the server-side owner NFT cache lifetime.
const CACHEABLE_HEADERS = { "Cache-Control": "private, max-age=30" };
// A full 100-token NextGen page is about 0.5 MB; allow ample headroom.
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
// Owner pages are large, so keep only a few recent ones.
const MAX_CACHE_ENTRIES = 25;
// Alchemy page keys are opaque base64-style cursors.
const PAGE_KEY_PATTERN = /^[\w+/=:.-]{1,512}$/;

// The NextGen chains Alchemy still serves: mainnet and Sepolia.
const NETWORKS_BY_CHAIN_ID: ReadonlyMap<number, string> = new Map([
  [1, "eth-mainnet"],
  [11155111, "eth-sepolia"],
]);

// Holds the upstream JSON text, which is smaller than the parsed payload.
const ownerNftsCache = new LruTtlCache<string, string>({
  max: MAX_CACHE_ENTRIES,
  ttlMs: CACHE_TTL_MS,
});

const enforceRateLimit = createClientRateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
  errorMessage: "Too many owner NFT requests",
});

function jsonText(text: string): NextResponse {
  return new NextResponse(text, {
    headers: { ...CACHEABLE_HEADERS, "Content-Type": "application/json" },
  });
}

function jsonError(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 400, headers: NO_STORE_HEADERS }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdRaw = searchParams.get("chainId");
  const contractRaw = searchParams.get("contract");
  const ownerRaw = searchParams.get("owner");
  const pageKeyParam = searchParams.get("pageKey");
  // An empty cursor means the first page, the same as an absent one.
  const pageKey =
    pageKeyParam === null || pageKeyParam === "" ? undefined : pageKeyParam;

  const chainId = chainIdRaw ? Number(chainIdRaw) : Number.NaN;

  if (!Number.isFinite(chainId)) {
    return jsonError("chainId is required");
  }
  if (!contractRaw || !ownerRaw) {
    return jsonError("contract and owner are required");
  }

  const network = NETWORKS_BY_CHAIN_ID.get(chainId);
  if (!network) {
    return jsonError("Unsupported chainId");
  }

  const contract = normaliseAddress(contractRaw);
  const owner = normaliseAddress(ownerRaw);
  if (!contract || !owner) {
    return jsonError("contract and owner must be valid addresses");
  }

  if (pageKey !== undefined && !PAGE_KEY_PATTERN.test(pageKey)) {
    return jsonError("Invalid pageKey");
  }

  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const cacheKey = [network, owner, contract, pageKey ?? ""].join(":");
  const cached = ownerNftsCache.get(cacheKey);
  if (cached !== undefined) {
    return jsonText(cached);
  }

  try {
    const apiKey = getAlchemyApiKey();
    const params = new URLSearchParams();
    params.set("owner", owner);
    params.append("contractAddresses[]", contract);
    if (pageKey) {
      params.set("pageKey", pageKey);
    }
    const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?${params.toString()}`;

    const result = await fetchAlchemyJson(url, {
      maxBytes: MAX_RESPONSE_BYTES,
      signal: request.signal,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Failed to fetch NFTs for owner" },
        { status: result.status, headers: NO_STORE_HEADERS }
      );
    }

    ownerNftsCache.set(cacheKey, result.text);
    return jsonText(result.text);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch NFTs for owner";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
