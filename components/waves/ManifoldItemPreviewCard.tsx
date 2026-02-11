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
}

function getContainerClass(variant: LinkPreviewVariant): string {
  if (variant === "home") {
    return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30";
  }

  return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40";
}

function getTitleRowClass(variant: LinkPreviewVariant): string {
  if (variant === "home") {
    return "tw-border-t tw-border-solid tw-border-white/10 tw-bg-black/70 tw-px-4 tw-py-2.5";
  }

  return "tw-border-t tw-border-solid tw-border-iron-700 tw-bg-iron-900/85 tw-px-4 tw-py-2.5";
}

export default function ManifoldItemPreviewCard({
  href,
  title,
  mediaUrl,
  mediaMimeType,
}: ManifoldItemPreviewCardProps) {
  const variant = useLinkPreviewVariant();

  return (
    <LinkPreviewCardLayout href={href} variant={variant}>
      <div
        className={getContainerClass(variant)}
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
            className="tw-relative tw-aspect-[16/9] tw-min-h-[10rem] tw-w-full tw-bg-black/70 md:tw-min-h-[11rem]"
            data-testid="manifold-item-media"
          >
            <MediaDisplay
              media_mime_type={mediaMimeType}
              media_url={mediaUrl}
              disableMediaInteraction={true}
            />
          </div>
          <div className={getTitleRowClass(variant)}>
            <h3
              className="tw-m-0 tw-line-clamp-2 tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50"
              data-testid="manifold-item-title"
            >
              {title}
            </h3>
          </div>
        </Link>
      </div>
    </LinkPreviewCardLayout>
  );
}
