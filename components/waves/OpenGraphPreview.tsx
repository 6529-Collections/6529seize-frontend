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

type ThreadsPostCardData = {
  readonly kind: "post";
  readonly canonicalUrl: string | null;
  readonly handle: string;
  readonly postId: string;
  readonly author: {
    readonly displayName: string | null;
    readonly profileUrl: string | null;
    readonly avatar: string | null;
  };
  readonly createdAt: string | null;
  readonly text: string | null;
  readonly images: ReadonlyArray<{ readonly url: string; readonly alt: string }>;
};

type ThreadsProfileCardData = {
  readonly kind: "profile";
  readonly canonicalUrl: string | null;
  readonly handle: string;
  readonly displayName: string | null;
  readonly avatar: string | null;
  readonly banner: string | null;
  readonly bio: string | null;
};

type ThreadsUnavailableCardData = {
  readonly kind: "unavailable";
  readonly canonicalUrl: string | null;
  readonly reason: string | null;
};

type ThreadsCardData =
  | ThreadsPostCardData
  | ThreadsProfileCardData
  | ThreadsUnavailableCardData;

const THREADS_UNAVAILABLE_MESSAGES: Record<
  string,
  { readonly title: string; readonly description: string }
> = {
  login_required: {
    title: "Threads content unavailable",
    description: "Log in to Threads to view this link.",
  },
  removed: {
    title: "Threads content unavailable",
    description: "This Threads link may have been removed or is no longer public.",
  },
  rate_limited: {
    title: "Threads content temporarily unavailable",
    description: "We are temporarily unable to load this Threads link. Please try again later.",
  },
  error: {
    title: "Threads content unavailable",
    description: "We could not load details for this Threads link.",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readMaybeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readString(value: unknown): string | null {
  const result = readMaybeString(value);
  return result === undefined ? null : result;
}

function readCanonicalUrl(record: Record<string, unknown>): string | null {
  return (
    readMaybeString(record.canonicalUrl) ??
    readMaybeString(record.canonical_url) ??
    null
  );
}

function parseThreadsImages(
  value: unknown,
  handle: string
): ReadonlyArray<{ readonly url: string; readonly alt: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  const images: Array<{ readonly url: string; readonly alt: string }> = [];
  const seen = new Set<string>();
  const defaultAlt = `Image from @${handle}'s Threads post`;

  for (const entry of value) {
    if (typeof entry === "string") {
      const trimmed = entry.trim();
      if (!trimmed || seen.has(trimmed)) {
        continue;
      }
      seen.add(trimmed);
      images.push({ url: trimmed, alt: defaultAlt });
      continue;
    }

    if (!isRecord(entry)) {
      continue;
    }

    const url =
      readMaybeString(entry.url) ??
      readMaybeString(entry.secureUrl) ??
      readMaybeString(entry.secure_url);
    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    const alt = readMaybeString(entry.alt) ?? readMaybeString(entry.title) ?? defaultAlt;
    images.push({ url, alt });
  }

  return images.slice(0, 4);
}

function deriveProfileUrl(
  canonicalUrl: string | null,
  handle: string
): string | null {
  if (canonicalUrl) {
    try {
      const parsed = new URL(canonicalUrl);
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length >= 1 && segments[0].startsWith("@")) {
        if (segments.length >= 2 && segments[1] === "post") {
          parsed.pathname = `/${segments[0]}`;
          parsed.search = "";
          parsed.hash = "";
          return parsed.toString();
        }
        return parsed.toString();
      }
    } catch {
      // ignore parse errors
    }
  }

  return `https://threads.com/@${handle}`;
}

function extractHandleFromCanonical(canonicalUrl: string | null): string | null {
  if (!canonicalUrl) {
    return null;
  }

  try {
    const parsed = new URL(canonicalUrl);
    const segment = parsed.pathname
      .split("/")
      .find((part) => part.startsWith("@"));
    return segment ? segment.slice(1) : null;
  } catch {
    return null;
  }
}

function formatThreadsTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed);
  } catch {
    return null;
  }
}

