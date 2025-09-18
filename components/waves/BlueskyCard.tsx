import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import type { OpenGraphPreviewData } from "./OpenGraphPreview";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";

const SENSITIVE_LABELS = new Set([
  "porn",
  "sexual",
  "sexual-content",
  "explicit",
  "nsfw",
  "nudity",
  "gore",
  "graphic-media",
  "violence",
  "spoiler",
]);

interface BlueskyCardProps {
  readonly href: string;
  readonly preview: OpenGraphPreviewData;
}

interface BlueskyPostData {
  readonly uri: string;
  readonly createdAt: string | null;
  readonly text: string;
  readonly author: {
    readonly did: string | null;
    readonly handle: string;
    readonly displayName: string | null;
    readonly avatar: string | null;
  };
  readonly counts: {
    readonly replies: number;
    readonly reposts: number;
    readonly likes: number;
  };
  readonly inReplyTo: { readonly uri: string; readonly authorHandle?: string | null } | null;
  readonly images: readonly BlueskyImage[];
  readonly external: BlueskyExternal | null;
  readonly labels: readonly string[];
}

interface BlueskyProfileData {
  readonly did: string | null;
  readonly handle: string;
  readonly displayName: string | null;
  readonly avatar: string | null;
  readonly banner: string | null;
  readonly description: string | null;
  readonly counts: {
    readonly followers: number;
    readonly follows: number;
    readonly posts: number;
  };
}

interface BlueskyFeedData {
  readonly uri: string;
  readonly displayName: string | null;
  readonly description: string | null;
  readonly avatar: string | null;
  readonly creator: {
    readonly did: string | null;
    readonly handle: string;
    readonly displayName: string | null;
    readonly avatar: string | null;
  };
}

interface BlueskyUnavailableData {
  readonly targetKind: string | null;
}

interface BlueskyImage {
  readonly thumb: string;
  readonly fullsize: string;
  readonly alt: string;
}

interface BlueskyExternal {
  readonly uri: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly thumb: string | null;
}

export default function BlueskyCard({ href, preview }: BlueskyCardProps) {
  const previewType = getPreviewType(preview);
  const canonicalUrl = readString(preview.canonicalUrl) ?? href;

  if (!previewType) {
    return null;
  }

  if (previewType === "bluesky.post") {
    const post = parsePostData(preview);
    if (!post) {
      return renderUnavailable({ href, canonicalUrl, unavailable: null });
    }
    return (
      <BlueskyPostCard href={href} canonicalUrl={canonicalUrl} post={post} />
    );
  }

  if (previewType === "bluesky.profile") {
    const profile = parseProfileData(preview);
    if (!profile) {
      return renderUnavailable({ href, canonicalUrl, unavailable: null });
    }
    return (
      <BlueskyProfileCard
        href={href}
        canonicalUrl={canonicalUrl}
        profile={profile}
      />
    );
  }

  if (previewType === "bluesky.feed") {
    const feed = parseFeedData(preview);
    if (!feed) {
      return renderUnavailable({ href, canonicalUrl, unavailable: null });
    }
    return (
      <BlueskyFeedCard href={href} canonicalUrl={canonicalUrl} feed={feed} />
    );
  }

  if (previewType === "bluesky.unavailable") {
    const unavailable = parseUnavailableData(preview);
    return renderUnavailable({ href, canonicalUrl, unavailable });
  }

  return renderUnavailable({ href, canonicalUrl, unavailable: null });
}

