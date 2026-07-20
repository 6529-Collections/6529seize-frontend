"use client";

import { LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import XIcon from "@/components/user/utils/icons/XIcon";
import type { TweetPreview, TweetPreviewMedia } from "@/lib/twitter";
import { parseTweetUrl } from "@/lib/twitter/url";
import { useTwitterPreview } from "@/hooks/useTwitterPreview";
import {
  TweetMediaGridVideo,
  TweetVideo,
} from "./twitter-preview/TwitterPreviewVideo";

type PreviewState =
  | { readonly type: "loading" }
  | {
      readonly type: "ready";
      readonly preview: TweetPreview;
      readonly fallback: false;
    }
  | {
      readonly type: "ready";
      readonly preview: TweetPreview;
      readonly fallback: true;
    };

interface TwitterPreviewCardProps {
  readonly href: string;
  readonly tweetId: string;
}

const TWITTER_CARD_CLASSES =
  "tw-relative tw-w-full tw-min-w-0 tw-max-w-full tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950/70 tw-text-iron-50 tw-shadow-sm tw-shadow-black/20 tw-transition tw-duration-200 hover:tw-border-iron-600";

const ACTION_CLASSES =
  "tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/70 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-sky-400/50 hover:tw-bg-sky-400/10 hover:tw-text-sky-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

const TWITTER_ACCENT_COLOR = "#1d9bf0";

function stopCardEvent(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}

function fallbackPreview(href: string, tweetId: string): TweetPreview {
  const parsed = parseTweetUrl(href);
  return {
    tweetId,
    url: href,
    ...(parsed?.authorHandle ? { authorHandle: parsed.authorHandle } : {}),
  };
}

function getXPostPath(href: string): string {
  try {
    const url = new URL(href);
    return `${url.pathname}${url.search}`;
  } catch {
    return href;
  }
}

function formatTweetTimestamp(preview: TweetPreview): string | undefined {
  if (preview.createdAtIso) {
    const date = new Date(preview.createdAtIso);
    if (!Number.isNaN(date.getTime())) {
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
      const day = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
      return `${time}, ${day}`;
    }
  }

  return preview.createdAtText;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

function formatCount(value: number): string {
  if (value < 1000) {
    return formatInteger(value);
  }

  const units = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];
  const unit = units.find((candidate) => value >= candidate.value);
  if (!unit) {
    return formatInteger(value);
  }

  const floored = Math.floor((value / unit.value) * 10) / 10;
  return `${
    Number.isInteger(floored) ? floored.toFixed(0) : floored.toFixed(1)
  }${unit.suffix}`;
}

function TwitterHandleLink({ handle }: { readonly handle: string }) {
  return (
    <Link
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      className="tw-text-sky-200 tw-no-underline hover:tw-text-sky-100 hover:tw-underline"
    >
      @{handle}
    </Link>
  );
}

function renderTweetText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const mentionPattern = /(^|[^\w])@(\w{1,15})(?=\b)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text)) !== null) {
    const prefix = match[1] ?? "";
    const handle = match[2];
    if (!handle) {
      continue;
    }
    const mentionStart = match.index + prefix.length;
    const mention = `@${handle}`;
    if (mentionStart > lastIndex) {
      parts.push(text.slice(lastIndex, mentionStart));
    }
    parts.push(
      <TwitterHandleLink key={`${handle}-${mentionStart}`} handle={handle} />
    );
    lastIndex = mentionStart + mention.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function LoadingCard() {
  return (
    <div
      className={`${TWITTER_CARD_CLASSES} tw-p-3 sm:tw-p-4`}
      data-testid="twitter-post-skeleton"
    >
      <span
        aria-hidden="true"
        className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-opacity-85"
        style={{ backgroundColor: TWITTER_ACCENT_COLOR }}
      />
      <div className="tw-flex tw-animate-pulse tw-flex-col tw-gap-y-3 tw-pl-1">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-h-3 tw-w-10 tw-rounded tw-bg-iron-800/70" />
          <div className="tw-h-5 tw-w-12 tw-rounded-md tw-bg-sky-400/15" />
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <div className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-iron-800" />
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <div className="tw-h-4 tw-w-40 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-3 tw-w-32 tw-rounded tw-bg-iron-800/70" />
          </div>
        </div>
        <div className="tw-space-y-2">
          <div className="tw-h-4 tw-w-full tw-rounded tw-bg-iron-800" />
          <div className="tw-h-4 tw-w-11/12 tw-rounded tw-bg-iron-800" />
        </div>
        <div className="tw-aspect-video tw-rounded-lg tw-bg-iron-900" />
        <div className="tw-flex tw-gap-1.5">
          <div className="tw-h-6 tw-w-16 tw-rounded-md tw-bg-iron-900" />
          <div className="tw-h-6 tw-w-20 tw-rounded-md tw-bg-iron-900" />
          <div className="tw-h-6 tw-w-16 tw-rounded-md tw-bg-iron-900" />
        </div>
      </div>
    </div>
  );
}

function UnavailableCard({
  href,
  copied,
  onCopy,
}: {
  readonly href: string;
  readonly copied: boolean;
  readonly onCopy: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <article
      className={TWITTER_CARD_CLASSES}
      data-testid="twitter-post-fallback"
    >
      <span
        aria-hidden="true"
        className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-opacity-85"
        style={{ backgroundColor: TWITTER_ACCENT_COLOR }}
      />
      <div className="tw-flex tw-flex-col tw-gap-y-3 tw-p-3 tw-pl-4 sm:tw-p-4 sm:tw-pl-5">
        <div className="tw-flex tw-items-start tw-gap-x-3">
          <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-sky-400/20 tw-bg-sky-400/10 tw-p-2 tw-text-sky-100">
            <XIcon />
          </div>
          <div className="tw-min-w-0 tw-flex-1">
            <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
              X post preview unavailable
            </p>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={stopCardEvent}
              className="tw-mt-1 tw-block tw-truncate tw-text-sm tw-leading-5 tw-text-iron-400 tw-no-underline hover:tw-text-iron-100"
            >
              {href}
            </Link>
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-sky-400/30 tw-bg-sky-400/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-sky-100 tw-no-underline tw-transition hover:tw-border-sky-300/60 hover:tw-bg-sky-400/15 hover:tw-text-white"
          >
            Open on X
          </Link>
          <button
            type="button"
            onClick={onCopy}
            className={`${ACTION_CLASSES} tw-w-full tw-justify-center`}
          >
            <LinkIcon className="tw-h-5 tw-w-5" />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function AuthorAvatar({
  authorHref,
  authorName,
  profileImageUrl,
}: {
  readonly authorHref: string;
  readonly authorName: string;
  readonly profileImageUrl: string | undefined;
}) {
  return (
    <Link
      href={authorHref}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      className="tw-flex-shrink-0 tw-text-inherit tw-no-underline"
    >
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={authorName}
          className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-object-cover"
          loading="lazy"
        />
      ) : (
        <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-sky-400/20 tw-bg-sky-400/10 tw-p-2 tw-text-sky-100">
          <XIcon />
        </div>
      )}
    </Link>
  );
}

function TweetAuthorBlock({
  authorHref,
  authorName,
  authorHandle,
}: {
  readonly authorHref: string;
  readonly authorName: string;
  readonly authorHandle: string | undefined;
}) {
  return (
    <div className="tw-min-w-0">
      <Link
        href={authorHref}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        className="tw-line-clamp-1 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50 tw-no-underline hover:tw-text-white hover:tw-underline"
      >
        {authorName}
      </Link>
      {authorHandle && (
        <div className="tw-line-clamp-1 tw-text-xs tw-leading-4 tw-text-iron-400">
          <Link
            href={authorHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-text-iron-400 tw-no-underline hover:tw-text-iron-200 hover:tw-underline"
          >
            @{authorHandle}
          </Link>
        </div>
      )}
    </div>
  );
}

function TweetHeader({
  authorHref,
  authorName,
  preview,
}: {
  readonly authorHref: string;
  readonly authorName: string;
  readonly preview: TweetPreview;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-3">
        <AuthorAvatar
          authorHref={authorHref}
          authorName={authorName}
          profileImageUrl={preview.authorProfileImageUrl}
        />
        <TweetAuthorBlock
          authorHref={authorHref}
          authorName={authorName}
          authorHandle={preview.authorHandle}
        />
      </div>
      <span
        aria-hidden="true"
        className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black/20 tw-p-1.5 tw-text-iron-200 tw-transition hover:tw-border-sky-400/40 hover:tw-bg-sky-400/10 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <XIcon />
      </span>
    </div>
  );
}

function TweetKicker({
  href,
  timestamp,
  xPostPath,
}: {
  readonly href: string;
  readonly timestamp: string | undefined;
  readonly xPostPath: string;
}) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-1.5">
      <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-none tw-text-iron-500">
        X
      </span>
      <span className="tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-sky-400/30 tw-bg-sky-400/10 tw-px-2 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-sky-100">
        Post
      </span>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-500 tw-no-underline hover:tw-text-iron-300"
      >
        {timestamp ?? `x.com${xPostPath}`}
      </Link>
    </div>
  );
}

