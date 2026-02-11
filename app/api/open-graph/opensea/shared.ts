import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

type FetchHtmlResult = {
  readonly html: string;
  readonly contentType: string | null;
  readonly finalUrl: string;
};

export interface CreateOpenSeaPlanDeps {
  readonly fetchHtml: (url: URL) => Promise<FetchHtmlResult>;
  readonly assertPublicUrl: (url: URL) => Promise<void>;
}

export type OpenSeaContext = {
  readonly chainSegment: string;
  readonly contractAddress: string;
  readonly tokenId: string;
};

export type OpenSeaFallbackReason =
  | "unsupported_chain"
  | "missing_api_key"
  | "alchemy_http_error"
  | "alchemy_json_error"
  | "no_image_candidate"
  | "unexpected_error";

type AlchemyNftImage = {
  readonly originalUrl?: unknown;
  readonly cachedUrl?: unknown;
  readonly pngUrl?: unknown;
  readonly thumbnailUrl?: unknown;
  readonly gateway?: unknown;
  readonly raw?: unknown;
  readonly contentType?: unknown;
};

type AlchemyNftRawMetadata = {
  readonly image?: unknown;
  readonly image_url?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;
};

export type AlchemyNftMetadata = {
  readonly name?: unknown;
  readonly title?: unknown;
  readonly description?: unknown;
  readonly image?: AlchemyNftImage | null | undefined;
  readonly tokenUri?: unknown;
  readonly metadata?: AlchemyNftRawMetadata | null | undefined;
  readonly rawMetadata?: AlchemyNftRawMetadata | null | undefined;
  readonly raw?:
    | {
        readonly tokenUri?: unknown;
        readonly metadata?: AlchemyNftRawMetadata | null | undefined;
      }
    | null
    | undefined;
  readonly collection?:
    | {
        readonly name?: unknown;
      }
    | null
    | undefined;
  readonly contract?:
    | {
        readonly name?: unknown;
      }
    | null
    | undefined;
};

type OpenSeaAlchemyImageSource =
  | "image.originalUrl"
  | "image.cachedUrl"
  | "image.pngUrl"
  | "image.thumbnailUrl"
  | "image.gateway"
  | "image.raw"
  | "metadata.image"
  | "metadata.image_url"
  | "rawMetadata.image"
  | "rawMetadata.image_url"
  | "raw.metadata.image"
  | "raw.metadata.image_url";

export type OpenSeaTokenUriImageSource =
  | "tokenUri.image_original_url"
  | "tokenUri.image"
  | "tokenUri.image_url"
  | "tokenUri.imageOriginalUrl"
  | "tokenUri.imageUrl";

type OpenSeaImageSource =
  | OpenSeaAlchemyImageSource
  | OpenSeaTokenUriImageSource;

export type ResolvedOpenSeaImage = {
  readonly source: OpenSeaImageSource;
  readonly url: string;
};

export type TokenUriMetadata = {
  readonly image?: unknown;
  readonly image_url?: unknown;
  readonly imageUrl?: unknown;
  readonly image_original_url?: unknown;
  readonly imageOriginalUrl?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;
};

export type OpenSeaMetadataFetchResult =
  | {
      readonly kind: "success";
      readonly metadata: AlchemyNftMetadata;
      readonly network: string;
      readonly requestedTokenId: string;
      readonly payloadTopLevelKeys: readonly string[];
    }
  | {
      readonly kind: "fallback";
      readonly reason: OpenSeaFallbackReason;
      readonly network?: string | undefined;
      readonly status?: number | undefined;
      readonly requestedTokenId?: string | undefined;
      readonly errorMessage?: string | undefined;
    };

export type OpenSeaPreviewBuildResult =
  | { readonly kind: "success"; readonly preview: LinkPreviewResponse }
  | {
      readonly kind: "fallback";
      readonly reason: OpenSeaFallbackReason;
      readonly details?: Record<string, unknown> | undefined;
      readonly preview?: LinkPreviewResponse | undefined;
    };

export const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const OPEN_SEA_IMAGE_CANDIDATE_SOURCES: readonly OpenSeaAlchemyImageSource[] =
  [
    "image.originalUrl",
    "image.cachedUrl",
    "image.pngUrl",
    "image.thumbnailUrl",
    "image.gateway",
    "image.raw",
    "metadata.image",
    "metadata.image_url",
    "rawMetadata.image",
    "rawMetadata.image_url",
    "raw.metadata.image",
    "raw.metadata.image_url",
  ];

export const OPEN_SEA_IMAGE_SOURCE_READERS: Record<
  OpenSeaAlchemyImageSource,
  (metadata: AlchemyNftMetadata) => string | undefined
> = {
  "image.originalUrl": (metadata) =>
    asNonEmptyString(metadata.image?.originalUrl),
  "image.cachedUrl": (metadata) => asNonEmptyString(metadata.image?.cachedUrl),
  "image.pngUrl": (metadata) => asNonEmptyString(metadata.image?.pngUrl),
  "image.thumbnailUrl": (metadata) =>
    asNonEmptyString(metadata.image?.thumbnailUrl),
  "image.gateway": (metadata) => asNonEmptyString(metadata.image?.gateway),
  "image.raw": (metadata) => asNonEmptyString(metadata.image?.raw),
  "metadata.image": (metadata) => asNonEmptyString(metadata.metadata?.image),
  "metadata.image_url": (metadata) =>
    asNonEmptyString(metadata.metadata?.image_url),
  "rawMetadata.image": (metadata) =>
    asNonEmptyString(metadata.rawMetadata?.image),
  "rawMetadata.image_url": (metadata) =>
    asNonEmptyString(metadata.rawMetadata?.image_url),
  "raw.metadata.image": (metadata) =>
    asNonEmptyString(metadata.raw?.metadata?.image),
  "raw.metadata.image_url": (metadata) =>
    asNonEmptyString(metadata.raw?.metadata?.image_url),
};

export const createRequestId = (): string =>
  Math.random().toString(36).slice(2, 10).padEnd(8, "0").slice(0, 8);

export const truncateForLog = (value: string, maxLength = 200): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

export const toObjectRecord = (
  value: unknown
): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
};

export const getObjectKeys = (value: unknown): string[] => {
  const record = toObjectRecord(value);
  if (!record) {
    return [];
  }

  return Object.keys(record);
};

const looksLikeAlchemyNftMetadata = (
  value: unknown
): value is AlchemyNftMetadata => {
  const record = toObjectRecord(value);
  if (!record) {
    return false;
  }

  return (
    "image" in record ||
    "raw" in record ||
    "metadata" in record ||
    "rawMetadata" in record ||
    "name" in record ||
    "title" in record
  );
};

export const extractAlchemyMetadata = (
  payload: unknown
): { metadata: AlchemyNftMetadata | null; topLevelKeys: string[] } => {
  const topLevelKeys = getObjectKeys(payload);
  const record = toObjectRecord(payload);
  if (!record) {
    return { metadata: null, topLevelKeys };
  }

  const nestedNft = record["nft"];
  if (looksLikeAlchemyNftMetadata(nestedNft)) {
    return { metadata: nestedNft, topLevelKeys };
  }

  if (looksLikeAlchemyNftMetadata(record)) {
    return { metadata: record, topLevelKeys };
  }

  return { metadata: null, topLevelKeys };
};
