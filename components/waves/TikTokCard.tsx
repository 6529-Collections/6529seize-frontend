"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchTikTokPreview,
  getCachedTikTokPreview,
  type TikTokPreviewResult,
  type TikTokPreviewSuccess,
  type TikTokPreviewUnavailable,
} from "../../services/api/tiktok-preview";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";

interface TikTokCardProps {
  readonly href: string;
}

type TikTokCardState =
  | { status: "loading" }
  | { status: "success"; data: TikTokPreviewSuccess }
  | { status: "unavailable"; canonicalUrl?: string };

const CAPTION_PREVIEW_LIMIT = 180;

function isUnavailable(preview: TikTokPreviewResult): preview is TikTokPreviewUnavailable {
  return (preview as { error?: string }).error === "unavailable";
}

function extractUsername(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const first = parsed.pathname.split("/").find((segment) => segment.length > 0);
    if (first?.startsWith("@")) {
      return first;
    }
  } catch {
    // ignore parsing errors
  }

  return null;
}

function buildAltText(data: TikTokPreviewSuccess, username: string | null): string {
  if (data.kind === "profile") {
    if (username) {
      return `TikTok profile ${username}`;
    }
    if (data.authorName) {
      return `TikTok profile ${data.authorName}`;
    }
    return "TikTok profile";
  }

  if (data.authorName) {
    return `TikTok video by ${data.authorName}`;
  }
  if (username) {
    return `TikTok video by ${username}`;
  }
  return "TikTok video";
}

function buildAuthorLink(
  data: TikTokPreviewSuccess,
  username: string | null
): string | undefined {
  if (data.authorUrl) {
    return data.authorUrl;
  }

  if (username) {
    return `https://www.tiktok.com/${username}`;
  }

  return undefined;
}

