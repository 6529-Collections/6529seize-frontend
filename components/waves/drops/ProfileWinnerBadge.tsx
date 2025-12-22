"use client"

import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "@/hooks/isMobileDevice";

// Tooltip styles - extracted to prevent re-creation on each render
const TOOLTIP_STYLES = {
  backgroundColor: "#1F2937",
  color: "white",
  padding: "6px 12px",
  fontSize: "12px",
  zIndex: 50,
  boxShadow: "0 4px 16px 0 rgba(0,0,0,0.30), 0 2px 8px 0 rgba(55,55,62,0.25)",
} as const;

interface ProfileWinnerBadgeProps {
  readonly winCount: number;
  readonly title?: string;
  readonly tooltipId?: string;
  readonly onBadgeClick?: () => void;
}

export const ProfileWinnerBadge: React.FC<ProfileWinnerBadgeProps> = ({
  winCount,
  title = "View winning artworks",
  tooltipId = "winner-badge",
  onBadgeClick,
}) => {
  const isMobile = useIsMobileDevice();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);


  if (winCount === 0) return null;

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTooltipOpen(false);
          onBadgeClick?.();
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className="tw-w-6 tw-h-6 md:tw-w-5 md:tw-h-5 tw-outline-none tw-ring-0 tw-inline-flex tw-items-center tw-justify-center
       tw-rounded-md tw-border tw-border-solid tw-border-amber-400/20
        tw-bg-amber-400/10 tw-text-amber-300 tw-text-xs
        tw-shadow-[inset_0_0_2px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.25)]
        tw-transition-all tw-duration-200
        desktop-hover:hover:tw-border-amber-400/30
        desktop-hover:hover:tw-bg-amber-900/30
        desktop-hover:hover:tw-scale-[1.05]
        desktop-hover:hover:tw-shadow-[inset_0_0_3px_rgba(255,255,255,0.12),0_2px_6px_rgba(0,0,0,0.3)]
        focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-amber-400/50 focus-visible:tw-ring-offset-2"
        aria-label={`View ${winCount} winning artwork${
          winCount === 1 ? "" : "s"
        }`}
        data-tooltip-id={!isMobile ? uniqueTooltipId : undefined}
      >
        <FontAwesomeIcon
          icon={faTrophy}
          className="tw-w-3 tw-h-3 md:tw-w-2.5 md:tw-h-2.5 tw-text-amber-400 tw-flex-shrink-0
        desktop-hover:hover:tw-text-amber-300/90"
        />
      </button>
      {!isMobile && (
        <Tooltip
          id={uniqueTooltipId}
          place="top"
          positionStrategy="absolute"
          content={`View ${winCount} winning artwork${
            winCount === 1 ? "" : "s"
          }`}
          delayShow={300}
          opacity={1}
          style={TOOLTIP_STYLES}
          isOpen={isTooltipOpen}
        />
      )}
    </>
  );
};
