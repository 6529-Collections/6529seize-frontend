"use client";

import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { ArtistPreviewTab } from "@/hooks/useArtistPreviewModal";

const TOOLTIP_STYLES = {
  backgroundColor: "#1F2937",
  color: "white",
  padding: "6px 12px",
  fontSize: "12px",
  zIndex: 50,
  boxShadow: "0 4px 16px 0 rgba(0,0,0,0.30), 0 2px 8px 0 rgba(55,55,62,0.25)",
} as const;

interface ArtistActivityBadgeProps {
  readonly submissionCount: number;
  readonly winCount: number;
  readonly onBadgeClick: (tab: ArtistPreviewTab) => void;
  readonly tooltipId?: string | undefined;
}

export const ArtistActivityBadge: React.FC<ArtistActivityBadgeProps> = ({
  submissionCount,
  winCount,
  onBadgeClick,
  tooltipId = "artist-activity-badge",
}) => {
  const isMobile = useIsMobileDevice();
  const { hasTouchScreen } = useDeviceInfo();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

  const hasSubmissions = submissionCount > 0;
  const hasWins = winCount > 0;

  if (!hasSubmissions && !hasWins) return null;

  const hasBoth = hasSubmissions && hasWins;
  const initialTab: ArtistPreviewTab = hasSubmissions ? "active" : "winners";

  const tooltipContent = hasBoth
    ? `View ${submissionCount} art submission${
        submissionCount === 1 ? "" : "s"
      } and ${winCount} winning artwork${winCount === 1 ? "" : "s"}`
    : hasSubmissions
      ? `View ${submissionCount} art submission${
          submissionCount === 1 ? "" : "s"
        }`
      : `View ${winCount} winning artwork${winCount === 1 ? "" : "s"}`;

  const ariaLabel = tooltipContent;

  const dataTooltipId =
    !isMobile && !hasTouchScreen ? uniqueTooltipId : undefined;

  const isPaletteBase = hasSubmissions;

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTooltipOpen(false);
          onBadgeClick(initialTab);
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className={
          isPaletteBase
            ? "tw-relative tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-md tw-border tw-border-solid tw-border-blue-400/40 tw-bg-gradient-to-br tw-from-blue-800 tw-to-blue-900 tw-text-blue-100/90 tw-shadow-[0_1px_3px_rgba(0,0,0,0.45)] tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-from-blue-700 desktop-hover:hover:tw-to-blue-800 desktop-hover:hover:tw-scale-[1.05] focus:tw-ring-1 focus:tw-ring-blue-300/40"
            : "tw-relative tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-md tw-border tw-border-solid tw-border-amber-400/20 tw-bg-amber-400/10 tw-text-amber-300 tw-shadow-[inset_0_0_2px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.25)] tw-transition-all tw-duration-200 desktop-hover:hover:tw-border-amber-400/30 desktop-hover:hover:tw-bg-amber-900/30 desktop-hover:hover:tw-scale-[1.05] desktop-hover:hover:tw-shadow-[inset_0_0_3px_rgba(255,255,255,0.12),0_2px_6px_rgba(0,0,0,0.3)] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-amber-400/50 focus-visible:tw-ring-offset-2"
        }
        aria-label={ariaLabel}
        aria-expanded="false"
        aria-haspopup="dialog"
        {...(dataTooltipId && { "data-tooltip-id": dataTooltipId })}
      >
        <FontAwesomeIcon
          icon={isPaletteBase ? faPalette : faTrophy}
          className={
            isPaletteBase
              ? "tw-w-2.5 tw-h-2.5 tw-text-white tw-flex-shrink-0"
              : "tw-w-2.5 tw-h-2.5 tw-text-amber-400 tw-flex-shrink-0 desktop-hover:hover:tw-text-amber-300/90"
          }
        />

        {hasBoth && (
          <span
            className="tw-pointer-events-none tw-absolute tw--top-1 tw--right-1 tw-size-2 tw-rounded-full tw-bg-amber-400 tw-border tw-border-iron-900 tw-shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
            aria-hidden="true"
          />
        )}
      </button>

      {!isMobile && !hasTouchScreen && (
        <Tooltip
          id={uniqueTooltipId}
          place="top"
          positionStrategy="absolute"
          content={tooltipContent}
          delayShow={300}
          opacity={1}
          style={TOOLTIP_STYLES}
          isOpen={isTooltipOpen}
        />
      )}
    </>
  );
};