function interpretThreadsPreview(
  preview: OpenGraphPreviewData | null | undefined
): ThreadsCardData | null {
  if (!preview || !isRecord(preview)) {
    return null;
  }

  const type = readMaybeString(preview.type);
  if (!type || !type.startsWith("threads.")) {
    return null;
  }

  if (type === "threads.post") {
    const postRecord = isRecord(preview.post) ? preview.post : null;
    if (!postRecord) {
      return null;
    }

    const handle = readMaybeString(postRecord.handle);
    const postId = readMaybeString(postRecord.postId ?? postRecord.post_id);
    if (!handle || !postId) {
      return null;
    }

    const authorRecord = isRecord(postRecord.author) ? postRecord.author : {};
    const canonicalUrl = readCanonicalUrl(preview);
    const profileUrl =
      readMaybeString(authorRecord.profileUrl) ??
      readMaybeString(authorRecord.profile_url) ??
      deriveProfileUrl(canonicalUrl, handle);

    return {
      kind: "post",
      canonicalUrl,
      handle,
      postId,
      author: {
        displayName: readString(authorRecord.displayName ?? authorRecord.display_name),
        profileUrl: profileUrl ?? null,
        avatar: readString(authorRecord.avatar),
      },
      createdAt: readString(postRecord.createdAt ?? postRecord.created_at),
      text: readString(postRecord.text),
      images: parseThreadsImages(postRecord.images, handle),
    };
  }

  if (type === "threads.profile") {
    const profileRecord = isRecord(preview.profile) ? preview.profile : null;
    if (!profileRecord) {
      return null;
    }

    const handle = readMaybeString(profileRecord.handle);
    if (!handle) {
      return null;
    }

    return {
      kind: "profile",
      canonicalUrl: readCanonicalUrl(preview),
      handle,
      displayName: readString(profileRecord.displayName ?? profileRecord.display_name),
      avatar: readString(profileRecord.avatar),
      banner: readString(profileRecord.banner),
      bio: readString(profileRecord.bio),
    };
  }

  if (type === "threads.unavailable") {
    return {
      kind: "unavailable",
      canonicalUrl: readCanonicalUrl(preview),
      reason: readString(preview.reason),
    };
  }

  return null;
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
  if (interpretThreadsPreview(preview)) {
    return true;
  }

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

  const threadsPreview = interpretThreadsPreview(preview);

  if (threadsPreview?.kind === "post") {
    return <ThreadsPostCard href={href} data={threadsPreview} />;
  }

  if (threadsPreview?.kind === "profile") {
    return <ThreadsProfileCard href={href} data={threadsPreview} />;
  }

  if (threadsPreview?.kind === "unavailable") {
    return <ThreadsUnavailableCard href={href} data={threadsPreview} />;
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

function ThreadsPostCard({
  href,
  data,
}: {
  readonly href: string;
  readonly data: ThreadsPostCardData;
}) {
  const canonicalHref = data.canonicalUrl ?? href;
  const profileHref = data.author.profileUrl ?? canonicalHref;
  const timestamp = formatThreadsTimestamp(data.createdAt);
  const handleLabel = `@${data.handle}`;
  const displayName = data.author.displayName ?? handleLabel;

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
        data-testid="threads-post-card">
        <div className="tw-flex tw-flex-col tw-gap-y-3">
          <div className="tw-flex tw-items-start tw-gap-x-3">
            <Link
              href={profileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-flex-shrink-0 tw-h-10 tw-w-10">
              {data.author.avatar ? (
                <Image
                  src={data.author.avatar}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="tw-h-10 tw-w-10 tw-rounded-full tw-object-cover"
                  unoptimized
                />
              ) : (
                <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-semibold tw-text-iron-400">
                  {data.handle.slice(0, 1).toUpperCase()}
                </div>
              )}
            </Link>
            <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-1">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-sm tw-text-iron-400">
                <span className="tw-text-base tw-font-semibold tw-text-iron-100">
                  {displayName}
                </span>
                <span>{handleLabel}</span>
                {timestamp && (
                  <span className="tw-text-xs tw-text-iron-500">· {timestamp}</span>
                )}
              </div>
              {data.text && (
                <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-leading-relaxed tw-whitespace-pre-wrap tw-break-words tw-line-clamp-6">
                  {data.text}
                </p>
              )}
            </div>
          </div>
          {data.images.length > 0 && (
            <ThreadsImageGrid canonicalHref={canonicalHref} images={data.images} />
          )}
          <div>
            <Link
              href={canonicalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-200 tw-transition hover:tw-border-primary-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              aria-label="Open this post on Threads">
              Open on Threads
            </Link>
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function ThreadsProfileCard({
  href,
  data,
}: {
  readonly href: string;
  readonly data: ThreadsProfileCardData;
}) {
  const canonicalHref = data.canonicalUrl ?? href;
  const handleLabel = `@${data.handle}`;
  const displayName = data.displayName ?? handleLabel;

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
        data-testid="threads-profile-card">
        <div className="tw-flex tw-flex-col tw-gap-y-3">
          {data.banner && (
            <div className="tw-h-24 tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
              <Image
                src={data.banner}
                alt={`${displayName} Threads banner`}
                width={1200}
                height={320}
                className="tw-h-full tw-w-full tw-object-cover"
                unoptimized
                loading="lazy"
              />
            </div>
          )}
          <div className="tw-flex tw-items-center tw-gap-x-3">
            {data.avatar ? (
              <Image
                src={data.avatar}
                alt={displayName}
                width={160}
                height={160}
                className="tw-h-16 tw-w-16 tw-rounded-full tw-object-cover"
                unoptimized
              />
            ) : (
              <div className="tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-lg tw-font-semibold tw-text-iron-400">
                {data.handle.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="tw-flex tw-flex-col tw-gap-y-1">
              <span className="tw-text-lg tw-font-semibold tw-text-iron-100">
                {displayName}
              </span>
              <span className="tw-text-sm tw-text-iron-400">{handleLabel}</span>
            </div>
          </div>
          {data.bio && (
            <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-leading-relaxed tw-whitespace-pre-wrap">
              {data.bio}
            </p>
          )}
          <div>
            <Link
              href={canonicalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-200 tw-transition hover:tw-border-primary-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              aria-label="Open this profile on Threads">
              Open profile on Threads
            </Link>
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function ThreadsUnavailableCard({
  href,
  data,
}: {
  readonly href: string;
  readonly data: ThreadsUnavailableCardData;
}) {
  const canonicalHref = data.canonicalUrl ?? href;
  const reasonKey = data.reason ?? "error";
  const message = THREADS_UNAVAILABLE_MESSAGES[reasonKey] ?? THREADS_UNAVAILABLE_MESSAGES.error;
  const handle = extractHandleFromCanonical(data.canonicalUrl);

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6"
        data-testid="threads-unavailable-card">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-2 tw-text-center">
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {message.title}
          </p>
          {handle && (
            <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              @{handle}
            </span>
          )}
          <p className="tw-m-0 tw-text-xs tw-text-iron-300 tw-max-w-sm">
            {message.description}
          </p>
          <Link
            href={canonicalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-200 tw-transition hover:tw-border-primary-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            aria-label="Open this link on Threads">
            Open on Threads
          </Link>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function ThreadsImageGrid({
  canonicalHref,
  images,
}: {
  readonly canonicalHref: string;
  readonly images: ReadonlyArray<{ readonly url: string; readonly alt: string }>;
}) {
  const gridClass = images.length === 1 ? "tw-grid-cols-1" : "tw-grid-cols-2";

  return (
    <div className={`tw-grid ${gridClass} tw-gap-2`} data-testid="threads-post-images">
      {images.map((image, index) => (
        <Link
          key={`${image.url}-${index}`}
          href={canonicalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-relative tw-block">
          <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60 tw-aspect-square">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="tw-h-full tw-w-full tw-object-cover"
              sizes="(max-width: 768px) 100vw, 240px"
              loading="lazy"
              unoptimized
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
