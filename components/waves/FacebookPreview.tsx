"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import type {
  FacebookLinkPreviewResponse,
  FacebookPostPreviewData,
  FacebookPreviewType,
} from "@/services/api/link-preview-api";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";

interface FacebookPreviewProps {
  readonly href: string;
  readonly preview: FacebookLinkPreviewResponse;
}

const CTA_LABEL: Record<Exclude<FacebookPreviewType, "facebook.unavailable">, string> = {
  "facebook.post": "Open on Facebook",
  "facebook.video": "Open on Facebook",
  "facebook.photo": "Open on Facebook",
  "facebook.page": "Open page",
};

const CTA_ARIA_LABEL: Record<Exclude<FacebookPreviewType, "facebook.unavailable">, string> = {
  "facebook.post": "Open this Facebook post",
  "facebook.video": "Open this Facebook video",
  "facebook.photo": "Open this Facebook photo",
  "facebook.page": "Open this Facebook page",
};

const UNAVAILABLE_COPY = {
  login_required: "You must log in to Facebook to view this content.",
  removed: "This Facebook content is no longer available.",
  rate_limited: "Facebook preview is temporarily unavailable. Please try again later.",
  error: "Facebook preview could not be loaded.",
} as const satisfies Record<string, string>;

const formatTimestamp = (value: string | null): string | null => {
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
    return null;
  }
};

const FacebookActionButton = ({
  href,
  label,
  ariaLabel,
}: {
  readonly href: string;
  readonly label: string;
  readonly ariaLabel: string;
}) => {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800/70 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-iron-400 hover:tw-text-white"
    >
      {label}
    </Link>
  );
};

