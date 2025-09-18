"use client";

import { useMemo, type ReactElement } from "react";

import type {
  WeiboCardResponse,
  WeiboPostResponse,
  WeiboProfileResponse,
  WeiboTopicResponse,
  WeiboUnavailableResponse,
  WeiboVerificationBadge,
} from "@/types/weibo";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";

interface WeiboCardProps {
  readonly href: string;
  readonly data: WeiboCardResponse;
  readonly renderFallback: () => ReactElement;
}

const badgeLabels: Record<WeiboVerificationBadge, string> = {
  blue: "Verified account",
  yellow: "Verified creator",
  enterprise: "Verified enterprise",
  none: "Unverified account",
};

function renderVerificationBadge(badge: WeiboVerificationBadge) {
  if (badge === "none") {
    return null;
  }

  const label = badgeLabels[badge];

  return (
    <span className="tw-rounded-full tw-border tw-border-solid tw-border-primary-500/60 tw-bg-primary-500/10 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-primary-200">
      {label}
    </span>
  );
}

function formatTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function clampText(text: string, limit = 220): string {
  if (!text) {
    return text;
  }

  const safeLimit = Math.max(limit, 1);

  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const segments = Array.from(segmenter.segment(text));
    if (segments.length <= safeLimit) {
      return text;
    }
    return (
      segments
        .slice(0, safeLimit)
        .map((segment) => segment.segment)
        .join("") + "…"
    );
  }

  const characters = Array.from(text);
  if (characters.length <= safeLimit) {
    return text;
  }

  return characters.slice(0, safeLimit).join("") + "…";
}

function MediaGrid({
  href,
  images,
}: {
  readonly href: string;
  readonly images: NonNullable<WeiboPostResponse["post"]["images"]>;
}) {
  if (images.length === 0) {
    return null;
  }

  const gridClass =
    images.length === 1
      ? "tw-grid tw-gap-2"
      : "tw-grid tw-gap-2 tw-grid-cols-2";

  return (
    <div className={gridClass}>
      {images.map((image, index) => {
        const spanClass = images.length === 3 && index === 0 ? "tw-col-span-2" : "";
        return (
          <a
            key={`${image.url}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-iron-800/60 ${spanClass}`.trim()}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="tw-h-full tw-w-full tw-object-cover"
              loading="lazy"
            />
          </a>
        );
      })}
    </div>
  );
}

function VideoPreview({ href, thumbnail }: { href: string; thumbnail: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-relative tw-block tw-overflow-hidden tw-rounded-lg tw-bg-black"
    >
      <img
        src={thumbnail}
        alt="Weibo video preview"
        className="tw-h-full tw-w-full tw-object-cover"
        loading="lazy"
      />
      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/40">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="tw-h-10 tw-w-10 tw-text-white"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </a>
  );
}

function WeiboPostCard({
  href,
  data,
}: {
  readonly href: string;
  readonly data: WeiboPostResponse;
}) {
  const canonicalHref = data.canonicalUrl ?? href;
  const text = useMemo(() => clampText(data.post.text ?? ""), [data.post.text]);
  const timestamp = formatTimestamp(data.post.createdAt);
  const hasImages = Array.isArray(data.post.images) && data.post.images.length > 0;
  const videoThumbnail = data.post.video?.thumbnail ?? null;

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-h-full tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <header className="tw-flex tw-items-start tw-gap-3">
          {data.post.author.avatar ? (
            <img
              src={data.post.author.avatar}
              alt={data.post.author.displayName ?? "Weibo author avatar"}
              className="tw-h-12 tw-w-12 tw-rounded-full tw-object-cover"
            />
          ) : (
            <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-semibold tw-text-iron-300">
              WB
            </div>
          )}
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-1">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <span className="tw-text-base tw-font-semibold tw-text-iron-100">
                {data.post.author.displayName ?? "Weibo"}
              </span>
              {renderVerificationBadge(data.post.author.verified)}
            </div>
            {timestamp && (
              <time className="tw-text-xs tw-text-iron-400" dateTime={data.post.createdAt ?? undefined}>
                {timestamp}
              </time>
            )}
          </div>
        </header>
        {text && (
          <p className="tw-text-sm tw-text-iron-100 tw-whitespace-pre-wrap tw-break-words tw-m-0">
            {text}
          </p>
        )}
        {videoThumbnail ? (
          <VideoPreview href={canonicalHref} thumbnail={videoThumbnail} />
        ) : hasImages ? (
          <MediaGrid href={canonicalHref} images={data.post.images!} />
        ) : null}
        <footer className="tw-flex tw-justify-end">
          <a
            href={canonicalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary-200 tw-transition-colors hover:tw-bg-primary-500/20"
            aria-label="Open post on Weibo"
          >
            Open on Weibo
          </a>
        </footer>
      </div>
    </LinkPreviewCardLayout>
  );
}

