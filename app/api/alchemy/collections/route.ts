import { NextRequest, NextResponse } from "next/server";

import { searchNftCollections } from "@/services/alchemy-api";
import type { SupportedChain } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  if (!query.trim()) {
    return NextResponse.json(
      { error: "query is required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const chain = (searchParams.get("chain") ?? "ethereum") as SupportedChain;
  const hideSpam = searchParams.get("hideSpam") !== "0" &&
    searchParams.get("hideSpam") !== "false";
  const pageKey = searchParams.get("pageKey") ?? undefined;

  try {
    const result = await searchNftCollections({
      query,
      chain,
      hideSpam,
      pageKey,
      signal: request.signal,
    });
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search NFT collections";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