export default function TikTokCard({ href }: TikTokCardProps) {
  const [state, setState] = useState<TikTokCardState>({ status: "loading" });
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    let active = true;

    setIsCaptionExpanded(false);
    setThumbnailError(false);

    const cached = getCachedTikTokPreview(href);
    if (cached) {
      if (isUnavailable(cached.data)) {
        setState({
          status: "unavailable",
          canonicalUrl: cached.data.canonicalUrl ?? href,
        });
      } else {
        setState({ status: "success", data: cached.data });
      }

      if (cached.isFresh) {
        return () => {
          active = false;
        };
      }
    } else {
      setState({ status: "loading" });
    }

    fetchTikTokPreview(href)
      .then((result) => {
        if (!active) {
          return;
        }

        if (isUnavailable(result)) {
          setState({
            status: "unavailable",
            canonicalUrl: result.canonicalUrl ?? href,
          });
          return;
        }

        setState({ status: "success", data: result });
      })
      .catch(() => {
        if (active) {
          setState({ status: "unavailable", canonicalUrl: href });
        }
      });

    return () => {
      active = false;
    };
  }, [href]);

  if (state.status === "loading") {
    return (
      <LinkPreviewCardLayout href={href}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
          data-testid="tiktok-card-skeleton">
          <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
            <div className="tw-w-full md:tw-w-44 md:tw-flex-shrink-0">
              <div className="tw-aspect-[9/16] tw-w-full tw-rounded-lg tw-bg-iron-800/60 tw-animate-pulse" />
            </div>
            <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-3">
              <div className="tw-h-3 tw-w-16 tw-rounded tw-bg-iron-800/50 tw-animate-pulse" />
              <div className="tw-h-5 tw-w-40 tw-rounded tw-bg-iron-800/40 tw-animate-pulse" />
              <div className="tw-space-y-2">
                <div className="tw-h-4 tw-w-full tw-rounded tw-bg-iron-800/30 tw-animate-pulse" />
                <div className="tw-h-4 tw-w-3/4 tw-rounded tw-bg-iron-800/20 tw-animate-pulse" />
                <div className="tw-h-4 tw-w-2/3 tw-rounded tw-bg-iron-800/10 tw-animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  const canonicalUrl =
    state.status === "success" ? state.data.canonicalUrl : state.canonicalUrl ?? href;

  if (state.status === "unavailable") {
    return (
      <LinkPreviewCardLayout href={canonicalUrl}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
          data-testid="tiktok-card-unavailable">
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-3 tw-text-center">
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
              This TikTok is unavailable or private.
            </p>
            <Link
              href={canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-primary-500 tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition tw-duration-200 hover:tw-bg-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              aria-label="Open this TikTok on TikTok">
              Open on TikTok
            </Link>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  const data = state.data;
  const username =
    extractUsername(data.authorUrl) ?? extractUsername(data.canonicalUrl) ?? null;
  const provider = data.providerName ?? "TikTok";
  const authorLink = buildAuthorLink(data, username);
  const primaryAuthor = username ?? data.authorName ?? null;
  const secondaryAuthor =
    username && data.authorName &&
    username.toLowerCase() !== data.authorName.toLowerCase()
      ? data.authorName
      : null;

  const caption = data.title ?? "";
  const isLongCaption = caption.length > CAPTION_PREVIEW_LIMIT;
  const visibleCaption = isCaptionExpanded || !isLongCaption
    ? caption
    : `${caption.slice(0, CAPTION_PREVIEW_LIMIT).trimEnd()}…`;

  const aspectRatio =
    data.thumbnailWidth && data.thumbnailHeight
      ? `${data.thumbnailWidth} / ${data.thumbnailHeight}`
      : "9 / 16";

  const thumbnailAlt = buildAltText(data, username);
  const openHref = canonicalUrl ?? href;

  return (
    <LinkPreviewCardLayout href={openHref}>
      <article
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
        data-testid="tiktok-card">
        <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row">
          <div className="tw-w-full md:tw-w-44 md:tw-flex-shrink-0">
            <div
              className="tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60"
              style={{ aspectRatio }}>
              {data.thumbnailUrl && !thumbnailError ? (
                <img
                  src={data.thumbnailUrl}
                  alt={thumbnailAlt}
                  loading="lazy"
                  decoding="async"
                  className="tw-h-full tw-w-full tw-object-cover"
                  onError={() => setThumbnailError(true)}
                />
              ) : (
                <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-bg-iron-900/70">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="tw-h-10 tw-w-10 tw-text-iron-400"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 5.25a2.25 2.25 0 0 1 2.25-2.25h6l6 6v9.75a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.25 3v4.5h4.5"
                    />
                  </svg>
                </div>
              )}
              {data.kind === "video" && (
                <div className="tw-absolute tw-bottom-2 tw-left-2 tw-flex tw-items-center tw-gap-x-2 tw-rounded-full tw-bg-black/70 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="tw-h-3.5 tw-w-3.5"
                    aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Video</span>
                </div>
              )}
            </div>
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-3">
            <div className="tw-flex tw-flex-col tw-gap-y-1">
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                {provider}
              </span>
              {primaryAuthor && (
                <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
                  <Link
                    href={authorLink ?? openHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-text-base tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white">
                    {primaryAuthor}
                  </Link>
                  {secondaryAuthor && (
                    <span className="tw-text-sm tw-text-iron-300">{secondaryAuthor}</span>
                  )}
                </div>
              )}
            </div>
            {caption && (
              <div className="tw-space-y-2">
                <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-wrap">
                  {visibleCaption}
                </p>
                {isLongCaption && (
                  <button
                    type="button"
                    className="tw-text-xs tw-font-semibold tw-text-primary-400 tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer hover:tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    onClick={() => setIsCaptionExpanded((prev) => !prev)}
                    aria-expanded={isCaptionExpanded}>
                    {isCaptionExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
            <div>
              <Link
                href={openHref}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-primary-500 tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition tw-duration-200 hover:tw-bg-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                aria-label="Open this TikTok on TikTok">
                Open on TikTok
              </Link>
            </div>
          </div>
        </div>
      </article>
    </LinkPreviewCardLayout>
  );
}
