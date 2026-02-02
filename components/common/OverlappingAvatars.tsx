"use client";

import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useId } from "react";
import { Tooltip } from "react-tooltip";

export interface OverlappingAvatarItem {
  readonly key: string;
  readonly pfpUrl: string | null;
  readonly href?: string;
  readonly ariaLabel?: string;
  readonly fallback?: string;
  readonly title?: string;
}

interface OverlappingAvatarsProps {
  readonly items: OverlappingAvatarItem[];
  readonly maxCount?: number;
  readonly size?: "sm" | "md";
  readonly overlapClass?: string;
  readonly onItemClick?: (
    e: MouseEvent<HTMLAnchorElement>,
    item: OverlappingAvatarItem
  ) => void;
}

const SIZE_CLASS = {
  sm: "tw-h-6 tw-w-6",
  md: "tw-h-7 tw-w-7",
} as const;

export default function OverlappingAvatars({
  items,
  maxCount = 5,
  size = "md",
  overlapClass = "-tw-space-x-2",
  onItemClick,
}: OverlappingAvatarsProps) {
  const baseId = useId();
  const isTouchDevice = useIsTouchDevice();
  const slice = items.slice(0, maxCount);
  const sizeClass = SIZE_CLASS[size];
  const avatarRing =
    "tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black tw-object-cover";
  const wrapperHover =
    "tw-transition-transform tw-duration-200 tw-ease-out hover:tw-scale-110 hover:!tw-z-[100]";

  return (
    <div
      className={`tw-flex tw-items-center tw-overflow-visible ${overlapClass}`}
    >
      {slice.map((item, index) => {
        let transformOrigin: string;
        if (index === 0) transformOrigin = "left center";
        else if (index === slice.length - 1) transformOrigin = "right center";
        else transformOrigin = "center center";

        const content = item.pfpUrl ? (
          <img
            src={getScaledImageUri(item.pfpUrl, ImageScale.W_AUTO_H_50)}
            alt={item.ariaLabel ?? "Profile"}
            loading="lazy"
            decoding="async"
            className={`tw-h-full tw-w-full tw-flex-shrink-0 tw-rounded-md ${avatarRing}`}
          />
        ) : (
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-700 tw-ring-[1.5px] tw-ring-black">
            <span className="tw-text-[0.625rem] tw-font-semibold tw-text-iron-300">
              {item.fallback ?? "?"}
            </span>
          </div>
        );

        const showTooltip =
          !isTouchDevice && item.title !== undefined && item.title !== "";
        const tooltipId = showTooltip ? `${baseId}-${index}` : undefined;
        const wrapper = (
          <div
            key={item.key}
            className={`tw-relative tw-flex-shrink-0 tw-overflow-visible ${sizeClass} ${wrapperHover}`}
            style={{
              zIndex: slice.length - index,
              transformOrigin,
            }}
            {...(tooltipId !== undefined && { "data-tooltip-id": tooltipId })}
          >
            {content}
          </div>
        );

        const anchor = item.href ? (
          <Link
            key={item.key}
            href={item.href}
            className="tw-m-0 tw-inline-flex tw-border-none tw-bg-transparent tw-p-0"
            aria-label={item.ariaLabel}
            onClick={(e) => onItemClick?.(e, item)}
          >
            {wrapper}
          </Link>
        ) : (
          wrapper
        );

        if (showTooltip && tooltipId !== undefined) {
          return (
            <span key={item.key} className="tw-inline-flex">
              {anchor}
              <Tooltip
                id={tooltipId}
                place="top"
                delayShow={250}
                style={TOOLTIP_STYLES}
              >
                {item.title}
              </Tooltip>
            </span>
          );
        }
        return anchor;
      })}
    </div>
  );
}
