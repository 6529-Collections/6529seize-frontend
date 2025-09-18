"use client";

import { type KeyboardEvent, useCallback } from "react";

import clsx from "clsx";
import Link from "next/link";

import type {
  TruthSocialPostData,
  TruthSocialProfileData,
} from "@/services/api/link-preview-api";

import { LinkPreviewCardLayout } from "../OpenGraphPreview";

export type TruthSocialCardData =
  | {
      readonly kind: "post";
      readonly canonicalUrl: string;
      readonly post: TruthSocialPostData;
    }
  | {
      readonly kind: "profile";
      readonly canonicalUrl: string;
      readonly profile: TruthSocialProfileData;
    };

interface TruthSocialCardProps {
  readonly href: string;
  readonly data: TruthSocialCardData;
}

const unavailableMessage = "Unavailable on Truth Social";

function formatTimestamp(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function buildAvatarFallback(handle: string | undefined): string {
  if (!handle) {
    return "?";
  }

  const first = handle.trim().charAt(0).toUpperCase();
  return first || "?";
}

function TruthSocialAvatar({
  src,
  alt,
  fallback,
}: {
  readonly src: string | null | undefined;
  readonly alt: string;
  readonly fallback: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="tw-h-10 tw-w-10 tw-rounded-full tw-border tw-border-iron-700 tw-object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-800 tw-text-sm tw-font-semibold tw-text-iron-300">
      {fallback}
    </div>
  );
}

function TruthSocialImageGrid({
  images,
  canonicalUrl,
  handle,
}: {
  readonly images: ReadonlyArray<{ readonly url: string; readonly alt?: string | null }>;
  readonly canonicalUrl: string;
  readonly handle: string;
}) {
  if (!images || images.length === 0) {
    return null;
  }

  const gridClass = clsx(
    "tw-grid tw-gap-2",
    images.length === 1
      ? "tw-grid-cols-1"
      : images.length === 3
      ? "tw-grid-cols-2 tw-grid-rows-2"
      : "tw-grid-cols-2"
  );

  return (
    <div className={gridClass}>
      {images.map((image, index) => {
        const alt = image.alt?.trim() || `Image from @${handle}'s post`;
        return (
          <a
            key={`${image.url}-${index}`}
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-group tw-relative tw-block tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60"
          >
            <img
              src={image.url}
              alt={alt}
              className="tw-h-full tw-w-full tw-object-cover tw-transition tw-duration-200 group-hover:tw-scale-[1.02]"
              loading="lazy"
            />
          </a>
        );
      })}
    </div>
  );
}

function TruthSocialPostContent({
  data,
  canonicalUrl,
}: {
  readonly data: TruthSocialPostData;
  readonly canonicalUrl: string;
}) {
  const timestamp = formatTimestamp(data.createdAt);
  const displayHandle = `@${data.handle}`;
  const displayName = data.author.displayName?.trim() || displayHandle;
  const unavailable = data.unavailable === true;
  const postText = unavailable ? unavailableMessage : data.text;
  const images = Array.isArray(data.images) ? data.images : [];

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-gap-3">
        <TruthSocialAvatar
          src={data.author.avatar ?? null}
          alt={`${displayHandle}'s avatar`}
          fallback={buildAvatarFallback(data.author.displayName ?? data.handle)}
        />
        <div className="tw-flex tw-flex-1 tw-flex-col">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
            <span className="tw-text-base tw-font-semibold tw-text-iron-100">{displayName}</span>
            <span className="tw-text-sm tw-text-iron-400">{displayHandle}</span>
          </div>
          {timestamp && (
            <span className="tw-text-xs tw-text-iron-400">{timestamp}</span>
          )}
        </div>
      </div>
      {postText ? (
        <p className="tw-m-0 tw-whitespace-pre-wrap tw-text-sm tw-text-iron-200">
          {postText}
        </p>
      ) : null}
      <TruthSocialImageGrid images={images} canonicalUrl={canonicalUrl} handle={data.handle} />
    </div>
  );
}

function TruthSocialProfileContent({
  data,
  canonicalUrl,
}: {
  readonly data: TruthSocialProfileData;
  readonly canonicalUrl: string;
}) {
  const displayHandle = `@${data.handle}`;
  const displayName = data.displayName?.trim() || displayHandle;
  const unavailable = data.unavailable === true;
  const bio = unavailable ? unavailableMessage : data.bio;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {data.banner && (
        <Link
          href={canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-block tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60"
        >
          <img
            src={data.banner}
            alt={`Profile banner for ${displayHandle}`}
            className="tw-h-32 tw-w-full tw-object-cover"
            loading="lazy"
          />
        </Link>
      )}
      <div className="tw-flex tw-items-start tw-gap-3">
        <TruthSocialAvatar
          src={data.avatar ?? null}
          alt={`${displayHandle}'s avatar`}
          fallback={buildAvatarFallback(data.displayName ?? data.handle)}
        />
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-lg tw-font-semibold tw-text-iron-100">{displayName}</span>
          <span className="tw-text-sm tw-text-iron-400">{displayHandle}</span>
        </div>
      </div>
      {bio ? (
        <p className="tw-m-0 tw-whitespace-pre-wrap tw-text-sm tw-text-iron-200">{bio}</p>
      ) : null}
    </div>
  );
}

function useCardKeyHandler(url: string) {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        try {
          window.open(url, "_blank", "noopener,noreferrer");
        } catch {
          // ignore window open issues silently
        }
      }
    },
    [url]
  );
}

export default function TruthSocialCard({ href, data }: TruthSocialCardProps) {
  const canonicalUrl = data.canonicalUrl || href;
  const keyHandler = useCardKeyHandler(canonicalUrl);
  const actionLabel = data.kind === "profile" ? "Open profile on Truth Social" : "Open on Truth Social";

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
        role="group"
        tabIndex={0}
        onKeyDown={keyHandler}
        data-testid="truth-social-card"
      >
        {data.kind === "post" ? (
          <TruthSocialPostContent data={data.post} canonicalUrl={canonicalUrl} />
        ) : (
          <TruthSocialProfileContent data={data.profile} canonicalUrl={canonicalUrl} />
        )}
        <div className="tw-flex tw-justify-end">
          <Link
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500/20 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-200 tw-transition tw-duration-200 hover:tw-bg-primary-500/30 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 focus:tw-ring-offset-2 focus:tw-ring-offset-iron-900"
            aria-label={actionLabel}
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
