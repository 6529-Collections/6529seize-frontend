import { NextRequest, NextResponse } from "next/server";

import { getTokensMetadata } from "@/services/alchemy-api";
import type { SupportedChain, TokenMetadata } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

type TokenMetadataRequestBody = {
  readonly address?: `0x${string}`;
  readonly tokenIds?: string[];
  readonly tokens?: { contract: string; tokenId: string }[];
  readonly chain?: SupportedChain;
};

type SerializableTokenMetadata = Omit<TokenMetadata, "tokenId"> & {
  readonly tokenId: string;
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

  if (
    (!tokens || tokens.length === 0) &&
    (!address || !Array.isArray(tokenIds) || tokenIds.length === 0)
  ) {
    return NextResponse.json(
      { error: "Either tokens OR (address and tokenIds) are required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const metadata = await getTokensMetadata({
      address,
      tokenIds,
      tokens,
      chain,
      signal: request.signal,
    });
    const serializable: SerializableTokenMetadata[] = metadata.map(
      (entry) => ({
        ...entry,
        tokenId: entry.tokenId.toString(),
      })
    );
    return NextResponse.json(serializable, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch token metadata";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
