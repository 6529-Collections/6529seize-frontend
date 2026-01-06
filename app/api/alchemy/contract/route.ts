import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { normaliseAddress } from "@/services/alchemy/utils";
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
  const address = searchParams.get("address");
  if (!address || !isValidEthAddress(address)) {
    return NextResponse.json(
      { error: "address is required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const checksum = normaliseAddress(address);
  if (!checksum) {
    return NextResponse.json(null, { headers: NO_STORE_HEADERS });
  }

  const chain = (searchParams.get("chain") ?? "ethereum") as SupportedChain;

  try {
    const apiKey = getAlchemyApiKey();
    const network = resolveNetwork(chain);
    const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata?contractAddress=${checksum}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: request.signal,
    });

    if (response.status === 404) {
      return NextResponse.json(null, { headers: NO_STORE_HEADERS });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch contract metadata" },
        { status: response.status, headers: NO_STORE_HEADERS }
      );
    }

    const payload = await response.json();
    return NextResponse.json(
      { ...payload, _checksum: checksum },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch contract metadata";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
