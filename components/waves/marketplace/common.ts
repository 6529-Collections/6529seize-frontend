import type { ApiDropNftLink } from "@/generated/models/ApiDropNftLink";
import { ApiNftLinkMediaPreviewStatusEnum } from "@/generated/models/ApiNftLinkMediaPreview";
import type { WsMediaLinkUpdatedData } from "@/helpers/Types";
import { asNonEmptyString } from "@/lib/text/nonEmptyString";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import type { ApiNftLinkResponse } from "@/services/api/nft-link-api";

import type { QueryClient } from "@tanstack/react-query";

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

export type MarketplacePreviewMode = "default" | "opensea-sanitized";

export type MarketplacePreviewState =
  | { readonly type: "loading"; readonly href: string }
  | {
      readonly type: "success";
      readonly href: string;
      readonly resolvedMedia?: PickedMedia | undefined;
      readonly resolvedPrice?: string | undefined;
      readonly resolvedTitle?: string | undefined;
    }
  | { readonly type: "error"; readonly href: string; readonly error: Error };

type PickedMedia = {
  readonly url: string;
  readonly mimeType: string;
};

export interface MarketplacePreviewData {
  readonly href: string;
  readonly canonicalId: string | null;
  readonly platform: string | null;
  readonly title: string | null;
  readonly description: string | null;
  readonly media: PickedMedia | null;
  readonly price: string | null;
}

const OPENSEA_HOST = "opensea.io";
const MARKETPLACE_PREVIEW_QUERY_KEY = "MARKETPLACE_PREVIEW";
const MARKETPLACE_PREVIEW_MODES: readonly MarketplacePreviewMode[] = [
  "default",
  "opensea-sanitized",
];

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  ogg: "audio/ogg",
  ogv: "video/ogg",
  flac: "audio/flac",
  png: "image/png",
  svg: "image/svg+xml",
  wav: "audio/wav",
  webm: "video/webm",
  webp: "image/webp",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  usdz: "model/vnd.usdz",
};

const asNullableString = (value: unknown): string | null =>
  asNonEmptyString(value) ?? null;