function TweetBodyText({
  authorName,
  href,
  replyToHandle,
  text,
}: {
  readonly authorName: string;
  readonly href: string;
  readonly replyToHandle: string | undefined;
  readonly text: string | undefined;
}) {
  if (text) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        {replyToHandle && (
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-400">
            Replying to <TwitterHandleLink handle={replyToHandle} />
          </p>
        )}
        <p className="tw-m-0 tw-line-clamp-6 tw-whitespace-pre-line tw-break-words tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-100 sm:tw-text-base">
          {renderTweetText(text)}
        </p>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
        X post preview unavailable
      </p>
      <p className="tw-m-0 tw-break-all tw-text-sm tw-leading-5 tw-text-iron-400">
        {href || authorName}
      </p>
    </div>
  );
}

function TweetMediaGridItem({
  alt,
  href,
  media,
}: {
  readonly alt: string;
  readonly href: string;
  readonly media: TweetPreviewMedia;
}) {
  if (media.type === "video" && media.videoUrl) {
    return <TweetMediaGridVideo media={media} />;
  }

  if (media.imageUrl) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        className="tw-block tw-h-full tw-w-full tw-no-underline"
      >
        <img
          src={media.imageUrl}
          alt={alt}
          className="tw-h-full tw-w-full tw-object-cover"
          loading="lazy"
        />
      </Link>
    );
  }

  return null;
}

