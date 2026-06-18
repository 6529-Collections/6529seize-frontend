import {
  Fragment,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import Image from "next/image";
import Link from "next/link";

import { removeBaseEndpoint } from "@/helpers/Helpers";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  GithubPreviewEnvelope,
  GithubPreviewResponse,
  GithubStatusPreviewResponse,
} from "@/services/api/github-preview-api";
import type {
  SeizeCollectionLinkPreview,
  YoutubeVideoLinkPreview,
} from "@/services/api/link-preview-api";
import ChatItemHrefButtons from "./ChatItemHrefButtons";
import GithubPreviewStatusBadge from "./GithubPreviewStatusBadge";
import {
  useLinkPreviewVariant,
  type LinkPreviewVariant,
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
  favicon?: unknown | undefined;
  favicons?: unknown | undefined;
  ogImage?: unknown | undefined;
  og_image?: unknown | undefined;
  thumbnailUrl?: unknown | undefined;
  thumbnail_url?: unknown | undefined;
  author?: unknown | undefined;
  byline?: unknown | undefined;
  publishedTime?: unknown | undefined;
  published_time?: unknown | undefined;
  datePublished?: unknown | undefined;
  date_published?: unknown | undefined;
  mediaType?: unknown | undefined;
  type?: unknown | undefined;
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
const DOMAIN_KEYS = ["siteName", "site_name", "domain"];
const SOURCE_KEYS = ["source"];
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
const IMAGE_ALT_KEYS = ["imageAlt", "image_alt", "ogImageAlt", "og_image_alt"];
const FAVICON_KEYS = ["favicon"];
const FAVICON_COLLECTION_KEYS = ["favicons"];
const AUTHOR_KEYS = ["author", "byline"];
const PUBLISHED_TIME_KEYS = [
  "publishedTime",
  "published_time",
  "datePublished",
  "date_published",
];
const MEDIA_TYPE_KEYS = ["mediaType", "type"];
const LONG_UNBROKEN_SEGMENT_THRESHOLD = 32;
const GENERIC_LINK_PREVIEW_LOCALE = DEFAULT_LOCALE;
const TRUSTED_YOUTUBE_EMBED_HOSTS = [
  "youtube-nocookie.com",
  "youtube.com",
] as const;
const PUBLISHED_DATE_FORMAT_OPTIONS = {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;
const MONTH_INDEX_BY_NAME: Readonly<Record<string, number>> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export type FirstPartyOpenGraphPreviewKind = "profile" | "drop" | "wave";

const FIRST_PARTY_OG_KIND_LABELS: Record<
  FirstPartyOpenGraphPreviewKind,
  string
> = {
  profile: "Profile",
  drop: "Drop",
  wave: "Wave",
};

function isFirstParty6529Hostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  return (
    normalizedHostname === "6529.io" || normalizedHostname.endsWith(".6529.io")
  );
}

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

function extractStringFromValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractImageAltFromValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const extracted = extractImageAltFromValue(entry);
      if (extracted) {
        return extracted;
      }
    }
    return undefined;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as MaybeRecord;
    return extractStringFromValue(record["alt"]);
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

function extractImageAlt(
  data: OpenGraphPreviewData | null | undefined
): string | undefined {
  if (!data) {
    return undefined;
  }

  const topLevelAlt = readFirstString(data, IMAGE_ALT_KEYS);
  if (topLevelAlt) {
    return topLevelAlt;
  }

  for (const key of IMAGE_KEYS) {
    const imageAlt = extractImageAltFromValue(data[key]);
    if (imageAlt) {
      return imageAlt;
    }
  }

  for (const key of IMAGE_COLLECTION_KEYS) {
    const imageAlt = extractImageAltFromValue(data[key]);
    if (imageAlt) {
      return imageAlt;
    }
  }

  return undefined;
}

