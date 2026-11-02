import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import pLimit from "p-limit";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { isValidEthAddress } from "@/helpers/Helpers";
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";
import { normaliseAddress } from "@/services/alchemy/utils";
import type { SupportedChain } from "@/types/nft";
import {
  type ContractMetadataEntry,
  fetchContractMetadata,
  getContractCacheKey,
} from "../contractMetadata";
import { readJsonBody } from "../readJsonBody";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const MAX_CONTRACTS_PER_REQUEST = 50;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_CONCURRENT_LOOKUPS_PER_REQUEST = 10;

// Each requested contract counts against the client's lookup budget.
const enforceRateLimit = createClientRateLimiter({
  limit: 600,
  windowMs: 60 * 1000,
  errorMessage: "Too many contract metadata requests",
});

type ContractRequest = {
  readonly address: `0x${string}`;
  readonly chain: SupportedChain;
};

type ParseResult =
  | { ok: true; contracts: ContractRequest[] }
  | { ok: false; response: NextResponse };

function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: NO_STORE_HEADERS }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseChain(value: unknown): SupportedChain | null {
  if (value === undefined || value === null || value === "") {
    return "ethereum";
  }
  return value === "ethereum" ? "ethereum" : null;
}

function parseContractAddress(value: unknown): `0x${string}` | null {
  if (typeof value !== "string" || !isValidEthAddress(value)) {
    return null;
  }
  return normaliseAddress(value);
}

function contractErrorEntry(
  contract: ContractRequest,
  error = "Failed to fetch contract metadata",
  status = 502
): ContractMetadataEntry {
  return {
    address: contract.address,
    chain: contract.chain,
    metadata: null,
    error,
    status,
  };
}

function parseRequestBody(body: unknown): ParseResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      response: jsonError("Payload must be a JSON object"),
    };
  }

  const rawContracts = body["contracts"];
  if (!Array.isArray(rawContracts)) {
    return {
      ok: false,
      response: jsonError("contracts must be an array"),
    };
  }

  if (rawContracts.length > MAX_CONTRACTS_PER_REQUEST) {
    return {
      ok: false,
      response: jsonError(
        `Maximum ${MAX_CONTRACTS_PER_REQUEST} contracts per request`,
        413
      ),
    };
  }

  const contracts: ContractRequest[] = [];
  const seen = new Set<string>();

  for (const contract of rawContracts) {
    if (!isRecord(contract)) {
      return {
        ok: false,
        response: jsonError("Each contract must include address and chain"),
      };
    }

    const address = parseContractAddress(contract["address"]);
    if (!address) {
      return {
        ok: false,
        response: jsonError("Invalid contract address"),
      };
    }

    const chain = parseChain(contract["chain"]);
    if (!chain) {
      return {
        ok: false,
        response: jsonError("Unsupported chain"),
      };
    }

    const cacheKey = getContractCacheKey(address, chain);
    if (!seen.has(cacheKey)) {
      seen.add(cacheKey);
      contracts.push({ address, chain });
    }
  }

  return { ok: true, contracts };
}

async function fetchContractMetadataEntry({
  apiKey,
  contract,
  signal,
}: {
  readonly apiKey: string;
  readonly contract: ContractRequest;
  readonly signal: AbortSignal;
}): Promise<ContractMetadataEntry> {
  try {
    return await fetchContractMetadata({
      ...contract,
      apiKey,
      signal,
    });
  } catch {
    return contractErrorEntry(contract);
  }
}

export async function POST(request: NextRequest) {
  const bodyResult = await readJsonBody<unknown>({
    request,
    maxBodyBytes: MAX_BODY_BYTES,
    jsonError,
  });
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const parseResult = parseRequestBody(bodyResult.body);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const rateLimitResponse = enforceRateLimit(
    request,
    parseResult.contracts.length
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const apiKey = getAlchemyApiKey();
    const limitLookup = pLimit(MAX_CONCURRENT_LOOKUPS_PER_REQUEST);
    const contracts = await Promise.all(
      parseResult.contracts.map((contract) =>
        limitLookup(() =>
          fetchContractMetadataEntry({
            apiKey,
            contract,
            signal: request.signal,
          })
        )
      )
    );

    return NextResponse.json({ contracts }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch contract metadata";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
