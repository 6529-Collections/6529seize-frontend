"use client";

import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "@/hooks/isMobileDevice";

const TOOLTIP_STYLES = {
  backgroundColor: "#1F2937",
  color: "white",
  padding: "6px 12px",
  fontSize: "12px",
  zIndex: 50,
  boxShadow: "0 4px 16px 0 rgba(0,0,0,0.30), 0 2px 8px 0 rgba(55,55,62,0.25)",
} as const;

interface WaveCreatorBadgeProps {
  readonly tooltipId?: string | undefined;
  readonly onBadgeClick?: (() => void) | undefined;
}

export const WaveCreatorBadge: React.FC<WaveCreatorBadgeProps> = ({
  tooltipId = "wave-creator-badge",
  onBadgeClick,
}) => {
  const isMobile = useIsMobileDevice();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

  const dataTooltipId = isMobile && uniqueTooltipId;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTooltipOpen(false);
          onBadgeClick?.();
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className="tw-inline-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-blue-400/20 tw-bg-blue-400/10 tw-text-xs tw-text-blue-300 tw-shadow-[inset_0_0_2px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.25)] tw-outline-none tw-ring-0 tw-transition-all tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-blue-400/50 focus-visible:tw-ring-offset-2 desktop-hover:hover:tw-scale-[1.05] desktop-hover:hover:tw-border-blue-400/30 desktop-hover:hover:tw-bg-blue-900/30 desktop-hover:hover:tw-shadow-[inset_0_0_3px_rgba(255,255,255,0.12),0_2px_6px_rgba(0,0,0,0.3)] md:tw-h-5 md:tw-w-5"
        aria-label="View created waves"
        {...(typeof dataTooltipId === "string" && {
          "data-tooltip-id": dataTooltipId,
        })}
      >
        <FontAwesomeIcon
          icon={faWater}
          className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-blue-400 desktop-hover:hover:tw-text-blue-300/90 md:tw-h-2.5 md:tw-w-2.5"
        />
      </button>
      {!isMobile && (
        <Tooltip
          id={uniqueTooltipId}
          place="top"
          positionStrategy="absolute"
          content="View created waves"
          delayShow={300}
          opacity={1}
          style={TOOLTIP_STYLES}
          isOpen={isTooltipOpen}
        />
      )}
    </>
  );
};