function extractFaviconUrl(
  data: OpenGraphPreviewData | null | undefined
): string | undefined {
  if (!data) {
    return undefined;
  }

  for (const key of FAVICON_KEYS) {
    const faviconUrl = extractImageFromValue(data[key]);
    if (faviconUrl) {
      return faviconUrl;
    }
  }

  for (const key of FAVICON_COLLECTION_KEYS) {
    const faviconUrl = extractImageFromValue(data[key]);
    if (faviconUrl) {
      return faviconUrl;
    }
  }

  return undefined;
}

function getFirstPartyOgKindFromImageUrl(
  imageUrl: string | undefined
): FirstPartyOpenGraphPreviewKind | null {
  if (!imageUrl) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(imageUrl, "https://6529.io");
  } catch {
    return null;
  }

  const pathname = parsed.pathname.toLowerCase();
  if (!isFirstParty6529Hostname(parsed.hostname)) {
    return null;
  }

  if (pathname.startsWith("/api/og-metadata/profiles/")) {
    return "profile";
  }

  if (pathname.startsWith("/api/og-metadata/drops/")) {
    return "drop";
  }

  if (pathname.startsWith("/api/og-metadata/waves/")) {
    return "wave";
  }

  return null;
}

export function getFirstPartyOpenGraphPreviewKind(
  preview: OpenGraphPreviewData | null | undefined
): FirstPartyOpenGraphPreviewKind | null {
  return getFirstPartyOgKindFromImageUrl(extractImageUrl(preview));
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
    readFirstString(preview, SOURCE_KEYS) ??
    extractDomainFromUrl(href)
  );
}

function formatPublishedDate(
  value: string | undefined,
  locale: SupportedLocale
): string | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = parseSupportedPublishedTimestamp(value);
  if (timestamp === undefined) {
    return value;
  }

  return formatDate(locale, timestamp, PUBLISHED_DATE_FORMAT_OPTIONS);
}

function getPublishedDateTime(value: string | undefined): string | undefined {
  const timestamp = parseSupportedPublishedTimestamp(value);
  if (timestamp === undefined) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}

function parseUtcCalendarDate(
  year: number,
  monthIndex: number,
  day: number
): number | undefined {
  const timestamp = Date.UTC(year, monthIndex, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== monthIndex ||
    parsed.getUTCDate() !== day
  ) {
    return undefined;
  }

  return timestamp;
}

function parseNamedMonthDate(value: string): number | undefined {
  const monthFirstMatch = value.match(
    /^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/
  );
  if (monthFirstMatch) {
    const monthIndex =
      MONTH_INDEX_BY_NAME[monthFirstMatch[1]!.toLowerCase()];
    return typeof monthIndex === "number"
      ? parseUtcCalendarDate(
          Number(monthFirstMatch[3]),
          monthIndex,
          Number(monthFirstMatch[2])
        )
      : undefined;
  }

  const dayFirstMatch = value.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (dayFirstMatch) {
    const monthIndex = MONTH_INDEX_BY_NAME[dayFirstMatch[2]!.toLowerCase()];
    return typeof monthIndex === "number"
      ? parseUtcCalendarDate(
          Number(dayFirstMatch[3]),
          monthIndex,
          Number(dayFirstMatch[1])
        )
      : undefined;
  }

  return undefined;
}

function parseSupportedPublishedTimestamp(
  value: string | undefined
): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    return parseUtcCalendarDate(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3])
    );
  }

  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    const timestamp = Date.parse(trimmed);
    return Number.isNaN(timestamp) ? undefined : timestamp;
  }

  return parseNamedMonthDate(trimmed);
}

function normalizeMediaTypeLabel(
  value: string | undefined,
  locale: SupportedLocale
): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.includes(".")) {
    return undefined;
  }

  if (normalized.includes("article")) {
    return t(locale, "linkPreview.mediaType.article");
  }

  if (normalized === "website" || normalized === "webpage") {
    return t(locale, "linkPreview.mediaType.website");
  }

  return undefined;
}

