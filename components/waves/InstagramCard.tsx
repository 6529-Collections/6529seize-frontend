"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import type { InstagramPreviewResponse } from "../../services/api/link-preview-api";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";

interface InstagramCardProps {
  readonly href: string;
  readonly preview: InstagramPreviewResponse;
}

const CAPTION_PREVIEW_LENGTH = 200;

const VIDEO_RESOURCES = new Set(["reel", "tv"]);

const sanitizeCaption = (caption?: string | null): string | null => {
  if (!caption) {
    return null;
  }

  const trimmed = caption.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

const buildCaptionPreview = (caption: string): {
  readonly preview: string;
  readonly needsToggle: boolean;
} => {
  if (caption.length <= CAPTION_PREVIEW_LENGTH) {
    return { preview: caption, needsToggle: false };
  }

  const truncated = caption.slice(0, CAPTION_PREVIEW_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeSlice =
    lastSpace > CAPTION_PREVIEW_LENGTH - 40
      ? truncated.slice(0, lastSpace)
      : truncated;

  return {
    preview: `${safeSlice.trimEnd()}…`,
    needsToggle: true,
  };
};

const formatTimestamp = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsed);
  } catch {
    return parsed.toISOString();
  }
};

const getUsernameDisplay = (username?: string | null): string | null => {
  if (!username) {
    return null;
  }

  const cleaned = username.trim();
  if (!cleaned) {
    return null;
  }

  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
};

const getAltText = (
  preview: InstagramPreviewResponse,
  displayHandle: string | null,
  authorName: string | null
): string => {
  if (preview.resource === "profile") {
    if (displayHandle) {
      return `Instagram profile ${displayHandle}`;
    }
    if (authorName) {
      return `Instagram profile ${authorName}`;
    }
    return "Instagram profile";
  }

  if (displayHandle || authorName) {
    return `Instagram post by ${displayHandle ?? authorName}`;
  }

  return "Instagram post";
};

const getActionText = (preview: InstagramPreviewResponse): {
  readonly text: string;
  readonly ariaLabel: string;
} => {
  const display = getUsernameDisplay(preview.username) ?? preview.authorName ?? "";

  if (preview.resource === "profile") {
    const aria = display
      ? `Open Instagram profile ${display}`
      : "Open Instagram profile";
    return { text: "Open profile", ariaLabel: aria };
  }

  const aria = display
    ? `Open this Instagram ${preview.resource} by ${display}`
    : "Open this Instagram post";
  return { text: "Open on Instagram", ariaLabel: aria };
};

const getVideoBadgeText = (preview: InstagramPreviewResponse): string => {
  if (preview.resource === "reel") {
    return "Reel";
  }
  if (preview.resource === "tv") {
    return "Video";
  }
  return "Video";
};

