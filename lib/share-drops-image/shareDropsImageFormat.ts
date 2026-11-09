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

const CLOCK: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

function zoneFor(option: ShareImageTimeOption): string {
  return option.mode === "zone" && option.timeZone
    ? option.timeZone
    : UTC_TIME_ZONE_PREFERENCE;
}

/** The time shown next to a post, or null when times are hidden. */
export function formatShareImagePostTime(
  createdAt: number,
  firstCreatedAt: number,
  option: ShareImageTimeOption,
  formatLocale: Intl.LocalesArgument
): string | null {
  if (option.mode === "hidden") {
    return null;
  }
  if (option.mode === "elapsed") {
    const minutes = Math.max(
      0,
      Math.round((createdAt - firstCreatedAt) / 60_000)
    );
    if (minutes < 60) {
      return `+${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `+${hours} h` : `+${hours} h ${rest} min`;
  }
  return new Intl.DateTimeFormat(formatLocale, {
    ...CLOCK,
    timeZone: zoneFor(option),
    timeZoneName: "short",
  }).format(createdAt);
}

/** "Nov 9, 2026 · UTC" style subtitle under the wave name. */
export function formatShareImageDateLine(
  firstCreatedAt: number,
  lastCreatedAt: number,
  option: ShareImageTimeOption,
  formatLocale: Intl.LocalesArgument,
  labels: { readonly elapsed: string; readonly hidden: string }
): string {
  const timeZone = zoneFor(option);
  const dateFormat = new Intl.DateTimeFormat(formatLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone,
  });
  const first = dateFormat.format(firstCreatedAt);
  const last = dateFormat.format(lastCreatedAt);
  const dates = first === last ? first : `${first} – ${last}`;
  const zoneName = getTimeZoneShortName(
    formatLocale,
    timeZone,
    new Date(firstCreatedAt)
  );
  const parts = [dates, zoneName];
  if (option.mode === "elapsed") parts.push(labels.elapsed);
  if (option.mode === "hidden") parts.push(labels.hidden);
  return parts.join(" · ");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
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
