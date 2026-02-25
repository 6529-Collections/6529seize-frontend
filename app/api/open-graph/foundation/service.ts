import type { PreviewPlan } from "@/app/api/open-graph/compound/service";
import { buildResponse } from "@/app/api/open-graph/utils";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

import { asNonEmptyString } from "../opensea/shared";

const FOUNDATION_CACHE_TTL_MS = 5 * 60 * 1000;
const FOUNDATION_HOST = "foundation.app";
const FOUNDATION_MINT_PATH_PATTERN =
  /^\/mint\/([^/]+)\/(0x[a-f0-9]{40})\/([^/?#]+)\/?$/i;
const NEXT_DATA_SCRIPT_PATTERN =
  /<script id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i;

const FOUNDATION_CHAIN_IDS: Record<string, number> = {
  eth: 1,
  ethereum: 1,
  base: 8453,
};

const FOUNDATION_IMAGE_MIME_TYPES: Record<string, string> = {
  IMAGE_AVIF: "image/avif",
  IMAGE_GIF: "image/gif",
  IMAGE_JPEG: "image/jpeg",
  IMAGE_JPG: "image/jpeg",
  IMAGE_PNG: "image/png",
  IMAGE_SVG: "image/svg+xml",
  IMAGE_WEBP: "image/webp",
};

type FetchHtmlResult = {
  readonly html: string;
  readonly contentType: string | null;
  readonly finalUrl: string;
};

interface CreateFoundationPlanDeps {
  readonly fetchHtml: (url: URL) => Promise<FetchHtmlResult>;
  readonly assertPublicUrl: (url: URL) => Promise<void>;
}

type FoundationContext = {
  readonly chainSegment: string;
  readonly contractAddress: string;
  readonly tokenId: string;
};

interface FoundationImageMedia {
  readonly url?: unknown;
  readonly sourceUrl?: unknown;
  readonly imageMimeType?: unknown;
}

interface FoundationToken {
  readonly chainId?: unknown;
  readonly contractAddress?: unknown;
  readonly tokenId?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;
  readonly sourceUrl?: unknown;
  readonly media?: FoundationImageMedia | null | undefined;
}

interface FoundationNextData {
  readonly props?: {
    readonly pageProps?: {
      readonly pageData?: {
        readonly token?: FoundationToken | null | undefined;
      };
    };
  };
}

const asPositiveInteger = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
};

const asTokenId = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value.toString();
  }

  if (typeof value === "bigint" && value >= 0) {
    return value.toString();
  }

  return asNonEmptyString(value);
};

const extractFoundationContext = (url: URL): FoundationContext | null => {
  if (!matchesDomainOrSubdomain(url.hostname.toLowerCase(), FOUNDATION_HOST)) {
    return null;
  }

  const match = FOUNDATION_MINT_PATH_PATTERN.exec(url.pathname);
  if (!match) {
    return null;
  }

  const chainSegment = match[1]?.trim().toLowerCase();
  const contractAddress = match[2]?.trim();
  const tokenId = match[3]?.trim();

  if (!chainSegment || !contractAddress || !tokenId) {
    return null;
  }

  return {
    chainSegment,
    contractAddress,
    tokenId,
  };
};

const extractNextData = (html: string): FoundationNextData | null => {
  const match = NEXT_DATA_SCRIPT_PATTERN.exec(html);
  const rawPayload = match?.[1];
  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload) as FoundationNextData;
  } catch {
    return null;
  }
};

const normalizeFoundationImageMimeType = (
  value: unknown
): string | undefined => {
  const normalized = asNonEmptyString(value)?.toUpperCase();
  if (!normalized) {
    return undefined;
  }

  return FOUNDATION_IMAGE_MIME_TYPES[normalized];
};

const buildFoundationOgImageUrl = (
  chainId: number,
  contractAddress: string,
  tokenId: string
): string =>
  `https://foundation.app/api/og/nft/${chainId}/${contractAddress}/${tokenId}`;

const buildFoundationPreview = (
  html: string,
  requestUrl: URL,
  finalUrl: URL,
  context: FoundationContext,
  contentType: string | null
): LinkPreviewResponse | null => {
  const nextData = extractNextData(html);
  const token = nextData?.props?.pageProps?.pageData?.token;

  if (!token) {
    return null;
  }

  const chainId =
    asPositiveInteger(token.chainId) ??
    FOUNDATION_CHAIN_IDS[context.chainSegment];
  const contractAddress =
    asNonEmptyString(token.contractAddress) ?? context.contractAddress;
  const tokenId = asTokenId(token.tokenId) ?? context.tokenId;
  const tokenName = asNonEmptyString(token.name);
  const description = asNonEmptyString(token.description);
  const mediaUrl = asNonEmptyString(token.media?.url);
  const sourceUrl =
    asNonEmptyString(token.media?.sourceUrl) ??
    asNonEmptyString(token.sourceUrl);
  const ogImageUrl =
    typeof chainId === "number" && contractAddress && tokenId
      ? buildFoundationOgImageUrl(chainId, contractAddress, tokenId)
      : undefined;
  const imageUrl = mediaUrl ?? sourceUrl ?? ogImageUrl;
  const imageMimeType = normalizeFoundationImageMimeType(
    token.media?.imageMimeType
  );
  const title = tokenName ? `${tokenName} | Foundation` : undefined;

  if (!title && !description && !imageUrl) {
    return null;
  }

  return {
    type: "foundation.nft",
    requestUrl: requestUrl.toString(),
    url: finalUrl.toString(),
    title,
    description,
    siteName: "Foundation",
    mediaType: "website",
    contentType,
    image: imageUrl ? { url: imageUrl, type: imageMimeType } : undefined,
    images: imageUrl ? [{ url: imageUrl, type: imageMimeType }] : undefined,
  };
};

export function createFoundationPlan(
  url: URL,
  deps: CreateFoundationPlanDeps
): PreviewPlan | null {
  const requestContext = extractFoundationContext(url);
  if (!requestContext) {
    return null;
  }

  return {
    cacheKey: `foundation:nft:${url.toString()}`,
    execute: async () => {
      const { html, contentType, finalUrl } = await deps.fetchHtml(url);
      const finalUrlInstance = new URL(finalUrl);
      await deps.assertPublicUrl(finalUrlInstance);

      const context =
        extractFoundationContext(finalUrlInstance) ?? requestContext;
      const foundationPreview = buildFoundationPreview(
        html,
        url,
        finalUrlInstance,
        context,
        contentType
      );
      const data =
        foundationPreview ??
        buildResponse(finalUrlInstance, html, contentType, finalUrl);

      return { data, ttl: FOUNDATION_CACHE_TTL_MS };
    },
  };
}
