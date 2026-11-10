"use client";

import { useState, type ReactNode } from "react";

import Image, { type ImageProps } from "next/image";

import { isAllowedOgImageSourceUrl } from "@/app/api/og-metadata/_lib/imageProxyPolicy";
import { getInternalLinkPath } from "@/helpers/internalLink";

const IMAGE_PROXY_PATH = "/api/og-metadata/image";

type LinkPreviewImageKind = "image" | "icon";

const PROXY_PARAMS: Record<LinkPreviewImageKind, Record<string, string>> = {
  image: { animated: "1", w: "800" },
  icon: { w: "64" },
};

/**
 * Where a link preview loads an image from. Images on this site load
 * directly; every other host goes through the first-party image proxy, so
 * viewers never request a host chosen by the poster. Sources the proxy does
 * not accept (non-HTTPS, local hosts, unparseable values) are not shown.
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

  if (!isAllowedOgImageSourceUrl(trimmed)) {
    return undefined;
  }

  const query = new URLSearchParams({ url: trimmed, ...PROXY_PARAMS[kind] });
  return `${IMAGE_PROXY_PATH}?${query.toString()}`;
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
