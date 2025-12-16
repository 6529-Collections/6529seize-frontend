import { NextRequest, NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { normaliseAddress } from "@/helpers/alchemy/response-processing";
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

  const { address, tokenIds, tokens, chain = "ethereum" } = body ?? {};

  let tokensToFetch: { contractAddress: string; tokenId: string }[] = [];

  if (tokens && tokens.length > 0) {
    tokensToFetch = tokens.map((t) => ({
      contractAddress: t.contract,
      tokenId: t.tokenId,
    }));
  } else if (address && Array.isArray(tokenIds) && tokenIds.length > 0) {
    if (!isValidEthAddress(address)) {
      return NextResponse.json(
        { error: "Invalid contract address" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    const checksum = normaliseAddress(address);
    if (!checksum) {
      return NextResponse.json({ tokens: [] }, { headers: NO_STORE_HEADERS });
    }
    tokensToFetch = tokenIds.map((tokenId) => ({
      contractAddress: checksum,
      tokenId,
    }));
  }

  if (tokensToFetch.length === 0) {
    return NextResponse.json(
      { error: "Either tokens OR (address and tokenIds) are required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

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
      const tokens = payload.tokens ?? payload.nfts ?? [];
      allTokens.push(...tokens);
    }

    return NextResponse.json({ tokens: allTokens }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch token metadata";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
