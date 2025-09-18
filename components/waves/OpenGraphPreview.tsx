import { type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { removeBaseEndpoint } from "../../helpers/Helpers";
import ChatItemHrefButtons from "./ChatItemHrefButtons";

export interface OpenGraphPreviewData {
  title?: unknown;
  description?: unknown;
  url?: unknown;
  siteName?: unknown;
  site_name?: unknown;
  domain?: unknown;
  source?: unknown;
  canonicalUrl?: unknown;
  canonical_url?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  image_url?: unknown;
  images?: unknown;
  ogImage?: unknown;
  og_image?: unknown;
  thumbnailUrl?: unknown;
  thumbnail_url?: unknown;
  [key: string]: unknown;
}

interface OpenGraphPreviewProps {
  readonly href: string;
  readonly preview?: OpenGraphPreviewData | null;
}

type MaybeRecord = Record<string, unknown>;

const TITLE_KEYS = ["title", "ogTitle", "name"];
const DESCRIPTION_KEYS = ["description", "ogDescription", "summary"];
const DOMAIN_KEYS = ["domain", "siteName", "site_name", "source"];
const URL_KEYS = ["url", "canonicalUrl", "canonical_url"];
const IMAGE_KEYS = [
  "image",
  "imageUrl",
  "image_url",
  "ogImage",
  "og_image",
  "thumbnailUrl",
  "thumbnail_url",
  "cover",
  "coverImage",
  "secureUrl",
];
const IMAGE_COLLECTION_KEYS = ["images", "ogImages", "og_images", "thumbnails"];

function readFirstString(
  data: OpenGraphPreviewData | null | undefined,
  keys: readonly string[]
): string | undefined {
  if (!data) {
    return undefined;
  }

  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function extractImageFromValue(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const extracted = extractImageFromValue(entry);
      if (extracted) {
        return extracted;
      }
    }
    return undefined;
  }

  if (typeof value === "object") {
    const record = value as MaybeRecord;
    return (
      extractImageFromValue(record["url"]) ||
      extractImageFromValue(record["secure_url"]) ||
      extractImageFromValue(record["secureUrl"]) ||
      extractImageFromValue(record["src"]) ||
      extractImageFromValue(record["href"]) ||
      extractImageFromValue(record["image"]) ||
      extractImageFromValue(record["thumbnail"]) ||
      extractImageFromValue(record["contentUrl"]) ||
      extractImageFromValue(record["content_url"])
    );
  }

  return undefined;
}

function extractImageUrl(
  data: OpenGraphPreviewData | null | undefined
): string | undefined {
  if (!data) {
    return undefined;
  }

  for (const key of IMAGE_KEYS) {
    const imageUrl = extractImageFromValue(data[key]);
    if (imageUrl) {
      return imageUrl;
    }
  }

  for (const key of IMAGE_COLLECTION_KEYS) {
    const imageUrl = extractImageFromValue(data[key]);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return undefined;
}

function extractDomainFromUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  const candidates = [trimmed];

  if (!/^https?:\/\//i.test(trimmed)) {
    candidates.push(`https://${trimmed.replace(/^\/+/, "")}`);
    candidates.push(`http://${trimmed.replace(/^\/+/, "")}`);
  }

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      const hostname = parsed.hostname.replace(/^www\./i, "");
      if (hostname) {
        return hostname;
      }
    } catch {
      // ignore and continue
    }
  }

  return undefined;
}

function deriveDomain(
  href: string,
  preview: OpenGraphPreviewData | null | undefined
): string | undefined {
  return (
    readFirstString(preview, DOMAIN_KEYS) ||
    extractDomainFromUrl(readFirstString(preview, URL_KEYS)) ||
    extractDomainFromUrl(href)
  );
}

function getRelativeHref(href: string): string | undefined {
  const relative = removeBaseEndpoint(href);
  if (typeof relative !== "string" || relative.length === 0) {
    return undefined;
  }

  return relative.startsWith("/") ? relative : undefined;
}

export function LinkPreviewCardLayout({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  const relativeHref = getRelativeHref(href);

  return (
    <div className="tw-flex tw-w-full tw-items-stretch tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">{children}</div>
      <ChatItemHrefButtons href={href} relativeHref={relativeHref} />
    </div>
  );
}

export function hasOpenGraphContent(
  preview: OpenGraphPreviewData | null | undefined
): boolean {
  if (!preview) {
    return false;
  }

  return Boolean(
    readFirstString(preview, TITLE_KEYS) ||
    readFirstString(preview, DESCRIPTION_KEYS) ||
    extractImageUrl(preview)
  );
}

export default function OpenGraphPreview({
  href,
  preview,
}: OpenGraphPreviewProps) {
  const relativeHref = getRelativeHref(href);
  const effectiveHref = relativeHref ?? href;
  const isExternalLink = !relativeHref;
  const linkTarget = isExternalLink ? "_blank" : undefined;
  const linkRel = isExternalLink ? "noopener noreferrer" : undefined;

  if (typeof preview === "undefined") {
    return (
      <LinkPreviewCardLayout href={href}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <div
            className="tw-animate-pulse tw-flex tw-flex-col tw-gap-y-3"
            data-testid="og-preview-skeleton">
            <div className="tw-w-full tw-rounded-lg tw-bg-iron-800/60" />
            <div className="tw-h-4 tw-w-3/4 tw-rounded tw-bg-iron-800/40" />
            <div className="tw-h-3 tw-w-full tw-rounded tw-bg-iron-800/30" />
            <div className="tw-h-3 tw-w-2/3 tw-rounded tw-bg-iron-800/20" />
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  const title = readFirstString(preview, TITLE_KEYS);
  const description = readFirstString(preview, DESCRIPTION_KEYS);
  const imageUrl = extractImageUrl(preview);
  const domain = deriveDomain(href, preview);
  const hasContent = Boolean(title || description || imageUrl);

  if (!hasContent) {
    return (
      <LinkPreviewCardLayout href={href}>
        <div
          className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6"
          data-testid="og-preview-unavailable">
          <div className="tw-text-center tw-space-y-2">
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-400">
              Link unavailable
            </p>
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white">
              {domain ?? href}
            </Link>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
        data-testid="og-preview-card">
        <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
          {imageUrl && (
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              className="tw-block md:tw-w-60 md:tw-flex-shrink-0">
              <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
                <Image
                  src={imageUrl}
                  alt={title ?? domain ?? "Link preview"}
                  width={1200}
                  height={630}
                  className="tw-h-full tw-w-full tw-object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 240px"
                  unoptimized
                />
              </div>
            </Link>
          )}
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-2">
            {domain && (
              <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                {domain}
              </span>
            )}
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              className="tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white">
              {title ?? domain ?? href}
            </Link>
            {description && (
              <p className="tw-m-0 tw-text-sm tw-text-iron-300 tw-line-clamp-3 tw-break-words tw-whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
