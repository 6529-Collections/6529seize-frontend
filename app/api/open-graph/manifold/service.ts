import type { PreviewPlan } from "@/app/api/open-graph/compound/service";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import { buildResponse } from "@/app/api/open-graph/utils";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { asNonEmptyString } from "../opensea/shared";

const MANIFOLD_CACHE_TTL_MS = 5 * 60 * 1000;
const MANIFOLD_HOST = "manifold.xyz";
const LISTING_PATH_PATTERN = /^\/@([^/]+)\/id\/([^/?#]+)\/?$/i;
const HYDRATE_WORK_CALL = "hydrateWorkPage(";
// Optional whitespace and the "{" that opens a payload, right after the call.
const HYDRATE_WORK_PAYLOAD_START_PATTERN = /\s*\{/y;
const HYDRATE_WORK_PAYLOAD_END_PATTERN = /\}\s*\)/g;

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

const parseHydratePayload = (
  rawPayload: string
): ManifoldHydratePayload | null => {
  try {
    return JSON.parse(rawPayload) as ManifoldHydratePayload;
  } catch {
    return null;
  }
};

/** Returns the index of the "{" that opens a call's payload, or -1. */
const findPayloadStart = (html: string, afterCall: number): number => {
  HYDRATE_WORK_PAYLOAD_START_PATTERN.lastIndex = afterCall;
  return HYDRATE_WORK_PAYLOAD_START_PATTERN.test(html)
    ? HYDRATE_WORK_PAYLOAD_START_PATTERN.lastIndex - 1
    : -1;
};

/**
 * Returns the first "})" at or after `from`. `previous` was the first one at
 * or after an earlier position, so it is reused while it is not behind `from`.
 */
const findPayloadEnd = (
  html: string,
  from: number,
  previous: RegExpExecArray | null
): RegExpExecArray | null => {
  if (previous && previous.index >= from) {
    return previous;
  }
  HYDRATE_WORK_PAYLOAD_END_PATTERN.lastIndex = from;
  return HYDRATE_WORK_PAYLOAD_END_PATTERN.exec(html);
};

/**
 * Collects `hydrateWorkPage({...})` payloads. A payload ends at the first "}"
 * followed by ")". A payload that runs into the next call is unclosed, so it
 * is skipped and the next call is still read. Every search moves forward and
 * parsed payloads never overlap, so the scan stays linear in the page size.
 */
const extractHydratePayloads = (
  html: string
): readonly ManifoldHydratePayload[] => {
  const payloads: ManifoldHydratePayload[] = [];
  let payloadEnd: RegExpExecArray | null = null;
  let callIndex = html.indexOf(HYDRATE_WORK_CALL);

  while (callIndex !== -1) {
    const afterCall = callIndex + HYDRATE_WORK_CALL.length;
    const nextCall = html.indexOf(HYDRATE_WORK_CALL, afterCall);
    const payloadStart = findPayloadStart(html, afterCall);
    if (payloadStart !== -1) {
      payloadEnd = findPayloadEnd(html, payloadStart + 1, payloadEnd);
      if (!payloadEnd) {
        // No "})" follows, so no later payload can close either.
        break;
      }

      const closed = nextCall === -1 || nextCall > payloadEnd.index;
      const payload = closed
        ? parseHydratePayload(html.slice(payloadStart, payloadEnd.index + 1))
        : null;
      if (payload) {
        payloads.push(payload);
      }
    }
    callIndex = nextCall;
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