export default function InstagramCard({ href, preview }: InstagramCardProps) {
  const captionId = useId();
  const canonicalHref = preview.canonicalUrl || href;
  const displayHandle = getUsernameDisplay(preview.username);
  const sanitizedCaption = useMemo(
    () => sanitizeCaption(preview.caption),
    [preview.caption]
  );
  const { preview: collapsedCaption, needsToggle } = useMemo(() => {
    if (!sanitizedCaption) {
      return { preview: null, needsToggle: false };
    }

    return buildCaptionPreview(sanitizedCaption);
  }, [sanitizedCaption]);
  const [expanded, setExpanded] = useState(false);

  const captionToRender = useMemo(() => {
    if (!sanitizedCaption) {
      return null;
    }

    if (!needsToggle || expanded) {
      return sanitizedCaption;
    }

    return collapsedCaption;
  }, [collapsedCaption, expanded, needsToggle, sanitizedCaption]);

  const timestamp = useMemo(
    () => formatTimestamp(preview.uploadDate),
    [preview.uploadDate]
  );

  const authorName = preview.authorName ? preview.authorName.trim() || null : null;
  const actionMeta = getActionText(preview);

  if (preview.status !== "available") {
    const message =
      preview.status === "protected"
        ? "This content requires Instagram and may not be embeddable."
        : "This Instagram content is unavailable.";

    return (
      <LinkPreviewCardLayout href={canonicalHref}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6"
          data-testid="instagram-card-unavailable"
        >
          <div className="tw-flex tw-flex-col tw-gap-y-4">
            <p className="tw-m-0 tw-text-sm tw-text-iron-200">{message}</p>
            <Link
              href={canonicalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-inline-flex tw-w-fit tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500/20 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-200 tw-transition tw-duration-200 hover:tw-bg-primary-500/30 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              aria-label={actionMeta.ariaLabel}
            >
              {actionMeta.text}
            </Link>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  const isProfile = preview.resource === "profile";
  const isVideo = VIDEO_RESOURCES.has(preview.resource);
  const [imageError, setImageError] = useState(false);
  const hasImage = Boolean(preview.thumbnailUrl) && !imageError;
  const imageRatio = preview.thumbnailWidth && preview.thumbnailHeight
    ? Math.max(preview.thumbnailHeight / preview.thumbnailWidth, 0.1)
    : 1;
  const imageAlt = getAltText(preview, displayHandle, authorName);

  if (isProfile) {
    return (
      <LinkPreviewCardLayout href={canonicalHref}>
        <div
          className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-6"
          data-testid="instagram-card-profile"
        >
          <div className="tw-flex tw-flex-col tw-gap-y-4">
            <div className="tw-flex tw-flex-col tw-gap-y-1">
              {displayHandle && (
                <span className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {displayHandle}
                </span>
              )}
              {authorName && (
                <span className="tw-text-sm tw-text-iron-300">{authorName}</span>
              )}
            </div>
            <Link
              href={canonicalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-inline-flex tw-w-fit tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500/20 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-200 tw-transition tw-duration-200 hover:tw-bg-primary-500/30 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              aria-label={actionMeta.ariaLabel}
            >
              {actionMeta.text}
            </Link>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout href={canonicalHref}>
      <article
        className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40"
        data-testid="instagram-card"
      >
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-gap-x-6">
          <div className="md:tw-w-60 md:tw-flex-shrink-0">
            <div
              className="tw-relative tw-overflow-hidden tw-bg-iron-900/60"
              style={{ paddingBottom: `${Math.min(imageRatio, 1.5) * 100}%` }}
            >
              {hasImage ? (
                <Image
                  src={preview.thumbnailUrl as string}
                  alt={imageAlt}
                  fill
                  className="tw-h-full tw-w-full tw-object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 240px"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-900/60 tw-text-sm tw-text-iron-400">
                  Preview not available
                </div>
              )}
              {isVideo && (
                <span className="tw-absolute tw-left-3 tw-top-3 tw-rounded-full tw-bg-iron-900/80 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-100">
                  {getVideoBadgeText(preview)}
                </span>
              )}
            </div>
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-3 tw-p-4 md:tw-p-6 md:tw-pl-0">
            <div className="tw-flex tw-flex-col tw-gap-y-1">
              {displayHandle && (
                <span className="tw-text-base tw-font-semibold tw-text-iron-100">
                  {displayHandle}
                </span>
              )}
              {authorName && (
                <span className="tw-text-sm tw-text-iron-300">{authorName}</span>
              )}
              {timestamp && (
                <span className="tw-text-xs tw-text-iron-400">{timestamp}</span>
              )}
            </div>
            {captionToRender && (
              <div className="tw-flex tw-flex-col tw-gap-y-2">
                <p
                  id={captionId}
                  className="tw-m-0 tw-text-sm tw-text-iron-100 tw-whitespace-pre-line tw-break-words"
                >
                  {captionToRender}
                </p>
                {needsToggle && (
                  <button
                    type="button"
                    className="tw-self-start tw-rounded tw-border tw-border-iron-600 tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200 tw-transition tw-duration-200 hover:tw-border-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    onClick={() => setExpanded((value) => !value)}
                    aria-expanded={expanded}
                    aria-controls={captionId}
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
            <div>
              <Link
                href={canonicalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-inline-flex tw-w-fit tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500/20 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-200 tw-transition tw-duration-200 hover:tw-bg-primary-500/30 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                aria-label={actionMeta.ariaLabel}
              >
                {actionMeta.text}
              </Link>
            </div>
          </div>
        </div>
      </article>
    </LinkPreviewCardLayout>
  );
}
