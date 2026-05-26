"use client";

import {
  ArrowPathRoundedSquareIcon,
  BookmarkIcon,
  ChatBubbleOvalLeftIcon,
  HeartIcon,
  LinkIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import XIcon from "@/components/user/utils/icons/XIcon";
import type { TweetPreview, TweetPreviewMedia } from "@/lib/twitter";
import { parseTweetUrl } from "@/lib/twitter/url";
import { fetchTwitterPreview } from "@/services/api/twitter-preview-api";

import { useLinkPreviewContext } from "./LinkPreviewContext";

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
  "tw-w-full tw-min-w-0 tw-max-w-full md:tw-max-w-[560px] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-[#15202b] tw-text-[#f7f9f9] tw-shadow-sm";

const ACTION_CLASSES =
  "tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-sm tw-font-semibold tw-text-[#8b98a5] tw-no-underline tw-transition tw-duration-200 hover:tw-text-[#1d9bf0] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

const STATIC_ACTION_CLASSES =
  "tw-inline-flex tw-items-center tw-gap-x-2 tw-px-2 tw-py-1 tw-text-sm tw-font-semibold tw-text-[#8b98a5]";

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
      return `${time} · ${day}`;
    }
  }

  return preview.createdAtText;
}

function formatCount(value: number): string {
  if (value < 1000) {
    return value.toLocaleString();
  }

  const units = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];
  const unit = units.find((candidate) => value >= candidate.value);
  if (!unit) {
    return value.toLocaleString();
  }

  const floored = Math.floor((value / unit.value) * 10) / 10;
  return `${Number.isInteger(floored) ? floored.toFixed(0) : floored.toFixed(1)}${unit.suffix}`;
}

function formatViews(value: number): string {
  return `${formatCount(value)} ${value === 1 ? "View" : "Views"}`;
}

function TwitterHandleLink({ handle }: { readonly handle: string }) {
  return (
    <Link
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      className="tw-text-[#6ecbff] tw-no-underline hover:tw-underline"
    >
      @{handle}
    </Link>
  );
}

