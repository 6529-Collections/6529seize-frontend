"use client";

import { useState, type ReactNode } from "react";

import Image, { type ImageProps } from "next/image";

import { isAllowedOgImageSourceUrl } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import { publicEnv } from "@/config/env";
import { getInternalLinkPath } from "@/helpers/internalLink";
import {
  getMediaResolverHostname,
  isFirstPartyMediaResolverHostname,
} from "@/lib/media/decentralized-media";
import { STATIC_ALLOWED_IMAGE_HOSTNAMES } from "@/lib/media/static-image-hosts";

const IMAGE_PROXY_PATH = "/api/og-metadata/image";

type LinkPreviewImageKind = "image" | "icon";

// Without `animated=1` the proxy returns a still, which suits a thumbnail.
const PROXY_WIDTH: Record<LinkPreviewImageKind, string> = {
  image: "640",
  icon: "64",
};

const DIRECT_IMAGE_HOSTNAMES: ReadonlySet<string> = new Set(
  STATIC_ALLOWED_IMAGE_HOSTNAMES
);

const RASTER_ICON_EXTENSION = /\.(?:png|jpe?g|webp|gif)$/i;

/** Hosts the app already loads images from directly: its own and its CDNs. */
function isDirectImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      (DIRECT_IMAGE_HOSTNAMES.has(hostname) ||
        isFirstPartyMediaResolverHostname(hostname) ||
        hostname ===
          getMediaResolverHostname(publicEnv.MEDIA_RESOLVER_ENDPOINT))
    );
  } catch {
    return false;
  }
}

/**
 * Where a link preview loads an image from. Images on this site and on the
 * app's own static image hosts load directly; any other host goes through
 * the first-party image proxy as a still, so viewers never request a host
 * chosen by the poster. Sources the proxy does not accept (non-HTTPS, local
 * hosts, unparseable values) are not requested at all.
 */
export function getLinkPreviewImageSrc(
  source: string | null | undefined,
  kind: LinkPreviewImageKind = "image"
): string | undefined {
  const trimmed = source?.trim();
  if (!trimmed) {
    return undefined;
  }

  const internalPath = getInternalLinkPath(trimmed);
  if (internalPath !== null) {
    return internalPath;
  }

  if (isDirectImageUrl(trimmed)) {
    return trimmed;
  }

  if (!isAllowedOgImageSourceUrl(trimmed)) {
    return undefined;
  }

  const query = new URLSearchParams({ url: trimmed, w: PROXY_WIDTH[kind] });
  return `${IMAGE_PROXY_PATH}?${query.toString()}`;
}

/**
 * The first favicon in a format the image proxy can serve. `.ico` and SVG
 * icons, and icons without a raster file extension, are skipped so that no
 * request is made for an icon that cannot be shown.
 */
export function selectLinkPreviewFavicon(
  candidates: readonly string[]
): string | undefined {
  return candidates.find((candidate) => {
    try {
      return RASTER_ICON_EXTENSION.test(new URL(candidate).pathname);
    } catch {
      return false;
    }
  });
}

/**
 * The image source to render, or undefined once it has failed to load (for
 * example when the proxy cannot decode the format), so callers can lay out
 * the card without it.
 */
export function useLinkPreviewImage(
  source: string | null | undefined,
  kind: LinkPreviewImageKind = "image"
): { readonly src: string | undefined; readonly onError: () => void } {
  const src = getLinkPreviewImageSrc(source, kind);
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);

  return {
    src: src !== undefined && src !== failedSrc ? src : undefined,
    onError: () => setFailedSrc(src),
  };
}

type LinkPreviewImageProps = Omit<
  ImageProps,
  "src" | "unoptimized" | "onError"
> & {
  readonly src: string | null | undefined;
  readonly kind?: LinkPreviewImageKind | undefined;
  /** Rendered instead of the image when there is none or it fails to load. */
  readonly fallback?: ReactNode;
};

export function LinkPreviewImage({
  src: source,
  kind = "image",
  fallback = null,
  alt,
  ...imageProps
}: LinkPreviewImageProps) {
  const { src, onError } = useLinkPreviewImage(source, kind);
  if (!src) {
    return <>{fallback}</>;
  }

  // The proxy already returns a bounded, re-encoded image.
  return (
    <Image {...imageProps} alt={alt} src={src} unoptimized onError={onError} />
  );
}
