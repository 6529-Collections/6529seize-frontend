import { NextRequest, NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function resolveNetworkByChainId(chainId: number): string {
  if (chainId === 11155111) return "eth-sepolia";
  if (chainId === 5) return "eth-goerli";
  return "eth-mainnet";
}

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
    const apiKey = getAlchemyApiKey();
    const network = resolveNetworkByChainId(chainId);
    const params = new URLSearchParams();
    params.set("owner", owner);
    params.append("contractAddresses[]", contract);
    if (pageKey) {
      params.set("pageKey", pageKey);
    }
    const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?${params.toString()}`;

    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: request.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch NFTs for owner" },
        { status: response.status, headers: NO_STORE_HEADERS }
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch NFTs for owner";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
