import { formatDate, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getTimeZoneShortName,
  UTC_TIME_ZONE_PREFERENCE,
} from "@/lib/display-time-zone/displayTimeZone";

/**
 * How times appear in a shared image of posts. The image never uses the
 * viewer's device zone implicitly: UTC by default, the time since the first
 * post, no times, or a zone the viewer picks (which may be their own).
 */
export type ShareImageTimeMode = "utc" | "elapsed" | "hidden" | "zone";

export interface ShareImageTimeOption {
  readonly mode: ShareImageTimeMode;
  /** IANA zone for `zone` mode. */
  readonly timeZone?: string | undefined;
}

export const DEFAULT_SHARE_IMAGE_TIME: ShareImageTimeOption = {
  mode: "utc",
};

/** One image holds at most this many posts (mobile canvas size limits). */
export const MAX_SHARE_IMAGE_POSTS = 20;

function zoneFor(option: ShareImageTimeOption): string {
  return option.mode === "zone" && option.timeZone
    ? option.timeZone
    : UTC_TIME_ZONE_PREFERENCE;
}

/**
 * The earliest and latest post times. Posts are ordered by serial number,
 * which is usually but not always chronological, so the span is computed.
 */
export function getShareImageTimeSpan(createdAts: readonly number[]): {
  readonly first: number;
  readonly last: number;
} {
  if (createdAts.length === 0) {
    const now = Date.now();
    return { first: now, last: now };
  }
  let first = Number.POSITIVE_INFINITY;
  let last = Number.NEGATIVE_INFINITY;
  for (const createdAt of createdAts) {
    first = Math.min(first, createdAt);
    last = Math.max(last, createdAt);
  }
  return { first, last };
}

function formatElapsed(locale: SupportedLocale, milliseconds: number): string {
  const minutes = Math.max(0, Math.round(milliseconds / 60_000));
  if (minutes < 60) {
    return t(locale, "shareImage.time.elapsedMinutes", { minutes });
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0
    ? t(locale, "shareImage.time.elapsedHours", { hours })
    : t(locale, "shareImage.time.elapsedHoursMinutes", {
        hours,
        minutes: rest,
      });
}

/** The time shown next to a post, or null when times are hidden. */
export function formatShareImagePostTime(
  createdAt: number,
  firstCreatedAt: number,
  option: ShareImageTimeOption,
  locale: SupportedLocale
): string | null {
  if (option.mode === "hidden") {
    return null;
  }
  if (option.mode === "elapsed") {
    return formatElapsed(locale, createdAt - firstCreatedAt);
  }
  return formatTime(locale, createdAt, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zoneFor(option),
    timeZoneName: "short",
  });
}

/** "Nov 9, 2026 · UTC" style subtitle under the wave name. */
export function formatShareImageDateLine(
  firstCreatedAt: number,
  lastCreatedAt: number,
  option: ShareImageTimeOption,
  locale: SupportedLocale
): string {
  const timeZone = zoneFor(option);
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone,
  };
  const first = formatDate(locale, firstCreatedAt, dateOptions);
  const last = formatDate(locale, lastCreatedAt, dateOptions);
  const dates = first === last ? first : `${first} – ${last}`;
  const parts = [
    dates,
    getTimeZoneShortName(locale, timeZone, new Date(firstCreatedAt)),
  ];
  if (option.mode === "elapsed") {
    parts.push(t(locale, "shareImage.time.elapsedLabel"));
  }
  if (option.mode === "hidden") {
    parts.push(t(locale, "shareImage.time.hiddenLabel"));
  }
  return parts.join(" · ");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-")
    .slice(0, 48);
}

/**
 * The PNG file name: the wave name and the first post's UTC date, never the
 * local clock. Private conversations leave the name out, because file names
 * show up in share sheets and download folders.
 */
export function getShareImageFileName(
  waveName: string,
  firstCreatedAt: number,
  isPrivate: boolean
): string {
  const date = new Date(firstCreatedAt).toISOString().slice(0, 10);
  const slug = isPrivate ? "" : slugify(waveName);
  return `${slug || "6529-posts"}-${date}.png`;
}
