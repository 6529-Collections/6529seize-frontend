"use client";

import { useEffect, useState } from "react";

import OpenGraphPreview, {
  type OpenGraphPreviewData,
} from "./OpenGraphPreview";
import ManifoldItemPreviewCard from "./ManifoldItemPreviewCard";
import { fetchLinkPreview } from "@/services/api/link-preview-api";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";

interface NftMarketplacePreviewProps {
  readonly href: string;
}

type LinkPreviewResult = Awaited<ReturnType<typeof fetchLinkPreview>>;
const OPENSEA_HOST = "opensea.io";

type PreviewState =
  | { readonly type: "loading"; readonly href: string }
  | {
      readonly type: "success";
      readonly href: string;
      readonly data: LinkPreviewResult;
    }
  | { readonly type: "error"; readonly href: string; readonly error: Error };

type PickedMedia = {
  readonly url: string;
  readonly mimeType: string;
};

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

const asNonEmptyString = (value: unknown): string | undefined => {
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

const toPreviewData = (response: LinkPreviewResult): OpenGraphPreviewData => {
  return {
    ...response,
    image: response.image ?? undefined,
    images: response.images ?? undefined,
    url: response.url ?? response.requestUrl ?? undefined,
    siteName: response.siteName ?? undefined,
    description: response.description ?? undefined,
    title: response.title ?? undefined,
  };
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

const toPickedMedia = (
  candidate:
    | {
        url?: string | null | undefined;
        secureUrl?: string | null | undefined;
        type?: string | null | undefined;
      }
    | null
    | undefined
): PickedMedia | undefined => {
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

const pickMedia = (data: LinkPreviewResult): PickedMedia | undefined => {
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

const sanitizeOpenSeaOverlayMedia = (
  href: string,
  data: LinkPreviewResult
): LinkPreviewResult => {
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

export default function NftMarketplacePreview({
  href,
}: NftMarketplacePreviewProps) {
  const [state, setState] = useState<PreviewState>({ type: "loading", href });

  useEffect(() => {
    let active = true;

    const loadPreview = async (): Promise<void> => {
      try {
        const response = sanitizeOpenSeaOverlayMedia(
          href,
          await fetchLinkPreview(href)
        );
        if (!active) {
          return;
        }

        setState({ type: "success", href, data: response });
      } catch (error: unknown) {
        if (active) {
          setState({
            type: "error",
            href,
            error:
              error instanceof Error
                ? error
                : new Error("Failed to load marketplace preview"),
          });
        }
      }
    };

    void loadPreview();

    return () => {
      active = false;
    };
  }, [href]);

  if (state.href !== href || state.type === "loading") {
    return <OpenGraphPreview href={href} preview={undefined} />;
  }

  if (state.type === "error") {
    throw state.error;
  }

  const title = asNonEmptyString(state.data.title);
  const media = pickMedia(state.data);

  if (title && media) {
    return (
      <ManifoldItemPreviewCard
        href={href}
        title={title}
        mediaUrl={media.url}
        mediaMimeType={media.mimeType}
      />
    );
  }

  return <OpenGraphPreview href={href} preview={toPreviewData(state.data)} />;
}