const FacebookImagesGrid = ({
  images,
}: {
  readonly images: readonly { url: string; alt: string }[] | undefined;
}) => {
  if (!images || images.length === 0) {
    return null;
  }

  const columnClass = images.length > 1 ? "tw-grid-cols-2" : "tw-grid-cols-1";

  return (
    <div className={clsx("tw-grid tw-gap-2", columnClass)}>
      {images.map((image) => (
        <div
          key={image.url}
          className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/60"
        >
          <Image
            src={image.url}
            alt={image.alt}
            width={800}
            height={800}
            className="tw-h-full tw-w-full tw-object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 240px"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
};

const FacebookCardContainer = ({
  href,
  canonicalUrl,
  type,
  children,
}: {
  readonly href: string;
  readonly canonicalUrl: string | null | undefined;
  readonly type: Exclude<FacebookPreviewType, "facebook.unavailable">;
  readonly children: ReactNode;
}) => {
  const targetUrl = canonicalUrl ?? href;
  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        {children}
        <div className="tw-flex tw-justify-end">
          <FacebookActionButton
            href={targetUrl}
            label={CTA_LABEL[type]}
            ariaLabel={CTA_ARIA_LABEL[type]}
          />
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
};

const renderPost = (
  href: string,
  canonicalUrl: string | null | undefined,
  post: FacebookPostPreviewData | undefined
): ReactElement | null => {
  if (!post) {
    return null;
  }

  const timestamp = formatTimestamp(post.createdAt);
  const author = post.authorName ?? post.page ?? "Facebook";

  return (
    <FacebookCardContainer href={href} canonicalUrl={canonicalUrl} type="facebook.post">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">{author}</span>
          {timestamp && (
            <span className="tw-text-xs tw-text-iron-400">{timestamp}</span>
          )}
        </div>
        {post.text && (
          <p className="tw-m-0 tw-whitespace-pre-line tw-text-sm tw-text-iron-200 tw-leading-relaxed">
            {post.text}
          </p>
        )}
        <FacebookImagesGrid images={post.images} />
      </div>
    </FacebookCardContainer>
  );
};

const renderVideo = (
  href: string,
  canonicalUrl: string | null | undefined,
  video: FacebookLinkPreviewResponse & { readonly type: "facebook.video" }
): ReactElement | null => {
  if (!video.video) {
    return null;
  }

  const targetVideo = video.video;
  const author = targetVideo.authorName ?? "Facebook";

  return (
    <FacebookCardContainer href={href} canonicalUrl={canonicalUrl} type="facebook.video">
      <div className="tw-flex tw-flex-col tw-gap-3">
        {targetVideo.thumbnail && (
          <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/60">
            <Image
              src={targetVideo.thumbnail}
              alt="Image from Facebook video"
              width={1200}
              height={675}
              className="tw-h-full tw-w-full tw-object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 320px"
              unoptimized
            />
            <span
              aria-hidden="true"
              className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center"
            >
              <span className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-black/50 tw-text-2xl tw-text-white">
                ▶
              </span>
            </span>
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-gap-1">
          {targetVideo.title && (
            <span className="tw-text-base tw-font-semibold tw-text-iron-100">
              {targetVideo.title}
            </span>
          )}
          <span className="tw-text-sm tw-text-iron-300">{author}</span>
        </div>
      </div>
    </FacebookCardContainer>
  );
};

const renderPhoto = (
  href: string,
  canonicalUrl: string | null | undefined,
  photo: FacebookLinkPreviewResponse & { readonly type: "facebook.photo" }
): ReactElement | null => {
  if (!photo.photo) {
    return null;
  }

  const targetPhoto = photo.photo;

  return (
    <FacebookCardContainer href={href} canonicalUrl={canonicalUrl} type="facebook.photo">
      <div className="tw-flex tw-flex-col tw-gap-3">
        {targetPhoto.image && (
          <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/60">
            <Image
              src={targetPhoto.image}
              alt="Image from Facebook photo"
              width={1200}
              height={1200}
              className="tw-h-full tw-w-full tw-object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 320px"
              unoptimized
            />
          </div>
        )}
        {targetPhoto.caption && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-leading-relaxed">
            {targetPhoto.caption}
          </p>
        )}
      </div>
    </FacebookCardContainer>
  );
};

const renderPage = (
  href: string,
  canonicalUrl: string | null | undefined,
  page: FacebookLinkPreviewResponse & { readonly type: "facebook.page" }
): ReactElement | null => {
  if (!page.page) {
    return null;
  }

  const targetPage = page.page;

  return (
    <FacebookCardContainer href={href} canonicalUrl={canonicalUrl} type="facebook.page">
      <div className="tw-flex tw-flex-col tw-gap-3">
        {targetPage.banner && (
          <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/60">
            <Image
              src={targetPage.banner}
              alt="Image from Facebook page"
              width={1200}
              height={480}
              className="tw-h-full tw-w-full tw-object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 320px"
              unoptimized
            />
          </div>
        )}
        <div className="tw-flex tw-items-center tw-gap-3">
          {targetPage.avatar && (
            <div className="tw-h-16 tw-w-16 tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/60">
              <Image
                src={targetPage.avatar}
                alt="Image from Facebook page"
                width={128}
                height={128}
                className="tw-h-full tw-w-full tw-object-cover"
                loading="lazy"
                sizes="64px"
                unoptimized
              />
            </div>
          )}
          <div className="tw-flex tw-flex-col tw-gap-1">
            {targetPage.name && (
              <span className="tw-text-lg tw-font-semibold tw-text-iron-100">
                {targetPage.name}
              </span>
            )}
            {targetPage.about && (
              <span className="tw-text-sm tw-text-iron-300">{targetPage.about}</span>
            )}
          </div>
        </div>
      </div>
    </FacebookCardContainer>
  );
};

const renderUnavailable = (
  href: string,
  canonicalUrl: string | null | undefined,
  reason: FacebookLinkPreviewResponse & { readonly type: "facebook.unavailable" }
): ReactElement => {
  const message = UNAVAILABLE_COPY[reason.reason] ?? UNAVAILABLE_COPY.error;
  const targetUrl = canonicalUrl ?? href;

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">Facebook preview unavailable</span>
          <span className="tw-text-xs tw-text-iron-400">{message}</span>
        </div>
        <div className="tw-flex tw-justify-end">
          <FacebookActionButton
            href={targetUrl}
            label="Open on Facebook"
            ariaLabel="Open this Facebook link"
          />
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
};

const isPayload = <T extends FacebookPreviewType>(
  preview: FacebookLinkPreviewResponse,
  type: T
): preview is FacebookLinkPreviewResponse & { type: T } => {
  return preview.type === type;
};

export default function FacebookPreview({ href, preview }: FacebookPreviewProps) {
  if (isPayload(preview, "facebook.post")) {
    return renderPost(href, preview.canonicalUrl, preview.post);
  }

  if (isPayload(preview, "facebook.video")) {
    return renderVideo(href, preview.canonicalUrl, preview);
  }

  if (isPayload(preview, "facebook.photo")) {
    return renderPhoto(href, preview.canonicalUrl, preview);
  }

  if (isPayload(preview, "facebook.page")) {
    return renderPage(href, preview.canonicalUrl, preview);
  }

  if (isPayload(preview, "facebook.unavailable")) {
    return renderUnavailable(href, preview.canonicalUrl, preview);
  }

  return null;
}
