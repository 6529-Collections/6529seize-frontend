"use client";

import type { CSSProperties } from "react";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import HoverCard from "@/components/utils/tooltip/HoverCard";

const INFO_TOOLTIP_STYLE = {
  padding: "6px 10px",
  background: "#37373E",
  color: "white",
  fontSize: "12px",
  fontWeight: 500,
  borderRadius: "6px",
  border: "1px solid #4C4C55",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
} as const satisfies CSSProperties;

export function SidebarCategoryLabel({
  label,
  paddingClassName,
  tooltipContent,
}: {
  readonly label: string;
  readonly paddingClassName: string;
  readonly tooltipContent?: string | undefined;
}) {
  return (
    <div
      className={`${paddingClassName} tw-pb-2 tw-pt-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wide tw-text-iron-500`}
    >
      <span className="tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span>{label}</span>
        {tooltipContent && (
          <span className="tw-relative tw-inline-flex tw-size-3 tw-items-center tw-justify-center">
            <HoverCard
              ariaLabel={tooltipContent}
              placement="top"
              delayShow={100}
              delayHide={120}
              hoverTransitionDelay={80}
              offset={8}
              openOnClick
              closeOnContentClick
              stopClickPropagation
              triggerDisplay="inline-flex"
              contentStyle={INFO_TOOLTIP_STYLE}
              content={
                <span className="tw-block tw-max-w-48">{tooltipContent}</span>
              }
            >
              <button
                type="button"
                aria-label={tooltipContent}
                className="tw-absolute tw-left-1/2 tw-top-1/2 tw-inline-flex tw-size-6 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-600 tw-transition-colors focus:tw-text-iron-300 focus:tw-outline-none active:tw-text-iron-300 desktop-hover:hover:tw-text-iron-400"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="tw-size-3" />
              </button>
            </HoverCard>
          </span>
        )}
      </span>
    </div>
  );
}
