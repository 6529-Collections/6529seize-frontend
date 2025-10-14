"use client";

import clsx from "clsx";

import { FallbackImage } from "@/components/common/FallbackImage";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import {
  xtdhIsCollectionNewlyAllocated,
  xtdhIsCollectionTrending,
} from "../utils";

type BadgeVariant = "trending" | "new" | "mine";

interface StatusBadge {
  readonly label: string;
  readonly variant: BadgeVariant;
}

export interface XtdhReceivedCollectionCardSummaryProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly className?: string;
}

function getBadgeStyles(variant: BadgeVariant) {
  switch (variant) {
    case "trending":
      return "tw-border-primary-400/40 tw-bg-primary-500/15 tw-text-primary-200";
    case "new":
      return "tw-border-iron-700 tw-bg-iron-850 tw-text-iron-200";
    case "mine":
      return "tw-border-success/40 tw-bg-success/10 tw-text-success";
    default:
      return "";
  }
}

function getStatusBadges(
  collection: XtdhReceivedCollectionSummary,
): StatusBadge[] {
  const badges: StatusBadge[] = [];

  if (xtdhIsCollectionTrending(collection)) {
    badges.push({ label: "Trending", variant: "trending" });
  }

  if (xtdhIsCollectionNewlyAllocated(collection)) {
    badges.push({ label: "New", variant: "new" });
  }

  if (collection.isGrantedByUser) {
    badges.push({ label: "Mine", variant: "mine" });
  }

  return badges;
}

/**
 * Renders the collection preview image, title, and status badges.
 */
export function XtdhReceivedCollectionCardSummary({
  collection,
  className,
}: XtdhReceivedCollectionCardSummaryProps) {
  const badges = getStatusBadges(collection);

  return (
    <div className={clsx("tw-flex tw-items-start tw-gap-3 tw-min-w-0", className)}>
      <FallbackImage
        primarySrc={collection.collectionImage}
        fallbackSrc="/pebbles-loading.jpeg"
        alt={`${collection.collectionName} cover`}
        className="tw-h-16 tw-w-16 tw-flex-shrink-0 tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-900 tw-object-cover"
      />
      <div className="tw-min-w-0 tw-flex-1 tw-space-y-1">
        <CustomTooltip
          content={collection.collectionName}
          placement="top"
          disabled={!collection.collectionName}
        >
          <span
            className="tw-block tw-truncate tw-whitespace-nowrap tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50"
            title={collection.collectionName}
          >
            {collection.collectionName}
          </span>
        </CustomTooltip>
        {badges.length > 0 && (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={clsx(
                  "tw-inline-flex tw-items-center tw-rounded-full tw-border tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-leading-tight",
                  getBadgeStyles(badge.variant),
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
