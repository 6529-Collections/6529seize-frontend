import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "../../../hooks/isMobileDevice";

// Tooltip styles - extracted to prevent re-creation on each render
const TOOLTIP_STYLES = {
  backgroundColor: "#37373E",
  color: "white",
  padding: "6px 12px",
  fontSize: "12px",
  zIndex: 99,
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

  if (submissionCount === 0) return null;

  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBadgeClick?.();
        }}
        className="tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 md:tw-w-5 md:tw-h-5 tw-bg-gradient-to-br tw-from-purple-800 tw-to-purple-900 tw-text-white tw-rounded-md tw-border tw-border-solid tw-border-purple-700 tw-shadow-sm tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-from-purple-700 desktop-hover:hover:tw-to-purple-800 desktop-hover:hover:tw-shadow-md desktop-hover:hover:tw-border-purple-600 tw-cursor-pointer focus:tw-ring-2 focus:tw-ring-purple-600 focus:tw-ring-opacity-50"
        aria-label={`View ${submissionCount} art submission${
          submissionCount === 1 ? "" : "s"
        }`}
        aria-expanded="false"
        aria-haspopup="dialog"
        data-tooltip-id={!isMobile ? uniqueTooltipId : undefined}
      >
        <FontAwesomeIcon
          icon={faPalette}
          className="tw-w-3.5 tw-h-3.5 md:tw-w-3 md:tw-h-3 tw-text-white tw-drop-shadow-sm"
        />
      </button>

      {/* Tooltip - only on non-touch devices */}
      {!isMobile && (
        <Tooltip
          id={uniqueTooltipId}
          place="top"
          positionStrategy="fixed"
          content={`View ${submissionCount} art submission${
            submissionCount === 1 ? "" : "s"
          }`}
          delayShow={300}
          opacity={1}
          style={TOOLTIP_STYLES}
        />
      )}
    </>
  );
};