function BlueskyPostCard({
  href,
  canonicalUrl,
  post,
}: {
  readonly href: string;
  readonly canonicalUrl: string;
  readonly post: BlueskyPostData;
}) {
  const [showSensitiveMedia, setShowSensitiveMedia] = useState(
    !containsSensitiveLabels(post.labels)
  );

  const timestamp = useMemo(() => formatTimestamp(post.createdAt), [post.createdAt]);

  const hasSensitiveLabels = containsSensitiveLabels(post.labels);
  const displayedText = post.text.trim().length > 0 ? post.text : null;

  return (
    <LinkPreviewCardLayout href={href}>
      <article className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4" data-testid="bluesky-post-card">
        <header className="tw-flex tw-items-start tw-gap-3">
          <Avatar
            src={post.author.avatar}
            altName={post.author.displayName ?? post.author.handle}
            fallbackInitial={post.author.handle.charAt(0).toUpperCase()}
          />
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
              <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                {post.author.displayName ?? `@${post.author.handle}`}
              </span>
              <span className="tw-text-sm tw-text-iron-400">@{post.author.handle}</span>
              {timestamp && (
                <time
                  dateTime={timestamp.date?.toISOString()}
                  className="tw-text-sm tw-text-iron-400"
                >
                  {timestamp.label}
                </time>
              )}
            </div>
            {post.inReplyTo && (
              <ReplyingToNotice reply={post.inReplyTo} />
            )}
          </div>
        </header>

        {displayedText && (
          <p className="tw-m-0 tw-whitespace-pre-wrap tw-text-sm tw-leading-6 tw-text-iron-100" data-testid="bluesky-post-text">
            {displayedText}
          </p>
        )}

        {post.images.length > 0 && (
          <BlueskyImageGallery
            images={post.images}
            hasSensitiveLabels={hasSensitiveLabels}
            showSensitive={showSensitiveMedia}
            onToggleSensitive={() => setShowSensitiveMedia((value) => !value)}
          />
        )}

        {post.external && (
          <ExternalPreview external={post.external} />
        )}

        <footer className="tw-flex tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-center md:tw-justify-between">
          <div className="tw-flex tw-flex-wrap tw-gap-4" aria-label="Post engagement counts">
            <CountPill label="Replies" value={post.counts.replies} />
            <CountPill label="Reposts" value={post.counts.reposts} />
            <CountPill label="Likes" value={post.counts.likes} />
          </div>
          <PrimaryActionLink
            href={canonicalUrl}
            label="Open post on Bluesky"
          />
        </footer>
      </article>
    </LinkPreviewCardLayout>
  );
}

function BlueskyProfileCard({
  href,
  canonicalUrl,
  profile,
}: {
  readonly href: string;
  readonly canonicalUrl: string;
  readonly profile: BlueskyProfileData;
}) {
  const displayName = profile.displayName ?? `@${profile.handle}`;

  return (
    <LinkPreviewCardLayout href={href}>
      <article
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4"
        data-testid="bluesky-profile-card"
      >
        {profile.banner && (
          <div className="tw-relative tw-h-28 tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
            <Image
              src={profile.banner}
              alt={`${displayName}'s profile banner`}
              fill
              className="tw-h-full tw-w-full tw-object-cover"
              priority={false}
              sizes="(max-width: 768px) 100vw, 480px"
              unoptimized
            />
          </div>
        )}
        <div className="tw-flex tw-items-start tw-gap-3">
          <Avatar
            src={profile.avatar}
            altName={displayName}
            fallbackInitial={profile.handle.charAt(0).toUpperCase()}
            size={64}
          />
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-lg tw-font-semibold tw-text-iron-100">
              {displayName}
            </span>
            <span className="tw-text-sm tw-text-iron-400">@{profile.handle}</span>
            {profile.description && (
              <p className="tw-m-0 tw-max-w-xl tw-whitespace-pre-wrap tw-text-sm tw-text-iron-200" data-testid="bluesky-profile-bio">
                {profile.description}
              </p>
            )}
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-4" aria-label="Profile statistics">
          <CountPill label="Followers" value={profile.counts.followers} />
          <CountPill label="Following" value={profile.counts.follows} />
          <CountPill label="Posts" value={profile.counts.posts} />
        </div>
        <PrimaryActionLink
          href={canonicalUrl}
          label="Open profile on Bluesky"
        />
      </article>
    </LinkPreviewCardLayout>
  );
}

