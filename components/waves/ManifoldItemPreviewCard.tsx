"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import {
  useLinkPreviewVariant,
  type LinkPreviewVariant,
} from "./LinkPreviewContext";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";
import { removeBaseEndpoint } from "@/helpers/Helpers";

interface ManifoldItemPreviewCardProps {
  readonly href: string;
  readonly title: string;
  readonly mediaUrl: string;
  readonly mediaMimeType: string;
  readonly imageOnly?: boolean | undefined;
  readonly hideActions?: boolean | undefined;
}

function getContainerClass(
  variant: LinkPreviewVariant,
  imageOnly: boolean
): string {
  if (imageOnly) {
    if (variant === "home") {
      return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-black/30";
    }

    return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-900/40";
  }

  if (variant === "home") {
    return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-950/50";
  }

  return "tw-w-full tw-overflow-hidden tw-bg-inherit";
}

function getTitleRowClass(variant: LinkPreviewVariant): string {
  if (variant === "home") {
    return "tw-bg-iron-950/50 tw-px-3 tw-py-2";
  }

  return "tw-py-1.5";
}

function OverlayActionButtons({ href }: { readonly href: string }) {
  const [copied, setCopied] = useState(false);

  const relative = removeBaseEndpoint(href);
  const relativeHref =
    typeof relative === "string" && relative.startsWith("/")
      ? relative
      : undefined;

  const stop = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const copyToClipboard = (e: MouseEvent<HTMLButtonElement>) => {
    stop(e);
    void navigator.clipboard
      .writeText(href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 500);
      })
      .catch(() => {
        // Ignore clipboard write failures (e.g. missing permissions).
      });
  };

  return (
    <div className="tw-absolute tw-right-3 tw-top-3 tw-z-10 tw-flex tw-flex-col tw-gap-2">
      <button
        type="button"
        className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-backdrop-blur-md tw-transition-colors tw-duration-150"
        onClick={copyToClipboard}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg
          className="tw-size-3.5 tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={copied ? "#34d399" : "currentColor"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      </button>
      <Link
        href={relativeHref ?? href}
        target={relativeHref ? undefined : "_blank"}
        className="tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-no-underline tw-backdrop-blur-md tw-transition-colors tw-duration-150"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg
          className="tw-size-3.5 tw-flex-shrink-0"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
        >
          <path d="M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32" />
          <polyline points="40.32 8.6 55.4 8.6 55.4 24.18" />
          <line x1="19.32" y1="45.72" x2="54.61" y2="8.91" />
        </svg>
      </Link>
    </div>
  );
}

export default function ManifoldItemPreviewCard({
  href,
  title,
  mediaUrl,
  mediaMimeType,
  imageOnly = false,
  hideActions = false,
}: ManifoldItemPreviewCardProps) {
  const variant = useLinkPreviewVariant();

  return (
    <LinkPreviewCardLayout href={href} variant={variant} hideActions>
      <div
        className={`${getContainerClass(variant, imageOnly)} tw-relative`}
        data-testid="manifold-item-card"
      >
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
          className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-no-underline"
        >
          <div
            className="tw-aspect-[16/9] tw-min-h-[14rem] tw-w-full tw-bg-inherit md:tw-min-h-[15rem]"
            data-testid="manifold-item-media"
          >
            <MediaDisplay
              media_mime_type={mediaMimeType}
              media_url={mediaUrl}
              disableMediaInteraction={true}
            />
          </div>
          {!imageOnly && (
            <div className={getTitleRowClass(variant)}>
              <h3
                className="tw-mb-0 tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-200"
                data-testid="manifold-item-title"
              >
                {title}
              </h3>
            </div>
          )}
        </Link>
        {!hideActions && <OverlayActionButtons href={href} />}
      </div>
    </LinkPreviewCardLayout>
  );
}
