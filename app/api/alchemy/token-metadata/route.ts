import { NextRequest, NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { normaliseAddress } from "@/services/alchemy/utils";
import type { SupportedChain } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const MAX_BATCH_SIZE = 100;

const NETWORK_MAP: Record<SupportedChain, string> = {
  ethereum: "eth-mainnet",
};

function resolveNetwork(chain: SupportedChain = "ethereum"): string {
  return NETWORK_MAP[chain] ?? NETWORK_MAP.ethereum;
}

type TokenMetadataRequestBody = {
  readonly address?: string;
  readonly tokenIds?: string[];
  readonly tokens?: { contract: string; tokenId: string }[];
  readonly chain?: SupportedChain;
};

type TokenToFetch = { contractAddress: string; tokenId: string };

type ParseResult =
  | { ok: true; tokens: TokenToFetch[]; chain: SupportedChain }
  | { ok: false; response: NextResponse };

function parseTokensArray(
  tokens: { contract: string; tokenId: string }[]
): TokenToFetch[] {
  return tokens
    .filter((t) => isValidEthAddress(t.contract))
    .map((t) => ({
      contractAddress: normaliseAddress(t.contract) ?? t.contract,
      tokenId: t.tokenId,
    }));
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
          { tokens: [] },
          { headers: NO_STORE_HEADERS }
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ tokens: slice }),
        signal: request.signal,
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch token metadata" },
          { status: response.status, headers: NO_STORE_HEADERS }
        );
      }

      const payload = await response.json();
      allTokens.push(...(payload.tokens ?? payload.nfts ?? []));
    }

    return NextResponse.json(
      { tokens: allTokens },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch token metadata";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
