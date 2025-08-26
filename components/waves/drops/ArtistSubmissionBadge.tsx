"use client"

import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "../../../hooks/isMobileDevice";

// Tooltip styles - extracted to prevent re-creation on each render
const TOOLTIP_STYLES = {
  backgroundColor: "#1F2937",
  color: "white",
  padding: "6px 12px",
  fontSize: "12px",
  zIndex: 50,
  boxShadow: "0 4px 16px 0 rgba(0,0,0,0.30), 0 2px 8px 0 rgba(55,55,62,0.25)",
} as const;

interface ArtistSubmissionBadgeProps {
  readonly submissionCount: number;
  readonly onBadgeClick?: () => void;
  readonly tooltipId?: string;
}

export const ArtistSubmissionBadge: React.FC<ArtistSubmissionBadgeProps> = ({
  submissionCount,
  onBadgeClick,
  tooltipId = "submission-badge",
}) => {
  const isMobile = useIsMobileDevice();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

  if (submissionCount === 0) return null;

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
        className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 md:tw-w-5 md:tw-h-5
        tw-rounded-md tw-border tw-border-solid tw-border-indigo-400/40
        tw-bg-gradient-to-br tw-from-indigo-800 tw-to-indigo-900
        tw-text-indigo-100/90
        tw-shadow-[0_1px_3px_rgba(0,0,0,0.45)]
        tw-transition-all tw-duration-200 tw-ease-out
        desktop-hover:hover:tw-from-indigo-700
        desktop-hover:hover:tw-to-indigo-800
        desktop-hover:hover:tw-scale-[1.05]
        focus:tw-ring-1 focus:tw-ring-indigo-300/40"
        aria-label={`View ${submissionCount} art submission${
          submissionCount === 1 ? "" : "s"
        }`}
        aria-expanded="false"
        aria-haspopup="dialog"
        data-tooltip-id={!isMobile ? uniqueTooltipId : undefined}
      >
        <FontAwesomeIcon
          icon={faPalette}
          className="tw-w-3.5 tw-h-3.5 md:tw-w-3 md:tw-h-3 tw-text-white tw-flex-shrink-0"
        />
      </button>

      {/* Tooltip - only on non-touch devices */}
      {!isMobile && (
        <Tooltip
          id={uniqueTooltipId}
          place="top"
          positionStrategy="absolute"
          content={`View ${submissionCount} art submission${
            submissionCount === 1 ? "" : "s"
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