function GenericOpenGraphMetaRow({
  author,
  publishedDate,
  publishedDateTime,
  locale,
}: {
  readonly author?: string | undefined;
  readonly publishedDate?: string | undefined;
  readonly publishedDateTime?: string | undefined;
  readonly locale: SupportedLocale;
}) {
  if (!author && !publishedDate) {
    return null;
  }

  const byline = author
    ? t(locale, "linkPreview.byline", {
        author,
      })
    : undefined;

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-leading-5 tw-text-iron-400">
      {byline && (
        <span className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-baseline tw-gap-1">
          <span className="tw-truncate tw-font-medium tw-text-iron-200">
            {wrapLongUnbrokenSegments(byline)}
          </span>
        </span>
      )}
      {author && publishedDate && (
        <span className="tw-text-iron-600" aria-hidden="true">
          /
        </span>
      )}
      {publishedDate && (
        <time className="tw-flex-shrink-0" dateTime={publishedDateTime}>
          {publishedDate}
        </time>
      )}
    </div>
  );
}

function GenericOpenGraphPreviewCard({
  effectiveHref,
  linkTarget,
  linkRel,
  imageUrl,
  imageAlt,
  faviconUrl,
  title,
  description,
  domain,
  mediaTypeLabel,
  author,
  publishedDate,
  publishedDateTime,
  locale,
}: {
  readonly effectiveHref: string;
  readonly linkTarget?: "_blank" | undefined;
  readonly linkRel?: string | undefined;
  readonly imageUrl?: string | undefined;
  readonly imageAlt?: string | undefined;
  readonly faviconUrl?: string | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly domain?: string | undefined;
  readonly mediaTypeLabel?: string | undefined;
  readonly author?: string | undefined;
  readonly publishedDate?: string | undefined;
  readonly publishedDateTime?: string | undefined;
  readonly locale: SupportedLocale;
}) {
  const sourceLabel = domain ?? t(locale, "linkPreview.externalSourceFallback");

  return (
    <Link
      href={effectiveHref}
      target={linkTarget}
      rel={linkRel}
      className={[
        "tw-group/og-card tw-relative tw-grid tw-h-full tw-min-h-0 tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950/70 tw-p-3 tw-pr-12 tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-transition tw-duration-200 hover:tw-border-sky-400/40 hover:tw-bg-iron-900/80 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-pr-14",
        imageUrl
          ? "tw-grid-cols-[6rem,minmax(0,1fr)] tw-gap-3 sm:tw-grid-cols-[8rem,minmax(0,1fr)] md:tw-grid-cols-[10.5rem,minmax(0,1fr)]"
          : "tw-grid-cols-1",
      ].join(" ")}
      data-testid="og-preview-card"
    >
      <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-bg-sky-400/70" />
      {imageUrl && (
        <span className="tw-relative tw-block tw-aspect-[16/10] tw-h-full tw-min-h-[6.5rem] tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-black/40 sm:tw-min-h-[7.5rem]">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="tw-object-cover tw-transition tw-duration-300 group-hover/og-card:tw-scale-[1.02]"
            loading="lazy"
            sizes="(max-width: 640px) 6rem, (max-width: 768px) 8rem, 10.5rem"
            unoptimized
          />
        </span>
      )}
      <span className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-col tw-justify-center tw-gap-1.5 tw-overflow-hidden">
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
          {faviconUrl && (
            <span className="tw-relative tw-block tw-h-4 tw-w-4 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-sm tw-bg-iron-800">
              <Image
                src={faviconUrl}
                alt=""
                fill
                className="tw-object-contain"
                loading="lazy"
                sizes="16px"
                unoptimized
              />
            </span>
          )}
          <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300">
            {wrapLongUnbrokenSegments(sourceLabel)}
          </span>
          {mediaTypeLabel && (
            <span className="tw-flex-shrink-0 tw-rounded-md tw-border tw-border-sky-400/25 tw-bg-sky-400/10 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4 tw-text-sky-100">
              {mediaTypeLabel}
            </span>
          )}
        </span>
        <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 tw-transition tw-duration-200 group-hover/og-card:tw-text-white md:tw-text-lg">
          {wrapLongUnbrokenSegments(title)}
        </span>
        <GenericOpenGraphMetaRow
          author={author}
          publishedDate={publishedDate}
          publishedDateTime={publishedDateTime}
          locale={locale}
        />
        {description && (
          <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-whitespace-pre-line tw-break-words tw-text-xs tw-leading-5 tw-text-iron-300 md:tw-text-sm">
            {wrapLongUnbrokenSegments(description)}
          </span>
        )}
      </span>
    </Link>
  );
}

