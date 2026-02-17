import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";

type MediaCandidate =
  | {
      readonly url?: string | null | undefined;
      readonly secureUrl?: string | null | undefined;
      readonly type?: string | null | undefined;
    }
  | null
  | undefined;

export interface MarketplaceTypePreviewProps {
  readonly href: string;
  readonly compact?: boolean | undefined;
}

export type MarketplacePreviewState =
  | { readonly type: "loading"; readonly href: string }
  | {
      readonly type: "success";
      readonly href: string;
      readonly data: LinkPreviewResponse;
    }
  | { readonly type: "error"; readonly href: string; readonly error: Error };

type PickedMedia = {
  readonly url: string;
  readonly mimeType: string;
};

const OPENSEA_HOST = "opensea.io";

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isOpenSeaHref = (href: string): boolean => {
  try {
    const parsed = new URL(href);
    return matchesDomainOrSubdomain(
      parsed.hostname.toLowerCase(),
      OPENSEA_HOST
    );
  } catch {
    return false;
  }
};

const isBlockedOpenSeaOverlayUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (!matchesDomainOrSubdomain(host, OPENSEA_HOST)) {
      return false;
    }

    return path.includes("opengraph");
  } catch {
    return false;
  }
};

const inferMimeTypeFromUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    const extensionMatch = parsed.pathname
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/);
    if (!extensionMatch?.[1]) {
      return undefined;
    }

    return IMAGE_MIME_BY_EXTENSION[extensionMatch[1]];
  } catch {
    const path = url.split("?")[0]?.toLowerCase() ?? "";
    const extensionMatch = path.match(/\.([a-z0-9]+)$/);
    if (!extensionMatch?.[1]) {
      return undefined;
    }

    return IMAGE_MIME_BY_EXTENSION[extensionMatch[1]];
  }
};

const toPickedMedia = (candidate: MediaCandidate): PickedMedia | undefined => {
  if (!candidate) {
    return undefined;
  }

  const urlCandidate = candidate.url ?? candidate.secureUrl;
  if (typeof urlCandidate !== "string" || urlCandidate.trim().length === 0) {
    return undefined;
  }

  const url = urlCandidate.trim();
  const mimeType =
    asNonEmptyString(candidate.type) ?? inferMimeTypeFromUrl(url) ?? "image/*";

  return {
    url,
    mimeType,
  };
};

export const pickMedia = (
  data: LinkPreviewResponse
): PickedMedia | undefined => {
  const primary = toPickedMedia(data.image);
  if (primary) {
    return primary;
  }

  const images = data.images;
  if (images === null || images === undefined) {
    return undefined;
  }

  for (const image of images) {
    const candidate = toPickedMedia(image);
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};

export const sanitizeOpenSeaOverlayMedia = (
  href: string,
  data: LinkPreviewResponse
): LinkPreviewResponse => {
  if (!isOpenSeaHref(href)) {
    return data;
  }

  const primary = toPickedMedia(data.image);
  const hasBlockedPrimary =
    primary !== undefined && isBlockedOpenSeaOverlayUrl(primary.url);
  const hasNonBlockedPrimary = primary !== undefined && !hasBlockedPrimary;

  const images = data.images ?? [];
  let hasNonBlockedImageCandidate = false;
  const sanitizedImages = images.filter((image) => {
    const candidate = toPickedMedia(image);
    if (!candidate) {
      return true;
    }

    if (isBlockedOpenSeaOverlayUrl(candidate.url)) {
      return false;
    }

    hasNonBlockedImageCandidate = true;
    return true;
  });

  const hasAnyNonBlockedCandidate =
    hasNonBlockedPrimary || hasNonBlockedImageCandidate;
  if (!hasAnyNonBlockedCandidate) {
    return data;
  }

  const didChangeImages = sanitizedImages.length !== images.length;
  if (!hasBlockedPrimary && !didChangeImages) {
    return data;
  }

  return {
    ...data,
    image: hasBlockedPrimary ? null : data.image,
    images: sanitizedImages,
  };
};
