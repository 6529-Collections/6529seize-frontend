import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { fetchPublicJson, UrlGuardError } from "@/lib/security/urlGuard";
import { normaliseAddress, resolveNetwork } from "@/services/alchemy/utils";
import type { SupportedChain } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const MAX_BATCH_SIZE = 100;

type TokenMetadataRequestBody = {
  readonly address?: string | undefined;
  readonly tokenIds?: string[] | undefined;
  readonly tokens?: { contract: string; tokenId: string }[] | undefined;
  readonly chain?: SupportedChain | undefined;
};

type TokenToFetch = { contractAddress: string; tokenId: string };

type ParseResult =
  | { ok: true; tokens: TokenToFetch[]; chain: SupportedChain }
  | { ok: false; response: NextResponse };

function parseTokensArray(
  tokens: { contract: string; tokenId: string }[]
): TokenToFetch[] {
  const results: TokenToFetch[] = [];
  for (const t of tokens) {
    const contractAddress = normaliseAddress(t.contract);
    if (contractAddress) {
      results.push({ contractAddress, tokenId: t.tokenId });
    }
  }
  return results;
}

function parseAddressAndIds(
  address: string,
  tokenIds: string[]
): TokenToFetch[] | null {
  if (!isValidEthAddress(address)) {
    return null;
  }
  const checksum = normaliseAddress(address);
  if (!checksum) {
    return [];
  }
  return tokenIds.map((tokenId) => ({ contractAddress: checksum, tokenId }));
}

function parseRequestBody(body: TokenMetadataRequestBody): ParseResult {
  const { address, tokenIds, tokens, chain = "ethereum" } = body ?? {};

  if (tokens && tokens.length > 0) {
    const parsed = parseTokensArray(tokens);
    if (parsed.length === 0) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "No valid contract addresses provided" },
          { status: 400, headers: NO_STORE_HEADERS }
        ),
      };
    }
    return { ok: true, tokens: parsed, chain };
  }

  if (address && Array.isArray(tokenIds) && tokenIds.length > 0) {
    const parsed = parseAddressAndIds(address, tokenIds);
    if (parsed === null) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Invalid contract address" },
          { status: 400, headers: NO_STORE_HEADERS }
        ),
      };
    }
    if (parsed.length === 0) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Normalization failed for the provided address" },
          { status: 400, headers: NO_STORE_HEADERS }
        ),
      };
    }
    return { ok: true, tokens: parsed, chain };
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Either tokens OR (address and tokenIds) are required" },
      { status: 400, headers: NO_STORE_HEADERS }
    ),
  };
}

export async function POST(request: NextRequest) {
  let body: TokenMetadataRequestBody;
  try {
    body = (await request.json()) as TokenMetadataRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parseResult = parseRequestBody(body);
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
      const payload = await fetchPublicJson<{ tokens?: unknown[] | undefined; nfts?: unknown[] | undefined }>(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ tokens: slice }),
          signal: request.signal,
        },
        { timeoutMs: 10000 }
      );
      allTokens.push(...(payload.tokens ?? payload.nfts ?? []));
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
