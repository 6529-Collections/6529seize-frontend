import { commonApiFetch } from "./common-api";

interface ApiNftLinkData {
  readonly canonical_id: string;
  readonly platform: string;
  readonly chain: string | null;
  readonly contract: string | null;
  readonly token: string | null;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly media_uri: string | null;
  readonly last_error_message: string | null;
  readonly price: string | null;
  readonly last_successfully_updated: number | null;
  readonly failed_since: number | null;
}

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