function renderTweetText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const mentionPattern = /@(\w{1,15})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text)) !== null) {
    const mention = match[0];
    const handle = match[1];
    if (!handle) {
      continue;
    }
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <TwitterHandleLink key={`${handle}-${match.index}`} handle={handle} />
    );
    lastIndex = match.index + mention.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function LoadingCard() {
  return (
    <div
      className={`${TWITTER_CARD_CLASSES} tw-p-4`}
      data-testid="twitter-post-skeleton"
    >
      <div className="tw-flex tw-animate-pulse tw-flex-col tw-gap-y-4">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <div className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-[#263544]" />
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <div className="tw-h-4 tw-w-40 tw-rounded tw-bg-[#263544]" />
            <div className="tw-h-3 tw-w-36 tw-rounded tw-bg-[#263544]/80" />
          </div>
        </div>
        <div className="tw-space-y-2">
          <div className="tw-h-4 tw-w-full tw-rounded tw-bg-[#263544]" />
          <div className="tw-h-4 tw-w-11/12 tw-rounded tw-bg-[#263544]" />
        </div>
        <div className="tw-aspect-[4/3] tw-min-h-72 tw-rounded-xl tw-bg-[#263544]/80" />
        <div className="tw-h-4 tw-w-44 tw-rounded tw-bg-[#263544]" />
        <div className="tw-h-px tw-w-full tw-bg-[#42566b]" />
        <div className="tw-flex tw-gap-x-8">
          <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-[#263544]" />
          <div className="tw-h-4 tw-w-20 tw-rounded tw-bg-[#263544]" />
          <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-[#263544]" />
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
      <div className="tw-flex tw-flex-col tw-gap-y-3 tw-p-4">
        <div className="tw-flex tw-items-start tw-gap-x-3">
          <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#0f1720] tw-p-2">
            <XIcon />
          </div>
          <div className="tw-min-w-0 tw-flex-1">
            <p className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-[#f7f9f9]">
              Tweet preview unavailable
            </p>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={stopCardEvent}
              className="tw-mt-1 tw-block tw-truncate tw-text-sm tw-leading-5 tw-text-[#8b98a5] tw-no-underline hover:tw-text-[#f7f9f9]"
            >
              {href}
            </Link>
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-2">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-[#42566b] tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-[#6ecbff] tw-no-underline tw-transition hover:tw-border-[#5a7088] hover:tw-text-[#9bddff]"
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
          className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-full tw-object-cover"
          loading="lazy"
        />
      ) : (
        <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#0f1720] tw-p-2">
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
  followHref,
}: {
  readonly authorHref: string;
  readonly authorName: string;
  readonly authorHandle: string | undefined;
  readonly followHref: string | undefined;
}) {
  return (
    <div className="tw-min-w-0">
      <Link
        href={authorHref}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        className="tw-line-clamp-1 tw-text-sm tw-font-bold tw-leading-4 tw-text-[#f7f9f9] tw-no-underline hover:tw-underline"
      >
        {authorName}
      </Link>
      {authorHandle && (
        <div className="tw-line-clamp-1 tw-text-xs tw-leading-4 tw-text-[#8b98a5]">
          <Link
            href={authorHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-text-[#8b98a5] tw-no-underline hover:tw-underline"
          >
            @{authorHandle}
          </Link>
          <span className="tw-px-1">·</span>
          <Link
            href={followHref ?? authorHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-font-semibold tw-text-[#6ecbff] tw-no-underline hover:tw-text-[#9bddff]"
          >
            Follow
          </Link>
        </div>
      )}
    </div>
  );
}

function TweetHeader({
  authorHref,
  authorName,
  followHref,
  href,
  preview,
}: {
  readonly authorHref: string;
  readonly authorName: string;
  readonly followHref: string | undefined;
  readonly href: string;
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
          followHref={followHref}
        />
      </div>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        aria-label="Open post on X"
        className="tw-h-7 tw-w-7 tw-flex-shrink-0 tw-text-[#f7f9f9] tw-transition hover:tw-text-white"
      >
        <XIcon />
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
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-[#8b98a5]">
            Replying to <TwitterHandleLink handle={replyToHandle} />
          </p>
        )}
        <p className="tw-m-0 tw-whitespace-pre-line tw-break-words tw-text-base tw-font-normal tw-leading-6 tw-text-[#f7f9f9]">
          {renderTweetText(text)}
        </p>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2">
      <p className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-[#f7f9f9]">
        Tweet preview unavailable
      </p>
      <p className="tw-m-0 tw-break-all tw-text-sm tw-leading-5 tw-text-[#8b98a5]">
        {href || authorName}
      </p>
    </div>
  );
}

function TweetVideo({
  captionsUrl,
  posterUrl,
  videoUrl,
}: {
  readonly captionsUrl: string | undefined;
  readonly posterUrl: string | undefined;
  readonly videoUrl: string;
}) {
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-black">
      <video
        src={videoUrl}
        poster={posterUrl}
        className="tw-block tw-h-auto tw-max-h-[24rem] tw-w-full tw-object-contain"
        controls
        playsInline
        preload="metadata"
        onClick={stopCardEvent}
      >
        <track
          kind="captions"
          src={captionsUrl ?? "data:text/vtt,WEBVTT"}
          srcLang="en"
          label="Captions"
          default
        />
      </video>
    </div>
  );
}

function TweetMediaGridVideo({
  media,
}: {
  readonly media: TweetPreviewMedia;
}) {
  const [playing, setPlaying] = useState(false);
  const posterUrl = media.posterUrl ?? media.imageUrl;

  const playVideo = (event: MouseEvent<HTMLButtonElement>) => {
    stopCardEvent(event);
    setPlaying(true);
  };

  const stopVideoEvent = (event: SyntheticEvent<HTMLVideoElement>) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  };

  if (posterUrl && !playing) {
    return (
      <button
        type="button"
        onClick={playVideo}
        className="tw-relative tw-block tw-h-full tw-w-full tw-border-0 tw-bg-black tw-p-0"
      >
        <img
          src={posterUrl}
          alt="Tweet video"
          className="tw-h-full tw-w-full tw-object-cover"
          loading="lazy"
        />
        <span className="tw-absolute tw-bottom-3 tw-left-3 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-black/70 tw-text-white">
          <PlayIcon className="tw-h-4 tw-w-4 tw-fill-current" />
        </span>
      </button>
    );
  }

  return (
    <video
      src={media.videoUrl}
      poster={posterUrl}
      className="tw-h-full tw-w-full tw-object-contain"
      controls
      playsInline
      preload="metadata"
      autoPlay={playing}
      onClick={stopVideoEvent}
    >
      <track
        kind="captions"
        src={media.captionsUrl ?? "data:text/vtt,WEBVTT"}
        srcLang="en"
        label="Captions"
        default
      />
    </video>
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
    <div className="tw-grid tw-aspect-video tw-grid-cols-2 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-black">
      {visibleMediaItems.map((media, index) => (
        <div
          key={media.videoUrl ?? media.imageUrl ?? media.posterUrl ?? index}
          className="tw-min-h-0 tw-min-w-0 tw-overflow-hidden tw-border-0 tw-border-solid tw-border-[#42566b] odd:tw-border-r [&:nth-child(-n+2)]:tw-border-b"
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
      className="tw-block tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-black tw-no-underline"
    >
      <img
        src={imageUrl}
        alt={alt}
        className="tw-h-auto tw-max-h-[24rem] tw-w-full tw-object-contain"
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
      className="tw-flex tw-min-h-24 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-[#0f1720] tw-p-4 tw-text-center tw-text-sm tw-font-semibold tw-text-[#8b98a5] tw-no-underline tw-transition hover:tw-border-[#5a7088] hover:tw-text-[#f7f9f9]"
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
        posterUrl={preview.mediaPosterUrl ?? preview.mediaImageUrl}
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

function TweetActions({
  copied,
  onCopy,
  preview,
  tweetId,
}: {
  readonly copied: boolean;
  readonly onCopy: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly preview: TweetPreview;
  readonly tweetId: string;
}) {
  return (
    <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-2">
      <Link
        href={`https://x.com/intent/tweet?in_reply_to=${tweetId}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        aria-label="Reply"
        className={ACTION_CLASSES}
      >
        <ChatBubbleOvalLeftIcon className="tw-h-5 tw-w-5" />
        <span>
          {preview.conversationCount === undefined
            ? "0"
            : formatCount(preview.conversationCount)}
        </span>
      </Link>
      <Link
        href={`https://x.com/intent/retweet?tweet_id=${tweetId}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        aria-label="Repost"
        className={`${ACTION_CLASSES} hover:tw-text-[#00ba7c]`}
      >
        <ArrowPathRoundedSquareIcon className="tw-h-5 tw-w-5" />
        {preview.retweetCount !== undefined && preview.retweetCount > 0 && (
          <span>{formatCount(preview.retweetCount)}</span>
        )}
      </Link>
      <Link
        href={`https://x.com/intent/like?tweet_id=${tweetId}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        aria-label="Like"
        className={`${ACTION_CLASSES} hover:tw-text-[#f91880]`}
      >
        <HeartIcon className="tw-h-5 tw-w-5" />
        <span>
          {preview.favoriteCount === undefined
            ? "0"
            : formatCount(preview.favoriteCount)}
        </span>
      </Link>
      {preview.bookmarkCount !== undefined && (
        <div className={STATIC_ACTION_CLASSES} aria-label="Bookmarks">
          <BookmarkIcon className="tw-h-5 tw-w-5" />
          <span>{formatCount(preview.bookmarkCount)}</span>
        </div>
      )}
      <button type="button" onClick={onCopy} className={ACTION_CLASSES}>
        <LinkIcon className="tw-h-5 tw-w-5" />
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

export default function TwitterPreviewCard({
  href,
  tweetId,
}: TwitterPreviewCardProps) {
  const { hideActions } = useLinkPreviewContext();
  const [state, setState] = useState<PreviewState>({ type: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ type: "loading" });

    fetchTwitterPreview(href)
      .then((preview) => {
        if (active) {
          setState({ type: "ready", preview, fallback: false });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            type: "ready",
            preview: fallbackPreview(href, tweetId),
            fallback: true,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [href, tweetId]);

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
  const followHref = preview.authorHandle
    ? `https://x.com/intent/follow?screen_name=${encodeURIComponent(
        preview.authorHandle
      )}`
    : undefined;
  const xPostPath = useMemo(
    () => getXPostPath(preview.url || href),
    [href, preview.url]
  );
  const timestamp = useMemo(() => formatTweetTimestamp(preview), [preview]);

  if (state.type === "loading") {
    return <LoadingCard />;
  }

  if (state.fallback) {
    return <UnavailableCard href={href} copied={copied} onCopy={copyLink} />;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      className={`${TWITTER_CARD_CLASSES} tw-block tw-cursor-pointer tw-no-underline`}
      data-testid="twitter-post-preview"
    >
      <div className="tw-flex tw-flex-col tw-gap-y-3 tw-p-3">
        <TweetHeader
          authorHref={authorHref}
          authorName={authorName}
          followHref={followHref}
          href={href}
          preview={preview}
        />

        <TweetBodyText
          authorName={authorName}
          href={href}
          replyToHandle={preview.replyToHandle}
          text={preview.text}
        />

        <TweetMedia authorName={authorName} href={href} preview={preview} />

        <div className="tw-flex tw-items-center tw-gap-x-2 tw-border-0 tw-border-b tw-border-solid tw-border-[#42566b] tw-pb-3 tw-text-sm tw-text-[#8b98a5]">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-min-w-0 tw-truncate tw-text-[#8b98a5] tw-no-underline hover:tw-text-[#f7f9f9]"
          >
            {timestamp ?? `x.com${xPostPath}`}
          </Link>
          {preview.viewCount !== undefined && preview.viewCount > 0 && (
            <>
              <span>·</span>
              <span className="tw-flex-shrink-0">
                {formatViews(preview.viewCount)}
              </span>
            </>
          )}
        </div>

        {!hideActions && (
          <TweetActions
            copied={copied}
            onCopy={copyLink}
            preview={preview}
            tweetId={tweetId}
          />
        )}
      </div>
    </Link>
  );
}
