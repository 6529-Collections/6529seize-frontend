import { NextRequest, NextResponse } from "next/server";

import { getContractOverview } from "@/services/alchemy-api";
import type { SupportedChain } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") as `0x${string}` | null;
  if (!address) {
    return NextResponse.json(
      { error: "address is required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const chain = (searchParams.get("chain") ?? "ethereum") as SupportedChain;

  try {
    const overview = await getContractOverview({
      address,
      chain,
      signal: request.signal,
    });
    return NextResponse.json(overview, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch contract metadata";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