function TweetMediaGrid({
  alt,
  href,
  mediaItems,
}: {
  readonly alt: string;
  readonly href: string;
  readonly mediaItems: readonly TweetPreviewMedia[];
}) {
  const visibleMediaItems = mediaItems.slice(0, 4);
  return (
    <div className="tw-grid tw-aspect-video tw-grid-cols-2 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black">
      {visibleMediaItems.map((media, index) => (
        <div
          key={media.videoUrl ?? media.imageUrl ?? media.posterUrl ?? index}
          className="tw-min-h-0 tw-min-w-0 tw-overflow-hidden tw-border-0 tw-border-solid tw-border-iron-800 odd:tw-border-r [&:nth-child(-n+2)]:tw-border-b"
        >
          <TweetMediaGridItem alt={alt} href={href} media={media} />
        </div>
      ))}
    </div>
  );
}

function TweetImage({
  alt,
  href,
  imageUrl,
}: {
  readonly alt: string;
  readonly href: string;
  readonly imageUrl: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      className="tw-relative tw-block tw-aspect-video tw-min-h-40 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-no-underline"
    >
      {/* Twitter media URLs are raw embed assets; keep <img> and reserve the frame to avoid late height changes. */}
      <img
        src={imageUrl}
        alt={alt}
        className="tw-h-full tw-w-full tw-object-contain"
        loading="lazy"
      />
    </Link>
  );
}

function TweetMediaLink({ mediaLink }: { readonly mediaLink: string }) {
  return (
    <Link
      href={mediaLink}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      className="tw-flex tw-min-h-24 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4 tw-text-center tw-text-sm tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition hover:tw-border-iron-600 hover:tw-text-iron-100"
    >
      Media on X
    </Link>
  );
}

function TweetMedia({
  authorName,
  href,
  preview,
}: {
  readonly authorName: string;
  readonly href: string;
  readonly preview: TweetPreview;
}) {
  if (preview.media && preview.media.length > 1) {
    return (
      <TweetMediaGrid
        alt={preview.text ?? authorName}
        href={href}
        mediaItems={preview.media}
      />
    );
  }

  if (preview.mediaVideoUrl) {
    return (
      <TweetVideo
        captionsUrl={preview.mediaCaptionsUrl}
        hlsUrl={preview.mediaVideoHlsUrl}
        posterUrl={preview.mediaPosterUrl ?? preview.mediaImageUrl}
        variants={preview.mediaVideoVariants}
        videoUrl={preview.mediaVideoUrl}
      />
    );
  }

  if (preview.mediaImageUrl) {
    return (
      <TweetImage
        alt={preview.text ?? authorName}
        href={href}
        imageUrl={preview.mediaImageUrl}
      />
    );
  }

  if (preview.mediaLink) {
    return <TweetMediaLink mediaLink={preview.mediaLink} />;
  }

  return null;
}

