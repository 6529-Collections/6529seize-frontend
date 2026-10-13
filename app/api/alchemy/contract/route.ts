import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";
import { normaliseAddress } from "@/services/alchemy/utils";
import { fetchContractMetadata } from "../contractMetadata";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
// Matches the server-side contract metadata cache lifetime.
const CACHEABLE_HEADERS = { "Cache-Control": "private, max-age=300" };

const enforceRateLimit = createClientRateLimiter({
  limit: 120,
  windowMs: 60 * 1000,
  errorMessage: "Too many contract metadata requests",
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address || !isValidEthAddress(address)) {
    return NextResponse.json(
      { error: "address is required" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const chain = searchParams.get("chain");
  if (chain !== null && chain !== "ethereum") {
    return NextResponse.json(
      { error: "Unsupported chain" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const checksum = normaliseAddress(address);
  if (!checksum) {
    return NextResponse.json(null, { headers: NO_STORE_HEADERS });
  }

  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const entry = await fetchContractMetadata({
      address: checksum,
      apiKey: getAlchemyApiKey(),
      chain: "ethereum",
      signal: request.signal,
    });

    if (entry.error) {
      return NextResponse.json(
        { error: entry.error },
        { status: entry.status ?? 502, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(entry.metadata, { headers: CACHEABLE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch contract metadata";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
