"use client";

import {
  ChatBubbleOvalLeftIcon,
  HeartIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

import XIcon from "@/components/user/utils/icons/XIcon";
import type { TweetPreview } from "@/lib/twitter";
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
  "tw-w-full tw-min-w-0 tw-max-w-[430px] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-[#15202b] tw-text-[#f7f9f9] tw-shadow-sm";

const ACTION_CLASSES =
  "tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-sm tw-font-semibold tw-text-[#8b98a5] tw-no-underline tw-transition tw-duration-200 hover:tw-text-[#1d9bf0] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

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

function LoadingCard() {
  return (
    <div
      className={`${TWITTER_CARD_CLASSES} tw-p-4`}
      data-testid="twitter-post-skeleton"
    >
      <div className="tw-flex tw-animate-pulse tw-flex-col tw-gap-y-3">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <div className="tw-h-12 tw-w-12 tw-rounded-full tw-bg-[#263544]" />
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-[#263544]" />
            <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-[#263544]/80" />
          </div>
        </div>
        <div className="tw-space-y-2">
          <div className="tw-h-4 tw-w-full tw-rounded tw-bg-[#263544]" />
          <div className="tw-h-4 tw-w-4/5 tw-rounded tw-bg-[#263544]" />
        </div>
        <div className="tw-h-20 tw-rounded-xl tw-bg-[#263544]/80" />
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
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-[#42566b] tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-[#6ecbff] tw-no-underline tw-transition hover:tw-border-[#5a7088] hover:tw-text-[#9bddff]"
          >
            Open on X
          </Link>
          <button type="button" onClick={onCopy} className={ACTION_CLASSES}>
            <LinkIcon className="tw-h-5 tw-w-5" />
            <span>{copied ? "Copied" : "Copy link"}</span>
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
        className="tw-line-clamp-1 tw-text-sm tw-font-bold tw-leading-5 tw-text-[#f7f9f9] tw-no-underline hover:tw-underline"
      >
        {authorName}
      </Link>
      {authorHandle && (
        <div className="tw-line-clamp-1 tw-text-xs tw-leading-5 tw-text-[#8b98a5]">
          <span>@{authorHandle}</span>
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
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-3">
      <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-x-3">
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
  text,
}: {
  readonly authorName: string;
  readonly href: string;
  readonly text: string | undefined;
}) {
  if (text) {
    return (
      <p className="tw-m-0 tw-whitespace-pre-line tw-break-words tw-text-base tw-font-normal tw-leading-6 tw-text-[#f7f9f9]">
        {text}
      </p>
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

function TweetVideo({ preview }: { readonly preview: TweetPreview }) {
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-black">
      <video
        src={preview.mediaVideoUrl}
        poster={preview.mediaPosterUrl ?? preview.mediaImageUrl}
        className="tw-block tw-h-auto tw-max-h-[24rem] tw-w-full tw-object-contain"
        controls
        playsInline
        preload="metadata"
      >
        <track
          kind="captions"
          src={preview.mediaCaptionsUrl ?? "data:text/vtt,WEBVTT"}
          srcLang="en"
          label="Captions"
          default
        />
      </video>
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
  if (preview.mediaVideoUrl) {
    return <TweetVideo preview={preview} />;
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
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2">
      <Link
        href={`https://x.com/intent/like?tweet_id=${tweetId}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        className={`${ACTION_CLASSES} hover:tw-text-[#f91880]`}
      >
        <HeartIcon className="tw-h-5 tw-w-5" />
        <span>{preview.favoriteCount ?? "Like"}</span>
      </Link>
      <Link
        href={`https://x.com/intent/tweet?in_reply_to=${tweetId}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={stopCardEvent}
        className={ACTION_CLASSES}
      >
        <ChatBubbleOvalLeftIcon className="tw-h-5 tw-w-5" />
        <span>Reply</span>
      </Link>
      <button type="button" onClick={onCopy} className={ACTION_CLASSES}>
        <LinkIcon className="tw-h-5 tw-w-5" />
        <span>{copied ? "Copied" : "Copy link"}</span>
      </button>
    </div>
  );
}

function TweetRepliesLink({
  conversationCount,
  href,
}: {
  readonly conversationCount: number;
  readonly href: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={stopCardEvent}
      className="tw-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-[#42566b] tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-[#6ecbff] tw-no-underline tw-transition hover:tw-border-[#5a7088] hover:tw-text-[#9bddff]"
    >
      Read {conversationCount} {conversationCount === 1 ? "reply" : "replies"}
    </Link>
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
    <article
      className={TWITTER_CARD_CLASSES}
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
          text={preview.text}
        />

        <TweetMedia authorName={authorName} href={href} preview={preview} />

        <div className="tw-flex tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-[#42566b] tw-pb-3 tw-text-sm tw-text-[#8b98a5]">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-min-w-0 tw-truncate tw-text-[#8b98a5] tw-no-underline hover:tw-text-[#f7f9f9]"
          >
            {timestamp ?? `x.com${xPostPath}`}
          </Link>
        </div>

        {!hideActions && (
          <TweetActions
            copied={copied}
            onCopy={copyLink}
            preview={preview}
            tweetId={tweetId}
          />
        )}
        {!hideActions && preview.conversationCount !== undefined && (
          <TweetRepliesLink
            conversationCount={preview.conversationCount}
            href={href}
          />
        )}
      </div>
    </article>
  );
}
