"use client";

import Link from "next/link";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import {
  useLinkPreviewVariant,
  type LinkPreviewVariant,
} from "./LinkPreviewContext";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";

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
    return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-black";
  }

  return "tw-w-full tw-overflow-hidden tw-bg-iron-950";
}

function getTitleRowClass(variant: LinkPreviewVariant): string {
  if (variant === "home") {
    return "tw-bg-black/80 tw-px-3 tw-py-2";
  }

  return "tw-bg-iron-950 tw-px-3 tw-py-1.5";
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
    <LinkPreviewCardLayout
      href={href}
      variant={variant}
      hideActions={hideActions}
    >
      <div
        className={getContainerClass(variant, imageOnly)}
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
            className="tw-relative tw-aspect-[16/9] tw-min-h-[14rem] tw-w-full tw-bg-iron-950 md:tw-min-h-[15rem]"
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
      </div>
    </LinkPreviewCardLayout>
  );
}