const normalizeCanonicalId = (canonicalId: unknown): string | null => {
  const value = asNonEmptyString(canonicalId);
  return value ? value.toLowerCase() : null;
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

const pickMediaFromUrl = (value: unknown): PickedMedia | undefined => {
  const url = asNonEmptyString(value);
  if (!url) {
    return undefined;
  }

  return {
    url,
    mimeType: inferMimeTypeFromUrl(url) ?? "image/*",
  };
};

const pickMedia = (data: LinkPreviewResponse): PickedMedia | undefined => {
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

const pickNftLinkMediaPreview = (
  response: ApiNftLinkResponse | undefined
): PickedMedia | undefined => {
  const preview = response?.data?.media_preview;
  if (preview?.status !== ApiNftLinkMediaPreviewStatusEnum.Ready) {
    return undefined;
  }

  const url =
    asNonEmptyString(preview.card_url) ??
    asNonEmptyString(preview.small_url) ??
    asNonEmptyString(preview.thumb_url);

  if (!url) {
    return undefined;
  }

  return {
    url,
    mimeType:
      asNonEmptyString(preview.mime_type) ??
      inferMimeTypeFromUrl(url) ??
      "image/*",
  };
};

const pickNftLinkMedia = (
  response: ApiNftLinkResponse | undefined
): PickedMedia | undefined =>
  pickNftLinkMediaPreview(response) ??
  pickMediaFromUrl(response?.data?.media_uri);

const pickNftLinkPrice = (
  response: ApiNftLinkResponse | undefined
): string | undefined => asNonEmptyString(response?.data?.price);

const pickNftLinkTitle = (
  response: ApiNftLinkResponse | undefined
): string | undefined => asNonEmptyString(response?.data?.name);

const pickNftLinkDescription = (
  response: ApiNftLinkResponse | undefined
): string | undefined => asNonEmptyString(response?.data?.description);

export const fromNftLink = ({
  href,
  response,
}: {
  readonly href: string;
  readonly response?: ApiNftLinkResponse | undefined;
}): MarketplacePreviewData => ({
  href,
  canonicalId: asNullableString(response?.data?.canonical_id),
  platform: asNullableString(response?.data?.platform),
  title: pickNftLinkTitle(response) ?? null,
  description: pickNftLinkDescription(response) ?? null,
  media: pickNftLinkMedia(response) ?? null,
  price: pickNftLinkPrice(response) ?? null,
});

const fromApiDropNftLink = ({
  href,
  nftLink,
}: {
  readonly href: string;
  readonly nftLink: ApiDropNftLink;
}): MarketplacePreviewData =>
  fromNftLink({
    href,
    response: {
      is_enrichable: nftLink.data !== null,
      validation_error: null,
      data: nftLink.data,
    },
  });

const mergeSeededMarketplacePreviewData = ({
  current,
  seeded,
}: {
  readonly current: MarketplacePreviewData | undefined;
  readonly seeded: MarketplacePreviewData;
}): MarketplacePreviewData => {
  if (!current) {
    return seeded;
  }

  return {
    ...current,
    canonicalId: current.canonicalId ?? seeded.canonicalId,
    platform: current.platform ?? seeded.platform,
    title: current.title ?? seeded.title,
    description: current.description ?? seeded.description,
    media: current.media ?? seeded.media,
    price: current.price ?? seeded.price,
  };
};

const normalizeHref = (value: unknown): string | null =>
  asNonEmptyString(value) ?? null;

export const primeMarketplacePreviewCacheFromNftLinks = ({
  queryClient,
  nftLinks,
}: {
  readonly queryClient: QueryClient;
  readonly nftLinks: readonly ApiDropNftLink[] | null | undefined;
}): void => {
  if (typeof nftLinks?.length !== "number" || nftLinks.length === 0) {
    return;
  }

  const seenHrefs = new Set<string>();
  for (const nftLink of nftLinks) {
    const href = normalizeHref(nftLink.url_in_text);
    if (!href || seenHrefs.has(href)) {
      continue;
    }

    seenHrefs.add(href);
    const seededPreview = fromApiDropNftLink({ href, nftLink });
    if (!seededPreview.media) continue;

    for (const mode of MARKETPLACE_PREVIEW_MODES) {
      queryClient.setQueryData<MarketplacePreviewData>(
        [MARKETPLACE_PREVIEW_QUERY_KEY, { href, mode }],
        (current) =>
          mergeSeededMarketplacePreviewData({
            current,
            seeded: seededPreview,
          })
      );
    }
  }
};

export const needsOpenGraphFallback = (data: MarketplacePreviewData): boolean =>
  data.title === null || data.media === null;

export const mergeOpenGraphFallback = ({
  href,
  mode,
  current,
  linkPreview,
}: {
  readonly href: string;
  readonly mode: MarketplacePreviewMode;
  readonly current: MarketplacePreviewData;
  readonly linkPreview: LinkPreviewResponse;
}): MarketplacePreviewData => {
  const linkPreviewResponse =
    mode === "opensea-sanitized"
      ? sanitizeOpenSeaOverlayMedia(href, linkPreview)
      : linkPreview;

  return {
    ...current,
    title: current.title ?? asNullableString(linkPreviewResponse.title),
    description:
      current.description ?? asNullableString(linkPreviewResponse.description),
    media: current.media ?? pickMedia(linkPreviewResponse) ?? null,
  };
};

const isSameMedia = (
  first: PickedMedia | null,
  second: PickedMedia | null
): boolean =>
  first?.url === second?.url && first?.mimeType === second?.mimeType;

export const matchesMarketplacePreviewCanonicalId = ({
  previewCanonicalId,
  incomingCanonicalId,
}: {
  readonly previewCanonicalId: string | null;
  readonly incomingCanonicalId: unknown;
}): boolean => {
  const normalizedPreviewCanonicalId = normalizeCanonicalId(previewCanonicalId);
  const normalizedIncomingCanonicalId =
    normalizeCanonicalId(incomingCanonicalId);

  return (
    normalizedPreviewCanonicalId !== null &&
    normalizedPreviewCanonicalId === normalizedIncomingCanonicalId
  );
};

export const patchFromMediaLinkUpdate = ({
  current,
  update,
}: {
  readonly current: MarketplacePreviewData;
  readonly update: WsMediaLinkUpdatedData;
}): MarketplacePreviewData => {
  const nextCanonicalId = asNonEmptyString(update.canonical_id);
  const nextPlatform = asNonEmptyString(update.platform);
  const nextTitle = asNonEmptyString(update.name);
  const nextDescription = asNonEmptyString(update.description);
  const nextPrice = asNonEmptyString(update.price);
  const nextMedia = pickMediaFromUrl(update.media_uri) ?? current.media;

  const patched: MarketplacePreviewData = {
    ...current,
    canonicalId: nextCanonicalId ?? current.canonicalId,
    platform: nextPlatform ?? current.platform,
    title: nextTitle ?? current.title,
    description: nextDescription ?? current.description,
    media: nextMedia,
    price: nextPrice ?? current.price,
  };

  const didChange =
    patched.canonicalId !== current.canonicalId ||
    patched.platform !== current.platform ||
    patched.title !== current.title ||
    patched.description !== current.description ||
    patched.price !== current.price ||
    !isSameMedia(patched.media, current.media);

  return didChange ? patched : current;
};

const sanitizeOpenSeaOverlayMedia = (
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