function BlueskyFeedCard({
  href,
  canonicalUrl,
  feed,
}: {
  readonly href: string;
  readonly canonicalUrl: string;
  readonly feed: BlueskyFeedData;
}) {
  const creatorDisplayName = feed.creator.displayName ?? `@${feed.creator.handle}`;

  return (
    <LinkPreviewCardLayout href={href}>
      <article
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4"
        data-testid="bluesky-feed-card"
      >
        <div className="tw-flex tw-items-start tw-gap-3">
          <Avatar
            src={feed.avatar}
            altName={feed.displayName ?? "Bluesky feed"}
            fallbackInitial={(feed.displayName ?? feed.creator.handle).charAt(0).toUpperCase()}
            size={56}
          />
          <div className="tw-flex tw-flex-col tw-gap-1 tw-min-w-0">
            <span className="tw-text-lg tw-font-semibold tw-text-iron-100">
              {feed.displayName ?? "Bluesky feed"}
            </span>
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
              <Avatar
                src={feed.creator.avatar}
                altName={creatorDisplayName}
                fallbackInitial={feed.creator.handle.charAt(0).toUpperCase()}
                size={32}
              />
              <span>
                Created by {creatorDisplayName}
                {" "}
                <span className="tw-text-iron-500">(@{feed.creator.handle})</span>
              </span>
            </div>
          </div>
        </div>
        {feed.description && (
          <p className="tw-m-0 tw-whitespace-pre-wrap tw-text-sm tw-text-iron-200" data-testid="bluesky-feed-description">
            {feed.description}
          </p>
        )}
        <PrimaryActionLink href={canonicalUrl} label="Open feed on Bluesky" />
      </article>
    </LinkPreviewCardLayout>
  );
}

function renderUnavailable({
  href,
  canonicalUrl,
  unavailable,
}: {
  readonly href: string;
  readonly canonicalUrl: string;
  readonly unavailable: BlueskyUnavailableData | null;
}) {
  const displayHref = canonicalUrl || href;
  const domain = getDomain(displayHref) ?? displayHref;

  const message = getUnavailableMessage(unavailable?.targetKind);

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6"
        data-testid="bluesky-unavailable-card"
      >
        <div className="tw-space-y-2 tw-text-center">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-300">{message}</p>
          <a
            href={displayHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition tw-duration-200 hover:tw-text-primary-200"
          >
            {domain}
          </a>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}

function Avatar({
  src,
  altName,
  fallbackInitial,
  size = 48,
}: {
  readonly src: string | null;
  readonly altName: string;
  readonly fallbackInitial: string;
  readonly size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={altName}
        width={size}
        height={size}
        className="tw-rounded-full tw-object-cover"
        style={{ width: size, height: size }}
        loading="lazy"
        unoptimized
      />
    );
  }

  return (
    <div
      className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-semibold tw-text-iron-200"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {fallbackInitial}
    </div>
  );
}

