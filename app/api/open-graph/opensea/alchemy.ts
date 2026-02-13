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

export const fetchAlchemyMetadataCandidate = async (
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
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

  const { metadata, topLevelKeys } = extractAlchemyMetadata(payload);
  if (!metadata) {
    return { kind: "metadata_missing", topLevelKeys };
  }

  return {
    kind: "success",
    metadata,
    topLevelKeys,
  };
};
