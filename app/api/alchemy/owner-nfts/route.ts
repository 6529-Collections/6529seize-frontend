import { NextRequest, NextResponse } from "next/server";

import { getNftsForContractAndOwner } from "@/services/alchemy-api";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdRaw = searchParams.get("chainId");
  const contract = searchParams.get("contract");
  const owner = searchParams.get("owner");
  const pageKey = searchParams.get("pageKey") ?? undefined;

  const chainId = chainIdRaw ? Number(chainIdRaw) : NaN;

  if (!Number.isFinite(chainId)) {
    return NextResponse.json(
      { error: "chainId is required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
  if (!contract || !owner) {
    return NextResponse.json(
      { error: "contract and owner are required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const nfts = await getNftsForContractAndOwner(
      chainId,
      contract,
      owner,
      [],
      pageKey,
      0,
      request.signal
    );
    return NextResponse.json(nfts, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch NFTs for owner";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
