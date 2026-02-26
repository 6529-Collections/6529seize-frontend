import type { ApiNftLinkData } from "@/generated/models/ApiNftLinkData";

import { commonApiFetch } from "./common-api";

export interface ApiNftLinkResponse {
  readonly is_enrichable: boolean;
  readonly validation_error: string | null;
  readonly data: ApiNftLinkData | null;
}

const normalizeUrl = (url: string): string => url.trim();

const isApiNftLinkResponse = (value: unknown): value is ApiNftLinkResponse => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "is_enrichable" in value && "validation_error" in value && "data" in value
  );
};

export const fetchNftLink = async (
  url: string
): Promise<ApiNftLinkResponse> => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    throw new Error("A valid URL is required to fetch NFT link data.");
  }

  const response = await commonApiFetch<unknown, { url: string }>({
    endpoint: "nft-link",
    params: {
      url: normalizedUrl,
    },
  });

  if (!isApiNftLinkResponse(response)) {
    throw new Error(
      "Invalid /nft-link response shape: expected an object response."
    );
  }

  return response;
};
