"use client";

import Link from "next/link";

import { removeBaseEndpoint } from "@/helpers/Helpers";
import { useLinkPreviewVariant } from "../LinkPreviewContext";
import { LinkPreviewCardLayout } from "../OpenGraphPreview";
import type { MarketplaceTypePreviewProps } from "./common";
import {
  getMarketplaceContainerClass,
  MARKETPLACE_MEDIA_FRAME_CLASS,
} from "./previewLayout";

export default function MarketplaceUnavailableCard({
  href,
  compact = false,
}: MarketplaceTypePreviewProps) {
  const variant = useLinkPreviewVariant();
  const relative = removeBaseEndpoint(href);
  const isRelativeHref =
    typeof relative === "string" && relative.startsWith("/");
  const resolvedHref = isRelativeHref ? relative : href;
  const target = isRelativeHref ? undefined : "_blank";
  const rel = isRelativeHref ? undefined : "noopener noreferrer";

  return (
    <LinkPreviewCardLayout href={href} variant={variant} hideActions>
      <div
        className={`${getMarketplaceContainerClass(variant, compact)} tw-relative`}
        data-testid="marketplace-preview-unavailable"
      >
        <Link
          href={resolvedHref}
          target={target}
          rel={rel}
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
            <div
              className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-bg-black/60 tw-px-3 tw-py-2.5"
              data-testid="marketplace-preview-unavailable-footer"
            >
              <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-white">
                Preview unavailable
              </span>
              <span className="tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/50 tw-text-white">
                <svg
                  className="tw-size-3.5 tw-flex-shrink-0"
                  viewBox="0 0 64 64"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32" />
                  <polyline points="40.32 8.6 55.4 8.6 55.4 24.18" />
                  <line x1="19.32" y1="45.72" x2="54.61" y2="8.91" />
                </svg>
              </span>
            </div>
          )}
        </Link>
      </div>
    </LinkPreviewCardLayout>
  );
}