function isGithubPreviewResponse(
  value: unknown
): value is GithubPreviewResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const type = (value as { readonly type?: unknown }).type;
  return (
    type === "github.issue" ||
    type === "github.pull_request" ||
    type === "github.repository" ||
    type === "github.file" ||
    type === "github.directory" ||
    type === "github.commit" ||
    type === "github.release" ||
    type === "github.actions" ||
    type === "github.discussion"
  );
}

function extractGithubPreview(
  preview: OpenGraphPreviewData | null | undefined
): GithubPreviewResponse | null {
  const githubPreview = (preview as GithubPreviewEnvelope | null | undefined)
    ?.githubPreview;
  return isGithubPreviewResponse(githubPreview) ? githubPreview : null;
}

function isGithubStatusPreviewResponse(
  preview: GithubPreviewResponse | null
): preview is GithubStatusPreviewResponse {
  return (
    preview?.type === "github.issue" || preview?.type === "github.pull_request"
  );
}

function isSeizeCollectionPreview(
  value: unknown
): value is SeizeCollectionLinkPreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as { readonly type?: unknown; readonly title?: unknown };
  return record.type === "6529.collection" && typeof record.title === "string";
}

function extractSeizeCollectionPreview(
  preview: OpenGraphPreviewData | null | undefined
): SeizeCollectionLinkPreview | null {
  return isSeizeCollectionPreview(preview) ? preview : null;
}

function isYoutubeVideoPreview(
  value: unknown
): value is YoutubeVideoLinkPreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as {
    readonly type?: unknown;
    readonly videoId?: unknown;
    readonly embedUrl?: unknown;
  };
  return (
    record.type === "youtube.video" &&
    typeof record.videoId === "string" &&
    typeof record.embedUrl === "string"
  );
}

function extractYoutubeVideoPreview(
  preview: OpenGraphPreviewData | null | undefined
): YoutubeVideoLinkPreview | null {
  return isYoutubeVideoPreview(preview) ? preview : null;
}

function getTrustedYoutubeEmbedUrl(value: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== "https:" || !parsed.pathname.startsWith("/embed/")) {
    return undefined;
  }

  const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  return isTrustedYoutubeEmbedHost(hostname) ? parsed.toString() : undefined;
}