interface TweetFact {
  readonly label: string;
  readonly value: string;
}

function compactFacts(
  facts: readonly (TweetFact | null)[]
): readonly TweetFact[] {
  return facts.filter(
    (fact): fact is TweetFact => fact !== null && fact.value.trim().length > 0
  );
}

function getTweetFacts(preview: TweetPreview): readonly TweetFact[] {
  return compactFacts([
    preview.viewCount !== undefined && preview.viewCount > 0
      ? { label: "Views", value: formatCount(preview.viewCount) }
      : null,
    preview.favoriteCount !== undefined && preview.favoriteCount > 0
      ? { label: "Likes", value: formatCount(preview.favoriteCount) }
      : null,
    preview.conversationCount !== undefined && preview.conversationCount > 0
      ? { label: "Replies", value: formatCount(preview.conversationCount) }
      : null,
    preview.retweetCount !== undefined && preview.retweetCount > 0
      ? { label: "Reposts", value: formatCount(preview.retweetCount) }
      : null,
    preview.bookmarkCount !== undefined && preview.bookmarkCount > 0
      ? { label: "Bookmarks", value: formatCount(preview.bookmarkCount) }
      : null,
  ]);
}

function TweetFacts({ preview }: { readonly preview: TweetPreview }) {
  const facts = getTweetFacts(preview);
  if (facts.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5">
      {facts.map((fact) => (
        <span
          key={`${fact.label}-${fact.value}`}
          className="tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-baseline tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/75 tw-px-2 tw-py-0.5 tw-text-[11px] tw-leading-5"
        >
          <span className="tw-flex-shrink-0 tw-text-iron-400">
            {fact.label}
          </span>
          <span className="tw-truncate tw-font-semibold tw-text-iron-100">
            {fact.value}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function TwitterPreviewCard({
  href,
  tweetId,
}: TwitterPreviewCardProps) {
  const [copied, setCopied] = useState(false);
  const { data: twitterPreview, isLoading } = useTwitterPreview({
    href,
    tweetId,
  });

  let state: PreviewState;
  if (isLoading) {
    state = { type: "loading" };
  } else if (twitterPreview) {
    state = { type: "ready", preview: twitterPreview, fallback: false };
  } else {
    state = {
      type: "ready",
      preview: fallbackPreview(href, tweetId),
      fallback: true,
    };
  }

  const copyLink = (event: MouseEvent<HTMLButtonElement>) => {
    stopCardEvent(event);
    void navigator.clipboard.writeText(href).then(() => {
      setCopied(true);
      globalThis.window.setTimeout(() => setCopied(false), 900);
    });
  };

  const preview =
    state.type === "ready" ? state.preview : fallbackPreview(href, tweetId);
  const authorName =
    preview.authorName ??
    preview.authorHandle ??
    (state.type === "ready" ? "Twitter post" : " ");
  const authorHref =
    preview.authorUrl ??
    (preview.authorHandle ? `https://x.com/${preview.authorHandle}` : href);
  const xPostPath = useMemo(() => getXPostPath(href), [href]);
  const timestamp = useMemo(() => formatTweetTimestamp(preview), [preview]);

  if (state.type === "loading") {
    return <LoadingCard />;
  }

  if (state.fallback) {
    return <UnavailableCard href={href} copied={copied} onCopy={copyLink} />;
  }

  return (
    <article
      className={TWITTER_CARD_CLASSES}
      data-testid="twitter-post-preview"
    >
      <span
        aria-hidden="true"
        className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-opacity-85"
        style={{ backgroundColor: TWITTER_ACCENT_COLOR }}
      />
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label="Open post on X"
        className="tw-absolute tw-inset-0 tw-z-0 tw-rounded-lg"
      />
      <div className="tw-pointer-events-none tw-relative tw-z-10 tw-flex tw-flex-col tw-gap-y-3 tw-p-3 tw-pl-4 sm:tw-p-4 sm:tw-pl-5 [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto [&_video]:tw-pointer-events-auto">
        <TweetKicker href={href} timestamp={timestamp} xPostPath={xPostPath} />

        <TweetHeader
          authorHref={authorHref}
          authorName={authorName}
          preview={preview}
        />

        <TweetBodyText
          authorName={authorName}
          href={href}
          replyToHandle={preview.replyToHandle}
          text={preview.text}
        />

        <TweetMedia authorName={authorName} href={href} preview={preview} />

        <TweetFacts preview={preview} />
      </div>
    </article>
  );
}