function ReplyingToNotice({
  reply,
}: {
  readonly reply: { readonly uri: string; readonly authorHandle?: string | null };
}) {
  const handle = reply.authorHandle ? `@${reply.authorHandle}` : "this post";

  return (
    <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
      Replying to{" "}
      <a
        href={reply.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-text-primary-300 hover:tw-text-primary-200"
      >
        {handle}
      </a>
    </span>
  );
}

function BlueskyImageGallery({
  images,
  hasSensitiveLabels,
  showSensitive,
  onToggleSensitive,
}: {
  readonly images: readonly BlueskyImage[];
  readonly hasSensitiveLabels: boolean;
  readonly showSensitive: boolean;
  readonly onToggleSensitive: () => void;
}) {
  const gridClass = getImageGridClass(images.length);

  return (
    <div className="tw-space-y-2" data-testid="bluesky-image-gallery">
      <div className="tw-relative">
        <div
          className={
            "tw-grid tw-gap-2" +
            (hasSensitiveLabels && !showSensitive
              ? " tw-filter tw-blur-lg tw-brightness-75"
              : "") +
            ` ${gridClass}`
          }
          aria-hidden={hasSensitiveLabels && !showSensitive}
        >
          {images.map((image, index) => {
            const spanClass =
              images.length === 3 && index === 0 ? " tw-col-span-2" : "";
            return (
              <a
                key={`${image.fullsize}-${index}`}
                href={image.fullsize}
                target="_blank"
                rel="noopener noreferrer"
                className={
                "tw-relative tw-block tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-transition tw-duration-200 hover:tw-opacity-90" +
                spanClass
              }
            >
              <Image
                src={image.thumb}
                alt={image.alt}
                width={600}
                height={600}
                className="tw-h-full tw-w-full tw-object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
              />
            </a>
            );
          })}
        </div>
        {hasSensitiveLabels && (
          <button
            type="button"
            onClick={onToggleSensitive}
            className={
              showSensitive
                ? "tw-absolute tw-right-3 tw-top-3 tw-rounded-full tw-bg-iron-900/80 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-100 tw-transition tw-duration-200 hover:tw-bg-iron-900"
                : "tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900/70 tw-text-sm tw-font-semibold tw-text-iron-100"
            }
            aria-label={
              showSensitive
                ? "Hide sensitive media"
                : "Reveal sensitive Bluesky media"
            }
          >
            {showSensitive ? "Hide sensitive media" : "Sensitive content – click to reveal"}
          </button>
        )}
      </div>
    </div>
  );
}

function ExternalPreview({ external }: { readonly external: BlueskyExternal }) {
  return (
    <a
      href={external.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/60 tw-p-3 tw-transition tw-duration-200 hover:tw-border-iron-500"
      data-testid="bluesky-external-preview"
    >
      {external.thumb && (
        <div className="tw-relative tw-h-16 tw-w-16 tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
          <Image
            src={external.thumb}
            alt={external.title ?? external.uri}
            fill
            className="tw-object-cover"
            sizes="64px"
            loading="lazy"
            unoptimized
          />
        </div>
      )}
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {external.title ?? external.uri}
        </span>
        {external.description && (
          <span className="tw-text-xs tw-text-iron-300 tw-line-clamp-2">
            {external.description}
          </span>
        )}
        <span className="tw-text-xs tw-text-iron-500 tw-break-all">
          {external.uri}
        </span>
      </div>
    </a>
  );
}

function CountPill({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="tw-flex tw-flex-col" aria-label={`${value} ${label}`}>
      <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
        {formatCount(value)}
      </span>
      <span className="tw-text-xs tw-text-iron-400">{label}</span>
    </div>
  );
}

function PrimaryActionLink({
  href,
  label,
}: {
  readonly href: string;
  readonly label: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-200 hover:tw-bg-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/80"
      aria-label={label}
    >
      {label}
    </Link>
  );
}

function getPreviewType(preview: OpenGraphPreviewData | null | undefined): string | undefined {
  if (!preview) {
    return undefined;
  }
  const type = preview.type;
  return typeof type === "string" ? type : undefined;
}

function parsePostData(preview: OpenGraphPreviewData): BlueskyPostData | null {
  const record = readRecord(preview.post);
  if (!record) {
    return null;
  }

  const uri = readString(record.uri) ?? readString(preview.url) ?? "";
  const createdAt = readString(record.createdAt) ?? null;
  const text = readString(record.text) ?? "";
  const labels = readStringArray(record.labels);

  const authorRecord = readRecord(record.author);
  if (!authorRecord) {
    return null;
  }
  const handle = readString(authorRecord.handle) ?? "";
  if (!handle) {
    return null;
  }

  const author = {
    did: readString(authorRecord.did) ?? null,
    handle,
    displayName: readString(authorRecord.displayName) ?? null,
    avatar: readString(authorRecord.avatar) ?? null,
  };

  const countsRecord = readRecord(record.counts) ?? {};

  const inReplyRecord = readRecord(record.inReplyTo);
  const inReplyTo = inReplyRecord
    ? {
        uri: readString(inReplyRecord.uri) ?? "",
        authorHandle: readString(inReplyRecord.authorHandle) ?? null,
      }
    : null;

  const images = readArray(record.images, parseImageEntry);
  const external = parseExternalEntry(record.external);

  return {
    uri,
    createdAt,
    text,
    author,
    counts: {
      replies: readNumber(countsRecord.replies) ?? 0,
      reposts: readNumber(countsRecord.reposts) ?? 0,
      likes: readNumber(countsRecord.likes) ?? 0,
    },
    inReplyTo: inReplyTo && inReplyTo.uri ? inReplyTo : null,
    images,
    external,
    labels,
  };
}

function parseProfileData(preview: OpenGraphPreviewData): BlueskyProfileData | null {
  const record = readRecord(preview.profile);
  if (!record) {
    return null;
  }

  const handle = readString(record.handle) ?? "";
  if (!handle) {
    return null;
  }

  const countsRecord = readRecord(record.counts) ?? {};

  return {
    did: readString(record.did) ?? null,
    handle,
    displayName: readString(record.displayName) ?? null,
    avatar: readString(record.avatar) ?? null,
    banner: readString(record.banner) ?? null,
    description: readString(record.description) ?? null,
    counts: {
      followers: readNumber(countsRecord.followers) ?? 0,
      follows: readNumber(countsRecord.follows) ?? 0,
      posts: readNumber(countsRecord.posts) ?? 0,
    },
  };
}

function parseFeedData(preview: OpenGraphPreviewData): BlueskyFeedData | null {
  const record = readRecord(preview.feed);
  if (!record) {
    return null;
  }

  const creatorRecord = readRecord(record.creator);
  if (!creatorRecord) {
    return null;
  }
  const handle = readString(creatorRecord.handle) ?? "";
  if (!handle) {
    return null;
  }

  return {
    uri: readString(record.uri) ?? readString(preview.url) ?? "",
    displayName: readString(record.displayName) ?? null,
    description: readString(record.description) ?? null,
    avatar: readString(record.avatar) ?? null,
    creator: {
      did: readString(creatorRecord.did) ?? null,
      handle,
      displayName: readString(creatorRecord.displayName) ?? null,
      avatar: readString(creatorRecord.avatar) ?? null,
    },
  };
}

function parseUnavailableData(preview: OpenGraphPreviewData): BlueskyUnavailableData | null {
  const targetKind = readString(preview.targetKind);
  return { targetKind: targetKind ?? null };
}

function parseImageEntry(value: unknown): BlueskyImage | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }

  const thumb = readString(record.thumb);
  const fullsize = readString(record.fullsize) ?? thumb;
  if (!thumb || !fullsize) {
    return null;
  }

  return {
    thumb,
    fullsize,
    alt: readString(record.alt) ?? "Bluesky image",
  };
}