function WeiboProfileCard({
  href,
  data,
}: {
  readonly href: string;
  readonly data: WeiboProfileResponse;
}) {
  const canonicalHref = data.canonicalUrl ?? href;
  const displayName = data.profile.displayName ?? "Weibo Profile";
  const bio = useMemo(() => (data.profile.bio ? clampText(data.profile.bio, 260) : null), [
    data.profile.bio,
  ]);

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-h-full tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        {data.profile.banner && (
          <a
            href={canonicalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-block tw-overflow-hidden tw-rounded-lg tw-bg-iron-800/60"
          >
            <img
              src={data.profile.banner}
              alt={`${displayName} banner`}
              className="tw-h-32 tw-w-full tw-object-cover"
              loading="lazy"
            />
          </a>
        )}
        <div className="tw-flex tw-items-start tw-gap-3">
          {data.profile.avatar ? (
            <img
              src={data.profile.avatar}
              alt={`${displayName} avatar`}
              className="tw-h-16 tw-w-16 tw-rounded-full tw-object-cover"
            />
          ) : (
            <div className="tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-base tw-font-semibold tw-text-iron-300">
              WB
            </div>
          )}
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <span className="tw-text-lg tw-font-semibold tw-text-iron-100">{displayName}</span>
              {renderVerificationBadge(data.profile.verified)}
            </div>
            {bio && <p className="tw-text-sm tw-text-iron-200 tw-m-0 tw-whitespace-pre-wrap tw-break-words">{bio}</p>}
          </div>
        </div>
        <footer className="tw-flex tw-justify-end">
          <a
            href={canonicalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary-200 tw-transition-colors hover:tw-bg-primary-500/20"
            aria-label="Open profile on Weibo"
          >
            Open profile on Weibo
          </a>
        </footer>
      </div>
    </LinkPreviewCardLayout>
  );
}

function WeiboTopicCard({
  href,
  data,
}: {
  readonly href: string;
  readonly data: WeiboTopicResponse;
}) {
  const canonicalHref = data.canonicalUrl ?? href;
  const title = data.topic.title ?? data.topic.description ?? "Weibo Topic";
  const description = data.topic.description ? clampText(data.topic.description, 260) : null;

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-h-full tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        {data.topic.cover && (
          <a
            href={canonicalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-block tw-overflow-hidden tw-rounded-lg tw-bg-iron-800/60"
          >
            <img
              src={data.topic.cover}
              alt={`${title} cover`}
              className="tw-h-40 tw-w-full tw-object-cover"
              loading="lazy"
            />
          </a>
        )}
        <div className="tw-space-y-2">
          <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-m-0">{title}</h3>
          {description && (
            <p className="tw-text-sm tw-text-iron-200 tw-m-0 tw-whitespace-pre-wrap tw-break-words">{description}</p>
          )}
        </div>
        <footer className="tw-flex tw-justify-end">
          <a
            href={canonicalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary-200 tw-transition-colors hover:tw-bg-primary-500/20"
            aria-label="Open topic on Weibo"
          >
            Open topic on Weibo
          </a>
        </footer>
      </div>
    </LinkPreviewCardLayout>
  );
}

function WeiboUnavailableCard({
  href,
  data,
  renderFallback,
}: {
  readonly href: string;
  readonly data: WeiboUnavailableResponse;
  readonly renderFallback: () => ReactElement;
}) {
  if (data.reason === "error") {
    return <LinkPreviewCardLayout href={href}>{renderFallback()}</LinkPreviewCardLayout>;
  }

  const messageMap: Record<WeiboUnavailableResponse["reason"], string> = {
    login_required: "Login required to view this Weibo content",
    removed: "This Weibo content is no longer available",
    rate_limited: "Temporarily rate limited",
    error: "Content unavailable",
  };

  const message = messageMap[data.reason] ?? "Content unavailable";
  const canonicalHref = data.canonicalUrl ?? href;

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6" data-testid="weibo-unavailable-card">
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200 tw-text-center">{message}</p>
        <a
          href={canonicalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary-200 tw-transition-colors hover:tw-bg-primary-500/20"
          aria-label="Open on Weibo"
        >
          Try opening on Weibo
        </a>
      </div>
    </LinkPreviewCardLayout>
  );
}

export default function WeiboCard({ href, data, renderFallback }: WeiboCardProps) {
  switch (data.type) {
    case "weibo.post":
      return <WeiboPostCard href={href} data={data} />;
    case "weibo.profile":
      return <WeiboProfileCard href={href} data={data} />;
    case "weibo.topic":
      return <WeiboTopicCard href={href} data={data} />;
    case "weibo.unavailable":
      return <WeiboUnavailableCard href={href} data={data} renderFallback={renderFallback} />;
    default:
      return <LinkPreviewCardLayout href={href}>{renderFallback()}</LinkPreviewCardLayout>;
  }
}
