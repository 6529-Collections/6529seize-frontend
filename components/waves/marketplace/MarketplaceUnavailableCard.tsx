"use client";

import Link from "next/link";

import { useLinkPreviewVariant } from "../LinkPreviewContext";
import { LinkPreviewCardLayout } from "../OpenGraphPreview";
import type { MarketplaceTypePreviewProps } from "./common";
import {
  getMarketplaceContainerClass,
  MARKETPLACE_MEDIA_FRAME_CLASS,
  getMarketplaceTitleRowClass,
} from "./previewLayout";

export default function MarketplaceUnavailableCard({
  href,
  compact = false,
}: MarketplaceTypePreviewProps) {
  const variant = useLinkPreviewVariant();

  return (
    <LinkPreviewCardLayout href={href} variant={variant} hideActions>
      <div
        className={`${getMarketplaceContainerClass(variant, compact)} tw-relative`}
        data-testid="marketplace-preview-unavailable"
      >
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
          className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-no-underline"
        >
          <div
            className={`${MARKETPLACE_MEDIA_FRAME_CLASS} tw-flex tw-items-center tw-justify-center tw-bg-iron-900/50 tw-p-4`}
            data-testid="marketplace-preview-unavailable-media"
          >
            <span className="tw-text-center tw-text-sm tw-font-medium tw-text-iron-300">
              Preview unavailable
            </span>
          </div>

          {!compact && (
            <div className={getMarketplaceTitleRowClass(variant)}>
              <span className="tw-block tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-400">
                Preview unavailable
              </span>
            </div>
          )}
        </Link>
      </div>
    </LinkPreviewCardLayout>
  );
}