function isTrustedYoutubeEmbedHost(hostname: string): boolean {
  return TRUSTED_YOUTUBE_EMBED_HOSTS.some((trustedHost) => hostname === trustedHost);
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
    <div className="tw-group/link-card tw-relative tw-h-full tw-w-full tw-min-w-0 tw-max-w-full">
      <div className="tw-h-full tw-min-h-0 tw-min-w-0 tw-max-w-full tw-overflow-hidden focus-within:tw-overflow-visible">
        {children}
      </div>
      {!hideActions && (
        <ChatItemHrefButtons
          href={href}
          relativeHref={relativeHref}
          layout="overlay"
        />
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

  if (isSeizeCollectionPreview(preview)) {
    return true;
  }

  if (isYoutubeVideoPreview(preview)) {
    return true;
  }

  return Boolean(
    readFirstString(preview, TITLE_KEYS) ??
    readFirstString(preview, DESCRIPTION_KEYS) ??
    extractImageUrl(preview)
  );
}

function isExternalHref(href: string | null | undefined): boolean {
  return typeof href === "string" && /^https?:\/\//i.test(href);
}

function FirstPartyOpenGraphPreviewCard({
  effectiveHref,
  linkTarget,
  linkRel,
  imageUrl,
  title,
  domain,
  description,
  kind,
}: {
  readonly effectiveHref: string;
  readonly linkTarget: "_blank" | undefined;
  readonly linkRel: string | undefined;
  readonly imageUrl: string;
  readonly title: string;
  readonly domain: string | undefined;
  readonly description: string | undefined;
  readonly kind: FirstPartyOpenGraphPreviewKind;
}) {
  const kindLabel = FIRST_PARTY_OG_KIND_LABELS[kind];

  return (
    <div
      className="tw-relative tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-3 sm:tw-p-4"
      data-testid="og-preview-card"
      data-og-kind={kind}
    >
      <div className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-gap-2 lg:tw-flex-row lg:tw-gap-3">
        <Link
          href={effectiveHref}
          target={linkTarget}
          rel={linkRel}
          className="tw-relative tw-block tw-h-28 tw-w-full tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-black/35 lg:tw-h-full lg:tw-w-72 xl:tw-w-80"
        >
          {/* Generated 6529 OG images are already complete cards; preserve them. */}
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="tw-object-contain"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 14rem, (max-width: 1024px) 18rem, 20rem"
            unoptimized
          />
        </Link>

        <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center tw-gap-y-1.5 tw-overflow-hidden">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            {domain && (
              <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                {wrapLongUnbrokenSegments(domain)}
              </span>
            )}
            <span className="tw-text-primary-200 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-primary-400/35 tw-bg-primary-400/10 tw-px-2 tw-py-0.5 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-wide">
              {kindLabel}
            </span>
          </div>

          <Link
            href={effectiveHref}
            target={linkTarget}
            rel={linkRel}
            className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
          >
            {wrapLongUnbrokenSegments(title)}
          </Link>

          {description && (
            <p className="tw-[overflow-wrap:anywhere] tw-m-0 tw-line-clamp-1 tw-whitespace-pre-line tw-break-words tw-text-sm tw-leading-snug tw-text-iron-300 sm:tw-line-clamp-2">
              {wrapLongUnbrokenSegments(description)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SeizeCollectionPreviewCard({
  href,
  preview,
  effectiveHref,
  linkTarget,
  linkRel,
  variant,
  hideActions,
}: {
  readonly href: string;
  readonly preview: SeizeCollectionLinkPreview;
  readonly effectiveHref: string;
  readonly linkTarget?: string | undefined;
  readonly linkRel?: string | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly hideActions?: boolean | undefined;
}) {
  const imageUrl = extractImageUrl(preview);
  const people = Array.isArray(preview.people) ? preview.people : [];
  const facts = Array.isArray(preview.facts) ? preview.facts : [];
  const traits = Array.isArray(preview.traits)
    ? preview.traits.slice(0, 3)
    : [];
  const resolvedVariant = variant ?? "chat";
  const isHome = resolvedVariant === "home";

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={resolvedVariant}
      hideActions={hideActions}
    >
      <div
        className={[
          "tw-flex tw-h-full tw-min-h-0 tw-w-full tw-items-center tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-p-3",
          isHome
            ? "tw-border-white/10 tw-bg-black/30"
            : "tw-border-iron-700 tw-bg-iron-950/70",
          !isHome && !hideActions ? "tw-pr-12 sm:tw-pr-3" : "",
        ].join(" ")}
        data-testid="6529-collection-preview-card"
      >
        <div
          className={[
            "tw-grid tw-w-full tw-min-w-0 tw-items-center tw-gap-3 sm:tw-gap-4",
            imageUrl
              ? "tw-grid-cols-[5.5rem,minmax(0,1fr)] sm:tw-grid-cols-[6.75rem,minmax(0,1fr)] md:tw-grid-cols-[8.25rem,minmax(0,1fr)]"
              : "tw-grid-cols-1",
          ].join(" ")}
        >
          {imageUrl && (
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(e) => e.stopPropagation()}
              className="tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-black tw-bg-black tw-p-1 tw-no-underline tw-shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              data-testid="6529-collection-preview-image-frame"
            >
              <span className="tw-relative tw-block tw-h-full tw-w-full">
                <Image
                  src={imageUrl}
                  alt={preview.title}
                  fill
                  className="tw-object-contain"
                  loading="lazy"
                  sizes="(max-width: 640px) 5.5rem, (max-width: 768px) 6.75rem, 8.25rem"
                  unoptimized
                />
              </span>
            </Link>
          )}
          <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center tw-gap-1.5 tw-overflow-hidden md:tw-gap-2">
            {preview.kicker && (
              <div className="tw-[overflow-wrap:anywhere] tw-line-clamp-1 tw-break-words tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                {wrapLongUnbrokenSegments(preview.kicker)}
              </div>
            )}
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(e) => e.stopPropagation()}
              className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white md:tw-text-lg"
            >
              {wrapLongUnbrokenSegments(preview.title)}
            </Link>
            {people.length > 0 && (
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-overflow-hidden tw-text-xs tw-leading-5 md:tw-text-sm">
                {people.map((person) => {
                  const personHref = person.href ?? undefined;
                  const personIsExternal = isExternalHref(personHref);

                  return (
                    <span
                      key={`${person.label ?? "person"}-${person.name}-${person.href ?? "display"}`}
                      className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-baseline tw-gap-1"
                    >
                      {person.label && (
                        <span className="tw-flex-shrink-0 tw-text-iron-500">
                          {person.label}
                        </span>
                      )}
                      {personHref ? (
                        <Link
                          href={personHref}
                          target={personIsExternal ? "_blank" : undefined}
                          rel={
                            personIsExternal ? "noopener noreferrer" : undefined
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="tw-truncate tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-text-white"
                        >
                          {person.name}
                        </Link>
                      ) : (
                        <span className="tw-truncate tw-font-medium tw-text-iron-200">
                          {person.name}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            {facts.length > 0 && (
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5 tw-overflow-hidden">
                {facts.map((fact) => (
                  <span
                    key={`${fact.label}-${fact.value}`}
                    className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/75 tw-px-2 tw-py-0.5 tw-text-[11px] tw-leading-5"
                  >
                    <span className="tw-flex-shrink-0 tw-text-iron-400">
                      {fact.label}
                    </span>
                    <span className="tw-truncate tw-font-medium tw-text-iron-100">
                      {fact.value}
                    </span>
                  </span>
                ))}
              </div>
            )}
            {traits.length > 0 && (
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5 tw-overflow-hidden">
                {traits.map((trait) => (
                  <span
                    key={`${trait.label}-${trait.value}`}
                    className="tw-inline-flex tw-max-w-full tw-rounded-md tw-bg-emerald-500/10 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-leading-5 tw-text-emerald-100"
                  >
                    <span className="tw-truncate">
                      {trait.label}: {trait.value}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function YoutubeVideoPreviewCard({
  href,
  preview,
  effectiveHref,
  linkTarget,
  linkRel,
  variant,
  hideActions,
  locale,
}: {
  readonly href: string;
  readonly preview: YoutubeVideoLinkPreview;
  readonly effectiveHref: string;
  readonly linkTarget?: "_blank" | undefined;
  readonly linkRel?: string | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly hideActions?: boolean | undefined;
  readonly locale: SupportedLocale;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const resolvedVariant = variant ?? "chat";
  const isHome = resolvedVariant === "home";
  const rawTitle = preview.title?.trim() ?? "";
  const title = rawTitle || t(locale, "linkPreview.youtube.titleFallback");
  const thumbnailUrl = preview.thumbnailUrl ?? undefined;
  const trustedEmbedUrl = getTrustedYoutubeEmbedUrl(preview.embedUrl);
  const thumbnailAlt =
    extractImageAlt(preview) ??
    (rawTitle
      ? t(locale, "linkPreview.youtube.thumbnailAlt", { title: rawTitle })
      : t(locale, "linkPreview.youtube.thumbnailFallbackAlt"));
  const rawAuthor = preview.authorName ?? preview.author;
  const author =
    typeof rawAuthor === "string" && rawAuthor.trim().length > 0
      ? rawAuthor.trim()
      : undefined;
  const watchLabel = t(locale, "linkPreview.youtube.watchOnYoutube");
  const providerLabel =
    typeof preview.provider === "string" && preview.provider.trim().length > 0
      ? preview.provider.trim()
      : t(locale, "linkPreview.youtube.providerFallback");
  const mediaSizes = isHome
    ? "(max-width: 768px) 100vw, 480px"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 14rem, 16rem";

  return (
    <LinkPreviewCardLayout
      href={href}
      variant={resolvedVariant}
      hideActions={hideActions}
    >
      <div
        className={[
          "tw-relative tw-flex tw-h-full tw-min-h-0 tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950/80 tw-shadow-sm tw-shadow-black/20",
          isHome ? "tw-border-white/10" : "tw-border-iron-700",
          !isHome && !hideActions ? "tw-pr-12 sm:tw-pr-14" : "",
        ].join(" ")}
        data-testid="youtube-video-preview-card"
      >
        <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-bg-red-500/80" />
        <div
          className={[
            "tw-grid tw-h-full tw-w-full tw-min-w-0 tw-items-center tw-gap-3 tw-p-3 sm:tw-gap-4",
            isHome
              ? "tw-grid-cols-1"
              : "tw-grid-cols-1 sm:tw-grid-cols-[minmax(10rem,14rem),minmax(0,1fr)]",
          ].join(" ")}
        >
          <div className="tw-relative tw-aspect-video tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-black tw-bg-black">
            {isPlaying && trustedEmbedUrl ? (
              <iframe
                className="tw-absolute tw-inset-0 tw-h-full tw-w-full"
                src={trustedEmbedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                data-testid="youtube-video-embed"
              />
            ) : trustedEmbedUrl ? (
              <button
                type="button"
                aria-label={t(locale, "linkPreview.youtube.playVideo", {
                  title,
                })}
                className="tw-group/youtube-play tw-relative tw-block tw-h-full tw-w-full tw-overflow-hidden tw-border-0 tw-bg-black tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsPlaying(true);
                }}
                data-testid="youtube-video-play"
              >
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={thumbnailAlt}
                    fill
                    className="tw-object-cover tw-transition tw-duration-300 group-hover/youtube-play:tw-scale-[1.02]"
                    loading="lazy"
                    sizes={mediaSizes}
                    unoptimized
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-iron-900 tw-via-black tw-to-iron-950"
                  />
                )}
                <span className="tw-absolute tw-inset-0 tw-bg-black/20 tw-transition tw-duration-200 group-hover/youtube-play:tw-bg-black/10" />
                <span
                  aria-hidden="true"
                  className="tw-absolute tw-left-1/2 tw-top-1/2 tw-flex tw-h-12 tw-w-12 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-bg-red-600 tw-shadow-lg tw-shadow-black/30 tw-transition tw-duration-200 group-hover/youtube-play:tw-scale-105"
                >
                  <span className="tw-ml-1 tw-block tw-h-0 tw-w-0 tw-border-y-[8px] tw-border-l-[13px] tw-border-y-transparent tw-border-l-white" />
                </span>
              </button>
            ) : (
              <Link
                href={preview.watchUrl || effectiveHref}
                target={linkTarget}
                rel={linkRel}
                onClick={(event) => event.stopPropagation()}
                className="tw-relative tw-block tw-h-full tw-w-full tw-overflow-hidden tw-no-underline"
              >
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={thumbnailAlt}
                    fill
                    className="tw-object-cover"
                    loading="lazy"
                    sizes={mediaSizes}
                    unoptimized
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-iron-900 tw-via-black tw-to-iron-950"
                  />
                )}
              </Link>
            )}
          </div>

          <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-col tw-justify-center tw-gap-1.5 tw-overflow-hidden">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
              <span className="tw-flex-shrink-0 tw-rounded-md tw-border tw-border-red-500/25 tw-bg-red-500/10 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-4 tw-text-red-100">
                {providerLabel}
              </span>
              {author && (
                <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                  {t(locale, "linkPreview.byline", { author })}
                </span>
              )}
            </div>
            <Link
              href={effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(event) => event.stopPropagation()}
              className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-block tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white md:tw-text-lg"
            >
              {wrapLongUnbrokenSegments(title)}
            </Link>
            <Link
              href={preview.watchUrl || effectiveHref}
              target={linkTarget}
              rel={linkRel}
              onClick={(event) => event.stopPropagation()}
              className="tw-inline-flex tw-w-fit tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/75 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-200 tw-no-underline tw-transition tw-duration-200 hover:tw-border-red-500/40 hover:tw-text-white"
            >
              <span className="tw-h-1.5 tw-w-1.5 tw-flex-shrink-0 tw-rounded-full tw-bg-red-500" />
              <span className="tw-truncate">{watchLabel}</span>
            </Link>
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
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
  const locale = GENERIC_LINK_PREVIEW_LOCALE;

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
  const imageAlt = extractImageAlt(preview);
  const faviconUrl = extractFaviconUrl(preview);
  const domain = deriveDomain(href, preview);
  const author = readFirstString(preview, AUTHOR_KEYS);
  const publishedDateRaw = readFirstString(preview, PUBLISHED_TIME_KEYS);
  const publishedDate = formatPublishedDate(publishedDateRaw, locale);
  const publishedDateTime = getPublishedDateTime(publishedDateRaw);
  const mediaTypeLabel = normalizeMediaTypeLabel(
    readFirstString(preview, MEDIA_TYPE_KEYS),
    locale
  );
  const githubPreview = extractGithubPreview(preview);
  const seizePreview = extractSeizeCollectionPreview(preview);
  const youtubePreview = extractYoutubeVideoPreview(preview);
  const hasContent = Boolean(title ?? description ?? imageUrl);
  const firstPartyKind = getFirstPartyOgKindFromImageUrl(imageUrl);

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

  if (!imageOnly && seizePreview) {
    return (
      <SeizeCollectionPreviewCard
        href={href}
        preview={seizePreview}
        effectiveHref={effectiveHref}
        linkTarget={linkTarget}
        linkRel={linkRel}
        variant={resolvedVariant}
        hideActions={hideActions}
      />
    );
  }

  if (!imageOnly && youtubePreview) {
    return (
      <YoutubeVideoPreviewCard
        href={href}
        preview={youtubePreview}
        effectiveHref={effectiveHref}
        linkTarget={linkTarget}
        linkRel={linkRel}
        variant={resolvedVariant}
        hideActions={hideActions}
        locale={locale}
      />
    );
  }

  if (resolvedVariant !== "home" && imageUrl && firstPartyKind) {
    return (
      <LinkPreviewCardLayout
        href={href}
        variant={resolvedVariant}
        hideActions={hideActions}
      >
        <FirstPartyOpenGraphPreviewCard
          effectiveHref={effectiveHref}
          linkTarget={linkTarget}
          linkRel={linkRel}
          imageUrl={imageUrl}
          title={title ?? domain ?? href}
          domain={domain}
          description={description}
          kind={firstPartyKind}
        />
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
          {isGithubStatusPreviewResponse(githubPreview) && (
            <GithubPreviewStatusBadge
              href={href}
              initialPreview={githubPreview}
              compact
            />
          )}
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
        <div className="tw-relative tw-h-full tw-min-h-0 tw-w-full">
          {isGithubStatusPreviewResponse(githubPreview) && (
            <GithubPreviewStatusBadge
              href={href}
              initialPreview={githubPreview}
            />
          )}
          <GenericOpenGraphPreviewCard
            effectiveHref={effectiveHref}
            linkTarget={linkTarget}
            linkRel={linkRel}
            imageUrl={imageUrl}
            imageAlt={imageAlt}
            faviconUrl={faviconUrl}
            title={title ?? domain ?? href}
            description={description}
            domain={domain}
            mediaTypeLabel={mediaTypeLabel}
            author={author}
            publishedDate={publishedDate}
            publishedDateTime={publishedDateTime}
            locale={locale}
          />
        </div>
      )}
    </LinkPreviewCardLayout>
  );
}