function parseExternalEntry(value: unknown): BlueskyExternal | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }

  const uri = readString(record.uri);
  if (!uri) {
    return null;
  }

  return {
    uri,
    title: readString(record.title) ?? null,
    description: readString(record.description) ?? null,
    thumb: readString(record.thumb) ?? null,
  };
}

function readRecord(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, any>;
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const result: string[] = [];
  for (const entry of value) {
    const normalized = readString(entry);
    if (normalized) {
      result.push(normalized.toLowerCase());
    }
  }
  return result;
}

function readArray<T>(value: unknown, parser: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const result: T[] = [];
  for (const entry of value) {
    const parsed = parser(entry);
    if (parsed) {
      result.push(parsed);
    }
  }
  return result;
}

function formatCount(value: number): string {
  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    notation: "compact",
  });
  return formatter.format(value);
}

function formatTimestamp(value: string | null): { label: string; date: Date | null } | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return { label: formatter.format(date), date };
}

function getImageGridClass(count: number): string {
  switch (count) {
    case 1:
      return "tw-grid-cols-1";
    case 2:
      return "tw-grid-cols-2";
    default:
      return "tw-grid-cols-2";
  }
}

function containsSensitiveLabels(labels: readonly string[]): boolean {
  return labels.some((label) => SENSITIVE_LABELS.has(label));
}

function getUnavailableMessage(targetKind: string | null | undefined): string {
  switch (targetKind) {
    case "post":
      return "This post is unavailable on Bluesky";
    case "profile":
      return "This profile is unavailable on Bluesky";
    case "feed":
      return "This feed is unavailable on Bluesky";
    default:
      return "Content unavailable on Bluesky";
  }
}

function getDomain(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.hostname;
  } catch {
    return null;
  }
}
