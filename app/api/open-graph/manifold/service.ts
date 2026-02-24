import type { PreviewPlan } from "@/app/api/open-graph/compound/service";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import { buildResponse } from "@/app/api/open-graph/utils";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { asNonEmptyString } from "../opensea/shared";

const MANIFOLD_CACHE_TTL_MS = 5 * 60 * 1000;
const MANIFOLD_HOST = "manifold.xyz";
const LISTING_PATH_PATTERN = /^\/@([^/]+)\/id\/([^/?#]+)\/?$/i;
const HYDRATE_WORK_PATTERN = /hydrateWorkPage\(\s*(\{[\s\S]*?\})\s*\);?/g;

type FetchHtmlResult = {
  readonly html: string;
  readonly contentType: string | null;
  readonly finalUrl: string;
};

interface CreateManifoldPlanDeps {
  readonly fetchHtml: (url: URL) => Promise<FetchHtmlResult>;
  readonly assertPublicUrl: (url: URL) => Promise<void>;
}

type ListingContext = {
  readonly creatorHandle: string;
  readonly listingId: string;
};

type ManifoldHydratePayload = {
  readonly instanceData?: {
    readonly type?: unknown;
    readonly identifier?: unknown;
    readonly metaImage?: unknown;
    readonly metaTitle?: unknown;
    readonly metaDescription?: unknown;
    readonly listing?: {
      readonly priceEth?: unknown;
    };
  };
};

const extractListingContext = (url: URL): ListingContext | null => {
  const hostname = url.hostname.toLowerCase();
  if (!matchesDomainOrSubdomain(hostname, MANIFOLD_HOST)) {
    return null;
  }

  const match = LISTING_PATH_PATTERN.exec(url.pathname);
  if (!match) {
    return null;
  }

  const creatorHandle = match[1]?.trim();
  const listingId = match[2]?.trim();
  if (!creatorHandle || !listingId) {
    return null;
  }

  return {
    creatorHandle,
    listingId,
  };
};

const asNumberishString = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return asNonEmptyString(value);
};

const extractHydratePayloads = (
  html: string
): readonly ManifoldHydratePayload[] => {
  const payloads: ManifoldHydratePayload[] = [];
  HYDRATE_WORK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = HYDRATE_WORK_PATTERN.exec(html))) {
    const rawPayload = match[1];
    if (!rawPayload) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawPayload) as ManifoldHydratePayload;
      payloads.push(parsed);
    } catch {
      continue;
    }
  }

  return payloads;
};

const parseManifoldListing = (
  html: string,
  requestUrl: URL,
  finalUrl: URL
): LinkPreviewResponse | null => {
  const context =
    extractListingContext(finalUrl) ?? extractListingContext(requestUrl);
  if (!context) {
    return null;
  }

  const payloads = extractHydratePayloads(html);
  for (const payload of payloads) {
    const instanceData = payload.instanceData;
    if (instanceData?.type !== "marketplace_listing") {
      continue;
    }

    const title = asNonEmptyString(instanceData.metaTitle);
    const description = asNonEmptyString(instanceData.metaDescription);
    const imageUrl = asNonEmptyString(instanceData.metaImage);
    const identifier =
      asNonEmptyString(instanceData.identifier) ?? context.listingId;
    const priceEth = asNumberishString(instanceData.listing?.priceEth);

    return {
      type: "manifold.listing",
      requestUrl: requestUrl.toString(),
      url: finalUrl.toString(),
      title,
      description,
      siteName: "Manifold",
      image: imageUrl ? { url: imageUrl, secureUrl: imageUrl } : undefined,
      images: imageUrl ? [{ url: imageUrl, secureUrl: imageUrl }] : undefined,
      manifold: {
        listingId: identifier,
        creatorHandle: context.creatorHandle,
        priceEth,
      },
    };
  }

  return null;
};

export function createManifoldPlan(
  url: URL,
  deps: CreateManifoldPlanDeps
): PreviewPlan | null {
  const listingContext = extractListingContext(url);
  if (!listingContext) {
    return null;
  }

  return {
    cacheKey: `manifold:listing:${url.toString()}`,
    execute: async () => {
      const { html, contentType, finalUrl } = await deps.fetchHtml(url);
      let finalUrlInstance: URL;
      try {
        finalUrlInstance = new URL(finalUrl);
      } catch (error) {
        const parseError =
          error instanceof Error ? error.message : "Unknown URL parse error";
        throw new Error(
          `Invalid finalUrl returned from deps.fetchHtml in execute: "${finalUrl}" (requestUrl="${url.toString()}", parseError="${parseError}")`
        );
      }

      await deps.assertPublicUrl(finalUrlInstance);

      const manifoldPreview = parseManifoldListing(html, url, finalUrlInstance);
      const data =
        manifoldPreview ??
        buildResponse(finalUrlInstance, html, contentType, finalUrl);

      return { data, ttl: MANIFOLD_CACHE_TTL_MS };
    },
  };
}
