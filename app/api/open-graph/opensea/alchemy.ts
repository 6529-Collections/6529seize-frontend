import { publicEnv } from "@/config/env";
import { getStagingApiKey } from "@/config/serverEnv";

import { extractAlchemyMetadata } from "./shared";
import type { AlchemyNftMetadata, OpenSeaMetadataFetchResult } from "./shared";
import { buildTokenIdCandidates } from "./tokenUri";

const FETCH_TIMEOUT_MS = 8000;

type AlchemyMetadataCandidateResult =
  | {
      readonly kind: "success";
      readonly metadata: AlchemyNftMetadata;
      readonly topLevelKeys: string[];
    }
  | { readonly kind: "http_error"; readonly status: number }
  | { readonly kind: "json_error"; readonly errorMessage: string }
  | { readonly kind: "metadata_missing"; readonly topLevelKeys: string[] }
  | { readonly kind: "unexpected_error"; readonly errorMessage: string };

/**
 * Requests NFT metadata and classifies the outcome. The timeout covers the
 * body as well as the headers. `selectNft` picks the token's metadata object
 * out of the response body.
 */
const requestMetadataCandidate = async (
  url: string,
  init: RequestInit,
  selectNft: (payload: unknown) => unknown
): Promise<AlchemyMetadataCandidateResult> => {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      kind: "unexpected_error",
      errorMessage: error instanceof Error ? error.message : "unknown",
    };
  }

  if (!response.ok) {
    return { kind: "http_error", status: response.status };
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch (error) {
    return {
      kind: "json_error",
      errorMessage: error instanceof Error ? error.message : "unknown",
    };
  }

  const { metadata, topLevelKeys } = extractAlchemyMetadata(selectNft(payload));
  if (!metadata) {
    return { kind: "metadata_missing", topLevelKeys };
  }

  return {
    kind: "success",
    metadata,
    topLevelKeys,
  };
};

const fetchAlchemyMetadataCandidate = (
  network: string,
  apiKey: string,
  contractAddress: string,
  tokenIdCandidate: string
): Promise<AlchemyMetadataCandidateResult> => {
  const endpoint = new URL(
    `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadata`
  );
  endpoint.searchParams.set("contractAddress", contractAddress);
  endpoint.searchParams.set("tokenId", tokenIdCandidate);
  return requestMetadataCandidate(
    endpoint.toString(),
    { headers: { Accept: "application/json" } },
    (payload) => payload
  );
};

/**
 * Fetches NFT metadata through the backend's Alchemy proxy, for builds that
 * have no Alchemy key (the desktop app). The proxy serves Ethereum mainnet
 * and answers `{ tokens: [...] }`.
 */
const getProxyAuthHeaders = (): Record<string, string> => {
  const stagingApiKey = getStagingApiKey();
  return stagingApiKey ? { "x-6529-auth": stagingApiKey } : {};
};

const fetchProxyMetadataCandidate = (
  contractAddress: string,
  tokenIdCandidate: string
): Promise<AlchemyMetadataCandidateResult> =>
  requestMetadataCandidate(
    `${publicEnv.API_ENDPOINT}/alchemy-proxy/token-metadata`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getProxyAuthHeaders(),
      },
      body: JSON.stringify({
        address: contractAddress,
        tokenIds: [tokenIdCandidate],
        chain: "ethereum",
      }),
    },
    (payload) => {
      const tokens = (payload as { readonly tokens?: unknown } | null)?.tokens;
      return Array.isArray(tokens) ? (tokens[0] as unknown) : undefined;
    }
  );

type AlchemyMetadataCandidateFetcher = (
  tokenIdCandidate: string
) => Promise<AlchemyMetadataCandidateResult>;

/**
 * How to fetch a token's metadata: from Alchemy with the server's key or,
 * without a key (the desktop app), through the backend's proxy, which covers
 * Ethereum mainnet only. Null when neither applies.
 */
const resolveAlchemyMetadataFetcher = (
  network: string,
  contractAddress: string,
  getApiKey: () => string
): AlchemyMetadataCandidateFetcher | null => {
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch {
    if (network !== "eth-mainnet") {
      return null;
    }
    return (tokenIdCandidate) =>
      fetchProxyMetadataCandidate(contractAddress, tokenIdCandidate);
  }
  return (tokenIdCandidate) =>
    fetchAlchemyMetadataCandidate(
      network,
      apiKey,
      contractAddress,
      tokenIdCandidate
    );
};

/**
 * Fetches a token's metadata on an Alchemy network, trying each spelling of
 * the token id, and says why it fell back when it did. Shared by the OpenSea
 * and Transient previews.
 */
export async function fetchNftMetadata(
  network: string | undefined,
  contractAddress: string,
  tokenId: string,
  getApiKey: () => string
): Promise<OpenSeaMetadataFetchResult> {
  if (!network) {
    return {
      kind: "fallback",
      reason: "unsupported_chain",
    };
  }

  const fetchCandidate = resolveAlchemyMetadataFetcher(
    network,
    contractAddress,
    getApiKey
  );
  if (!fetchCandidate) {
    return {
      kind: "fallback",
      reason: "missing_api_key",
    };
  }

  const tokenIdCandidates = buildTokenIdCandidates(tokenId);
  let lastHttpStatus: number | undefined;
  let lastHttpTokenId: string | undefined;
  let lastJsonError: string | undefined;
  let lastJsonTokenId: string | undefined;
  let lastTopLevelKeys: string[] = [];

  for (const tokenIdCandidate of tokenIdCandidates) {
    const candidateResult = await fetchCandidate(tokenIdCandidate);

    if (candidateResult.kind === "success") {
      return {
        kind: "success",
        metadata: candidateResult.metadata,
        network,
        requestedTokenId: tokenIdCandidate,
        payloadTopLevelKeys: candidateResult.topLevelKeys,
      };
    }

    if (candidateResult.kind === "http_error") {
      lastHttpStatus = candidateResult.status;
      lastHttpTokenId = tokenIdCandidate;
      continue;
    }

    if (candidateResult.kind === "json_error") {
      lastJsonError = candidateResult.errorMessage;
      lastJsonTokenId = tokenIdCandidate;
      continue;
    }

    if (candidateResult.kind === "metadata_missing") {
      lastTopLevelKeys = candidateResult.topLevelKeys;
      continue;
    }

    return {
      kind: "fallback",
      reason: "unexpected_error",
      network,
      requestedTokenId: tokenIdCandidate,
      errorMessage: candidateResult.errorMessage,
    };
  }

  if (lastHttpStatus !== undefined) {
    return {
      kind: "fallback",
      reason: "alchemy_http_error",
      network,
      status: lastHttpStatus,
      requestedTokenId: lastHttpTokenId,
    };
  }

  if (lastJsonError) {
    return {
      kind: "fallback",
      reason: "alchemy_json_error",
      network,
      requestedTokenId: lastJsonTokenId,
      errorMessage: lastJsonError,
    };
  }

  return {
    kind: "fallback",
    reason: "no_image_candidate",
    network,
    requestedTokenId: tokenIdCandidates.at(-1),
    errorMessage:
      lastTopLevelKeys.length > 0
        ? `metadata_not_found_in_payload:${lastTopLevelKeys.join(",")}`
        : "metadata_not_found_in_payload",
  };
}
