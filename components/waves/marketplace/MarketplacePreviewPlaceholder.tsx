"use client";

import { useLinkPreviewVariant } from "../LinkPreviewContext";
import { LinkPreviewCardLayout } from "../OpenGraphPreview";

import {
  getMarketplaceContainerClass,
  MARKETPLACE_MEDIA_FRAME_CLASS,
} from "./previewLayout";

import type { MarketplaceTypePreviewProps } from "./common";

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
              className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-bg-black/60 tw-px-3 tw-py-2.5"
              data-testid="marketplace-preview-placeholder-footer"
            >
              <div className="tw-h-4 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-700/50" />
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-h-6 tw-w-16 tw-animate-pulse tw-rounded-full tw-bg-iron-700/50" />
                <div className="tw-size-8 tw-animate-pulse tw-rounded-full tw-bg-iron-700/50" />
                <div className="tw-size-8 tw-animate-pulse tw-rounded-full tw-bg-iron-700/50" />
              </div>
            </div>
          )}
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
