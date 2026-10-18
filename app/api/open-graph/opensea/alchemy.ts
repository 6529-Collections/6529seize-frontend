import { publicEnv } from "@/config/env";

import { extractAlchemyMetadata } from "./shared";
import type { AlchemyNftMetadata } from "./shared";

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
 * Requests NFT metadata with a timeout and classifies the outcome.
 * `selectNft` picks the token's metadata object out of the response body.
 */
const requestMetadataCandidate = async (
  url: string,
  init: RequestInit,
  selectNft: (payload: unknown) => unknown
): Promise<AlchemyMetadataCandidateResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeout);
  } catch (error) {
    clearTimeout(timeout);
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
        ...(publicEnv.STAGING_API_KEY
          ? { "x-6529-auth": publicEnv.STAGING_API_KEY }
          : {}),
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
export const resolveAlchemyMetadataFetcher = (
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
