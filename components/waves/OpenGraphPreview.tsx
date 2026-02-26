
import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactElement, type ReactNode } from "react";

import { removeBaseEndpoint } from "@/helpers/Helpers";

import ChatItemHrefButtons from "./ChatItemHrefButtons";
import {
  type LinkPreviewVariant,
  useLinkPreviewVariant,
} from "./LinkPreviewContext";

export interface OpenGraphPreviewData {
  title?: unknown | undefined;
  description?: unknown | undefined;
  url?: unknown | undefined;
  siteName?: unknown | undefined;
  site_name?: unknown | undefined;
  domain?: unknown | undefined;
  source?: unknown | undefined;
  canonicalUrl?: unknown | undefined;
  canonical_url?: unknown | undefined;
  image?: unknown | undefined;
  imageUrl?: unknown | undefined;
  image_url?: unknown | undefined;
  images?: unknown | undefined;
  ogImage?: unknown | undefined;
  og_image?: unknown | undefined;
  thumbnailUrl?: unknown | undefined;
  thumbnail_url?: unknown | undefined;
  [key: string]: unknown;
}

interface OpenGraphPreviewProps {
  readonly href: string;
  readonly preview?: OpenGraphPreviewData | null | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly imageOnly?: boolean | undefined;
  readonly hideActions?: boolean | undefined;
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
const LONG_UNBROKEN_SEGMENT_THRESHOLD = 32;

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
      extractImageFromValue(record["url"]) ??
      extractImageFromValue(record["secure_url"]) ??
      extractImageFromValue(record["secureUrl"]) ??
      extractImageFromValue(record["src"]) ??
      extractImageFromValue(record["href"]) ??
      extractImageFromValue(record["image"]) ??
      extractImageFromValue(record["thumbnail"]) ??
      extractImageFromValue(record["contentUrl"]) ??
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

function wrapLongUnbrokenSegments(value: string | undefined): ReactNode {
  if (!value) {
    return value ?? "";
  }

  const tokens = value.split(/(\s+)/);
  let mutated = false;
  let offset = 0;

  const nodes = tokens
    .map((token) => {
      if (!token) {
        return null;
      }

      const key = `og-wrap-${offset}`;
      offset += token.length;

      const trimmed = token.trim();
      if (trimmed.length >= LONG_UNBROKEN_SEGMENT_THRESHOLD) {
        mutated = true;
        return (
          <span key={key} className="tw-break-all">
            {token}
          </span>
        );
      }

      return <Fragment key={key}>{token}</Fragment>;
    })
    .filter((token): token is ReactElement => token !== null);

  if (!mutated) {
    return value;
  }

  return nodes;
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
    readFirstString(preview, DOMAIN_KEYS) ??
    extractDomainFromUrl(readFirstString(preview, URL_KEYS)) ??
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
  variant,
  hideActions = false,
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly hideActions?: boolean | undefined;
}) {
  const contextVariant = useLinkPreviewVariant();
  const resolvedVariant = variant ?? contextVariant;
  const relativeHref = getRelativeHref(href);

  if (resolvedVariant === "home") {
    return (
      <div className="tw-flex tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-items-stretch">
        <div className="tw-h-full tw-min-w-0 tw-max-w-full tw-flex-1 tw-overflow-hidden focus-within:tw-overflow-visible">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-items-stretch tw-gap-x-1">
      <div className="tw-h-full tw-min-h-0 tw-min-w-0 tw-max-w-full tw-flex-1 tw-overflow-hidden focus-within:tw-overflow-visible">
        {children}
      </div>
      {!hideActions && (
        <ChatItemHrefButtons href={href} relativeHref={relativeHref} />
      )}
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
    readFirstString(preview, TITLE_KEYS) ??
    readFirstString(preview, DESCRIPTION_KEYS) ??
    extractImageUrl(preview)
  );
}

export default function OpenGraphPreview({
  href,
  preview,
  variant,
  imageOnly = false,
  hideActions = false,
}: OpenGraphPreviewProps) {
  const contextVariant = useLinkPreviewVariant();
  const resolvedVariant = variant ?? contextVariant;
  const relativeHref = getRelativeHref(href);
  const effectiveHref = relativeHref ?? href;
  const isExternalLink = !relativeHref;
  const linkTarget = isExternalLink ? "_blank" : undefined;
  const linkRel = isExternalLink ? "noopener noreferrer" : undefined;

  if (typeof preview === "undefined") {
    if (resolvedVariant === "home") {
      return (
        <LinkPreviewCardLayout
          href={href}
          variant={resolvedVariant}
          hideActions={hideActions}
        >
          <div
            className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30"
            data-testid="og-preview-skeleton"
          >
            <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-gradient-to-br tw-from-iron-900/40 tw-via-iron-800/20 tw-to-iron-900/40" />
            <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-flex-col tw-justify-end tw-gap-2 tw-p-4">
              <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-800/50" />
              <div className="tw-h-5 tw-w-3/4 tw-rounded tw-bg-iron-800/40" />
              <div className="tw-h-4 tw-w-2/3 tw-rounded tw-bg-iron-800/30" />
            </div>
          </div>
        </LinkPreviewCardLayout>
      );
    }

    return (
      <LinkPreviewCardLayout
        href={href}
        variant={resolvedVariant}
        hideActions={hideActions}
      >
        <div className="tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <div
            className="tw-flex tw-h-full tw-min-h-0 tw-animate-pulse tw-flex-col tw-justify-end tw-gap-y-3"
            data-testid="og-preview-skeleton"
          >
            <div className="tw-h-16 tw-w-full tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-800/60" />
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
  const hasContent = Boolean(title ?? description ?? imageUrl);

  if (imageOnly && imageUrl) {
    return (
      <LinkPreviewCardLayout
        href={href}
        variant={resolvedVariant}
        hideActions={hideActions}
      >
        <Link
          href={effectiveHref}
          target={linkTarget}
          rel={linkRel}
          onClick={(e) => e.stopPropagation()}
          className="tw-block tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-no-underline"
          data-testid="og-preview-card"
        >
          <div className="tw-relative tw-aspect-[16/9] tw-w-full tw-overflow-hidden tw-bg-iron-900/60">
            <Image
              src={imageUrl}
              alt={title ?? domain ?? "Link preview"}
              fill
              className="tw-object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 480px"
              unoptimized
            />
          </div>
        </Link>
      </LinkPreviewCardLayout>
    );
  }

  if (!hasContent) {
    if (resolvedVariant === "home") {
      return (
        <LinkPreviewCardLayout
          href={href}
          variant={resolvedVariant}
          hideActions={hideActions}
        >
          <Link
            href={effectiveHref}
            target={linkTarget}
            rel={linkRel}
            onClick={(e) => e.stopPropagation()}
            className="tw-relative tw-flex tw-h-full tw-w-full tw-items-end tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-no-underline"
            data-testid="og-preview-unavailable"
          >
            <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-iron-900/30 tw-via-black/20 tw-to-iron-900/30" />
            <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-flex-col tw-gap-1 tw-p-4">
              <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                Link unavailable
              </span>
              <span className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-100 tw-transition tw-duration-200 hover:tw-text-white">
                {wrapLongUnbrokenSegments(domain ?? href)}
              </span>
            </div>
          </Link>
        </LinkPreviewCardLayout>
      );
    }

    return (
      <LinkPreviewCardLayout
        href={href}
        variant={resolvedVariant}
        hideActions={hideActions}
      >
        <div
          className="tw-flex tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6"
          data-testid="og-preview-unavailable"
        >
          <div className="tw-max-h-full tw-space-y-2 tw-overflow-y-auto tw-text-center">
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-400">
              Link unavailable
            </p>
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
            >
              {wrapLongUnbrokenSegments(domain ?? href)}
            </Link>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={resolvedVariant}
      hideActions={hideActions}
    >
      {resolvedVariant === "home" ? (
        <Link
          href={effectiveHref}
          target={linkTarget}
          rel={linkRel}
          onClick={(e) => e.stopPropagation()}
          className="tw-relative tw-block tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-t-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-no-underline"
          data-testid="og-preview-card"
        >
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={title ?? domain ?? "Link preview"}
              fill
              className="tw-object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 480px"
              unoptimized
            />
          )}
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-black tw-via-black/60 tw-to-black/5" />
          <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-flex-col tw-justify-end tw-gap-2 tw-p-4">
            {domain && (
              <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-200/80">
                {wrapLongUnbrokenSegments(domain)}
              </span>
            )}
            <span className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 tw-transition tw-duration-200 hover:tw-text-white">
              <span className="tw-line-clamp-1">
                {wrapLongUnbrokenSegments(title ?? domain ?? href)}
              </span>
            </span>
            {description && (
              <p className="tw-[overflow-wrap:anywhere] tw-m-0 tw-line-clamp-1 tw-whitespace-pre-line tw-break-words tw-text-xs tw-text-iron-100/80">
                {wrapLongUnbrokenSegments(description)}
              </p>
            )}
          </div>
        </Link>
      ) : (
        <div
          className="tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
          data-testid="og-preview-card"
        >
          <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-gap-3 md:tw-flex-row">
            {imageUrl && (
              <Link
                href={effectiveHref}
                target={linkTarget}
                rel={linkRel}
                className="tw-block tw-w-full tw-flex-shrink-0 md:tw-h-full md:tw-w-44"
              >
                <div className="tw-aspect-[16/9] tw-h-full tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60 md:tw-aspect-auto">
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
            <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center tw-gap-y-1.5 tw-overflow-hidden">
              {domain && (
                <span className="tw-line-clamp-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                  {wrapLongUnbrokenSegments(domain)}
                </span>
              )}
              <Link
                href={effectiveHref}
                target={linkTarget}
                rel={linkRel}
                className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
              >
                {wrapLongUnbrokenSegments(title ?? domain ?? href)}
              </Link>
              {description && (
                <p className="tw-[overflow-wrap:anywhere] tw-m-0 tw-line-clamp-2 tw-whitespace-pre-line tw-break-words tw-text-xs tw-text-iron-300">
                  {wrapLongUnbrokenSegments(description)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </LinkPreviewCardLayout>
  );
}
