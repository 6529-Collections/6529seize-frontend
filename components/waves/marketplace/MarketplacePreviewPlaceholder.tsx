"use client";

import { useLinkPreviewVariant } from "../LinkPreviewContext";
import { LinkPreviewCardLayout } from "../OpenGraphPreview";
import type { MarketplaceTypePreviewProps } from "./common";
import {
  getMarketplaceContainerClass,
  MARKETPLACE_MEDIA_FRAME_CLASS,
  getMarketplaceTitleRowClass,
} from "./previewLayout";

export default function MarketplacePreviewPlaceholder({
  href,
  compact = false,
}: MarketplaceTypePreviewProps) {
  const variant = useLinkPreviewVariant();

  return (
    <LinkPreviewCardLayout href={href} variant={variant} hideActions>
      <div
        className={`${getMarketplaceContainerClass(variant, compact)} tw-relative`}
        data-testid="marketplace-preview-placeholder"
      >
        <div className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden">
          <div
            className={`${MARKETPLACE_MEDIA_FRAME_CLASS} tw-relative tw-overflow-hidden`}
            data-testid="marketplace-preview-placeholder-media"
          >
            <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-gradient-to-br tw-from-iron-900/60 tw-via-iron-800/40 tw-to-iron-900/60" />
          </div>

          {!compact && (
            <div
              className={getMarketplaceTitleRowClass(variant)}
              data-testid="marketplace-preview-placeholder-title-row"
            >
              <div className="tw-h-4 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-iron-700/60" />
            </div>
          )}
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
