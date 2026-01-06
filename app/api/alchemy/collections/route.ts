import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import type { SupportedChain } from "@/types/nft";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const NETWORK_MAP: Record<SupportedChain, string> = {
  ethereum: "eth-mainnet",
};

function resolveNetwork(chain: SupportedChain = "ethereum"): string {
  return NETWORK_MAP[chain] ?? NETWORK_MAP.ethereum;
}

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
  const pageKey = searchParams.get("pageKey") ?? undefined;

  try {
    const apiKey = getAlchemyApiKey();
    const network = resolveNetwork(chain);
    const url = new URL(
      `https://${network}.g.alchemy.com/nft/v3/${apiKey}/searchContractMetadata`
    );
    url.searchParams.set("query", query.trim());
    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: request.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to search NFT collections" },
        { status: response.status, headers: NO_STORE_HEADERS }
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to search NFT collections";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
