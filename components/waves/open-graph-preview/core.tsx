import { Fragment, type ReactElement, type ReactNode } from "react";

import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import type {
  FirstPartyOpenGraphPreviewKind,
  MaybeRecord,
  OpenGraphPreviewData,
} from "./types";

export const TITLE_KEYS = ["title", "ogTitle", "name"];
export const DESCRIPTION_KEYS = ["description", "ogDescription", "summary"];
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
export const AUTHOR_KEYS = ["author", "byline"];
export const PUBLISHED_TIME_KEYS = [
  "publishedTime",
  "published_time",
  "datePublished",
  "date_published",
];
export const MEDIA_TYPE_KEYS = ["mediaType", "type"];
const LONG_UNBROKEN_SEGMENT_THRESHOLD = 32;
export const GENERIC_LINK_PREVIEW_LOCALE = DEFAULT_LOCALE;
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

export const FIRST_PARTY_OG_KIND_LABELS: Record<
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

export function readFirstString(
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

export function extractImageUrl(
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

export function extractImageAlt(
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

export function extractFaviconUrl(
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

export function getFirstPartyOgKindFromImageUrl(
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

export function wrapLongUnbrokenSegments(value: string | undefined): ReactNode {
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

export function deriveDomain(
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

export function formatPublishedDate(
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

export function getPublishedDateTime(
  value: string | undefined
): string | undefined {
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
    const monthIndex = MONTH_INDEX_BY_NAME[monthFirstMatch[1]!.toLowerCase()];
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

export function normalizeMediaTypeLabel(
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
