"use client";

import {
  ChatBubbleOvalLeftIcon,
  HeartIcon,
  InformationCircleIcon,
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
  "tw-w-full tw-min-w-0 tw-max-w-[480px] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-[#15202b] tw-text-[#f7f9f9] tw-shadow-sm";

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
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
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
      <div className="tw-flex tw-animate-pulse tw-flex-col tw-gap-y-4">
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
        <div className="tw-h-24 tw-rounded-xl tw-bg-[#263544]/80" />
      </div>
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
    (state.type === "ready" ? "Twitter/X post" : " ");
  const authorHref =
    preview.authorUrl ??
    (preview.authorHandle ? `https://x.com/${preview.authorHandle}` : href);
  const xPostPath = useMemo(
    () => getXPostPath(preview.url || href),
    [href, preview.url]
  );
  const timestamp = useMemo(() => formatTweetTimestamp(preview), [preview]);

  if (state.type === "loading") {
    return <LoadingCard />;
  }

  return (
    <article
      className={TWITTER_CARD_CLASSES}
      data-testid={
        state.fallback ? "twitter-post-fallback" : "twitter-post-preview"
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-y-4 tw-p-4">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-3">
          <Link
            href={authorHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-flex tw-min-w-0 tw-items-start tw-gap-x-3 tw-text-inherit tw-no-underline"
          >
            {preview.authorProfileImageUrl ? (
              <img
                src={preview.authorProfileImageUrl}
                alt={authorName}
                className="tw-h-12 tw-w-12 tw-flex-shrink-0 tw-rounded-full tw-object-cover"
                loading="lazy"
              />
            ) : (
              <div className="tw-flex tw-h-12 tw-w-12 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#0f1720] tw-p-2">
                <XIcon />
              </div>
            )}
            <div className="tw-min-w-0">
              <div className="tw-line-clamp-1 tw-text-base tw-font-bold tw-italic tw-leading-6 tw-text-[#f7f9f9]">
                {authorName}
              </div>
              {preview.authorHandle && (
                <div className="tw-line-clamp-1 tw-text-sm tw-leading-5 tw-text-[#8b98a5]">
                  @{preview.authorHandle}
                </div>
              )}
            </div>
          </Link>
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

        {preview.text ? (
          <p className="tw-m-0 tw-whitespace-pre-line tw-break-words tw-text-xl tw-font-normal tw-leading-7 tw-text-[#f7f9f9]">
            {preview.text}
          </p>
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <p className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-[#f7f9f9]">
              Twitter/X post preview unavailable
            </p>
            <p className="tw-m-0 tw-break-all tw-text-sm tw-leading-5 tw-text-[#8b98a5]">
              {href}
            </p>
          </div>
        )}

        {preview.mediaImageUrl ? (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-block tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-black tw-no-underline"
          >
            <img
              src={preview.mediaImageUrl}
              alt={preview.text ?? authorName}
              className="tw-h-auto tw-max-h-[32rem] tw-w-full tw-object-contain"
              loading="lazy"
            />
          </Link>
        ) : preview.mediaLink ? (
          <Link
            href={preview.mediaLink}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-flex tw-min-h-24 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-[#42566b] tw-bg-[#0f1720] tw-p-4 tw-text-center tw-text-sm tw-font-semibold tw-text-[#8b98a5] tw-no-underline tw-transition hover:tw-border-[#5a7088] hover:tw-text-[#f7f9f9]"
          >
            Media on X
          </Link>
        ) : null}

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-border-0 tw-border-b tw-border-solid tw-border-[#42566b] tw-pb-3 tw-text-sm tw-text-[#8b98a5]">
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-min-w-0 tw-truncate tw-text-[#8b98a5] tw-no-underline hover:tw-text-[#f7f9f9]"
          >
            {timestamp ?? `x.com${xPostPath}`}
          </Link>
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            aria-label="View post information on X"
            className="tw-flex-shrink-0 tw-text-[#8b98a5] tw-no-underline hover:tw-text-[#f7f9f9]"
          >
            <InformationCircleIcon className="tw-h-5 tw-w-5" />
          </Link>
        </div>

        {!hideActions && (
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
            <button type="button" onClick={copyLink} className={ACTION_CLASSES}>
              <LinkIcon className="tw-h-5 tw-w-5" />
              <span>{copied ? "Copied" : "Copy link"}</span>
            </button>
          </div>
        )}
        {!hideActions && preview.conversationCount !== undefined && (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stopCardEvent}
            className="tw-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-[#42566b] tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-[#6ecbff] tw-no-underline tw-transition hover:tw-border-[#5a7088] hover:tw-text-[#9bddff]"
          >
            Read {preview.conversationCount}{" "}
            {preview.conversationCount === 1 ? "reply" : "replies"}
          </Link>
        )}
      </div>
    </article>
  );
}
